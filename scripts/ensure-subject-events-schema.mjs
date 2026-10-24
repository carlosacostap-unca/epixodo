import fs from "node:fs";
import path from "node:path";

const env = loadEnv([path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(/\/+$/, "");
let tokenCache = null;
if (!baseUrl) throw new Error("Missing PocketBase URL.");

await request("/api/health", { auth: false });
let collection = await request("/api/collections/subject_events");
const kind = collection.fields.find((field) => field.name === "kind");
if (kind?.type !== "select" || !["milestone", "deadline"].every((value) => kind.values.includes(value))) {
  throw new Error("subject_events.kind is not the expected event type selector.");
}
const fields = collection.fields.map((field) => field.name === "kind"
  ? { ...field, values: [...new Set([...field.values, "event"])] }
  : field);
for (const name of ["start_time", "end_time"]) {
  const existing = fields.find((field) => field.name === name);
  if (existing && (existing.type !== "text" || existing.required)) {
    throw new Error(`subject_events.${name} must be optional text.`);
  }
  if (!existing) fields.push({
    name, type: "text", required: false, min: 0, max: 5,
    pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$",
  });
}
if (JSON.stringify(fields) !== JSON.stringify(collection.fields)) {
  collection = await request(`/api/collections/${encodeURIComponent(collection.id)}`, {
    method: "PATCH", body: { fields },
  });
  console.log("Added timed events to subject_events without modifying existing records.");
}
const verified = await request("/api/collections/subject_events");
if (!verified.fields.find((field) => field.name === "kind")?.values.includes("event") ||
    !["start_time", "end_time"].every((name) => verified.fields.some((field) => field.name === name && field.type === "text" && !field.required))) {
  throw new Error("PocketBase event schema verification failed.");
}
console.log("PocketBase subject events schema ready.");

async function request(apiPath, options = {}) {
  const response = await fetch(new URL(apiPath, `${baseUrl}/`), {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.auth === false ? {} : { Authorization: `Bearer ${await token()}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`PocketBase ${response.status}: ${payload?.message || response.statusText}`);
  return payload;
}

async function token() {
  if (tokenCache) return tokenCache;
  if (env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN) {
    tokenCache = env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN;
    return tokenCache;
  }
  const identity = env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD || env.PB_ADMIN_PASSWORD;
  if (!identity || !password) throw new Error("Missing PocketBase admin credentials.");
  let lastError;
  for (const endpoint of ["/api/collections/_superusers/auth-with-password", "/api/admins/auth-with-password"]) {
    try {
      const result = await request(endpoint, { method: "POST", auth: false, body: { identity, password } });
      tokenCache = result.token;
      return tokenCache;
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

function loadEnv(files) {
  const result = { ...process.env };
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || result[match[1]] !== undefined) continue;
      const value = match[2].trim();
      result[match[1]] = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1) : value;
    }
  }
  return result;
}
