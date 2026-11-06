import fs from "node:fs";
import path from "node:path";
import { createRule, ownerRule } from "./normalized-schema-manifest.mjs";

const env = loadEnv([path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(/\/+$/, "");
let tokenCache = null;
if (!baseUrl) throw new Error("Missing PocketBase URL.");

const users = await request(`/api/collections/${encodeURIComponent(env.POCKETBASE_USERS_COLLECTION || "users")}`);
const definition = {
  name: "ideal_day_goals",
  type: "base",
  listRule: ownerRule, viewRule: ownerRule, createRule,
  updateRule: ownerRule, deleteRule: ownerRule,
  fields: [
    { name: "owner", type: "relation", required: true, collectionId: users.id, cascadeDelete: false, minSelect: 1, maxSelect: 1 },
    { name: "client_id", type: "text", required: true, min: 1, max: 160 },
    { name: "client_created_at", type: "date", required: false },
    { name: "client_updated_at", type: "date", required: false },
    { name: "goal_date", type: "text", required: true, min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    { name: "title", type: "text", required: true, min: 1, max: 300 },
    { name: "notes", type: "text", required: false, max: 10000 },
    { name: "completed", type: "bool", required: false },
  ],
  indexes: [
    "CREATE UNIQUE INDEX `idx_ideal_day_goals_owner_client` ON `ideal_day_goals` (`owner`, `client_id`)",
    "CREATE INDEX `idx_ideal_day_goals_owner_date` ON `ideal_day_goals` (`owner`, `goal_date`)",
  ],
};

let collection;
try {
  collection = await request("/api/collections/ideal_day_goals");
} catch (error) {
  if (!error.message.includes("PocketBase 404")) throw error;
  collection = await request("/api/collections", { method: "POST", body: definition });
  console.log("Created PocketBase collection: ideal_day_goals");
}

for (const rule of ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"]) {
  if (collection[rule] !== definition[rule]) throw new Error(`ideal_day_goals: unexpected ${rule}`);
}
for (const expected of definition.fields) {
  const field = collection.fields.find((candidate) => candidate.name === expected.name);
  for (const [key, value] of Object.entries(expected)) {
    if (field?.[key] !== value) throw new Error(`ideal_day_goals.${expected.name}: unexpected ${key}`);
  }
}
for (const index of definition.indexes) {
  if (!collection.indexes.includes(index)) throw new Error("ideal_day_goals: missing identity or date index");
}
console.log("PocketBase ideal-day schema ready.");

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
    } catch (error) {
      lastError = error;
    }
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
      result[match[1]] = ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) ? value.slice(1, -1) : value;
    }
  }
  return result;
}
