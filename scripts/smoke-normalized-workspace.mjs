import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const env = loadEnv([path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]);
const pocketBaseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(/\/+$/, "");
const appUrl = (env.EPIXODO_SMOKE_URL || "http://localhost:3000").replace(/\/+$/, "");
if (!pocketBaseUrl) throw new Error("Missing PocketBase URL.");

const adminToken = await authenticateSuperuser();
const users = await pbRequest("/api/collections/users/records?perPage=2&fields=id", { token: adminToken });
const configuredOwner = env.POCKETBASE_SMOKE_USER_ID;
if (!configuredOwner && users.totalItems !== 1) {
  throw new Error(`Expected exactly one user or POCKETBASE_SMOKE_USER_ID, found ${users.totalItems}.`);
}
const ownerId = configuredOwner || users.items[0].id;
const impersonation = await pbRequest(`/api/collections/users/impersonate/${encodeURIComponent(ownerId)}`, {
  method: "POST",
  token: adminToken,
  body: { duration: 600 },
});
if (!impersonation.token) throw new Error("PocketBase did not return an impersonation token.");

const cookie = `epixodo_session=${impersonation.token}`;
const before = await appRequest("GET", cookie);
assertCounts(before);
const smokeTimestamp = new Date().toISOString();
const mutated = structuredClone(before);
mutated.subjects.push({ id: "smoke-subject", name: "Smoke test", parentSubjectId: null, horizon: "short", createdAt: smokeTimestamp, updatedAt: smokeTimestamp });
mutated.phases.push({ id: "smoke-phase", subjectId: "smoke-subject", name: "Smoke phase", plannedStart: "2026-07-26", executedStart: null, plannedEnd: null, executedEnd: null, order: 0, createdAt: smokeTimestamp, updatedAt: smokeTimestamp });
mutated.subjectEvents.push({ id: "smoke-event", subjectId: "smoke-subject", phaseId: "smoke-phase", kind: "milestone", description: "Smoke event", date: "2026-07-26", createdAt: smokeTimestamp, updatedAt: smokeTimestamp });
mutated.tasks.push({ id: "smoke-task", title: "Smoke task", notes: "temporary", status: "pending", subjectIds: ["smoke-subject"], phaseId: "smoke-phase", parentTaskId: null, hacerEl: "2026-07-26", venceEl: null, priority: "normal", completedAt: null, createdAt: smokeTimestamp, updatedAt: smokeTimestamp });
mutated.locationEntries.push({ id: "smoke-location", date: "2026-07-26", startTime: "22:00", endTime: "22:30", plannedLocation: "Smoke", actualLocation: "", notes: "temporary", createdAt: smokeTimestamp, updatedAt: smokeTimestamp });

let mutationVerified = false;
if (env.EPIXODO_SMOKE_READ_ONLY !== "true") {
  try {
    await appRequest("PUT", cookie, mutated);
    const observed = await appRequest("GET", cookie);
    mutationVerified = observed.subjects.some((item) => item.id === "smoke-subject") &&
      observed.phases.some((item) => item.id === "smoke-phase") &&
      observed.subjectEvents.some((item) => item.id === "smoke-event") &&
      observed.tasks.some((item) => item.id === "smoke-task") &&
      observed.locationEntries.some((item) => item.id === "smoke-location");
    if (!mutationVerified) throw new Error("Temporary normalized mutations were not assembled correctly.");
  } finally {
    await appRequest("PUT", cookie, before);
  }
}

const after = await appRequest("GET", cookie);
assertCounts(after);
if (canonicalJson(before) !== canonicalJson(after)) throw new Error("Workspace was not restored after mutation smoke test.");

const legacy = await pbRequest('/api/collections/workspaces/records?perPage=1&filter=key%20%3D%20%22default%22', { token: adminToken });
const legacyHash = crypto.createHash("sha256").update(canonicalJson(legacy.items[0].data)).digest("hex");
const expectedHash = "34de25c289f71e4a11fd84a490b405e87039670049d9bb4e9c3661647d1411be";
if (legacyHash !== expectedHash) throw new Error(`Legacy hash changed: ${legacyHash}`);

console.log(JSON.stringify({
  ownerId,
  subjects: after.subjects.length,
  phases: after.phases.length,
  tasks: after.tasks.length,
  subjectEvents: after.subjectEvents.length,
  locations: after.locationEntries.length,
  mutationVerified,
  readOnly: env.EPIXODO_SMOKE_READ_ONLY === "true",
  legacyHash,
}, null, 2));

async function authenticateSuperuser() {
  if (env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN) return env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN;
  const identity = env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD || env.PB_ADMIN_PASSWORD;
  if (!identity || !password) throw new Error("Missing PocketBase admin credentials.");
  let lastError;
  for (const endpoint of ["/api/collections/_superusers/auth-with-password", "/api/admins/auth-with-password"]) {
    try {
      const result = await pbRequest(endpoint, { method: "POST", body: { identity, password } });
      return result.token;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function pbRequest(apiPath, options = {}) {
  const response = await fetch(new URL(apiPath, `${pocketBaseUrl}/`), {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`PocketBase ${response.status}: ${payload?.message || response.statusText}`);
  return payload;
}

async function appRequest(method, cookie, body) {
  const response = await fetch(`${appUrl}/api/workspace`, {
    method,
    headers: {
      Cookie: cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Epixodo ${response.status}: ${payload?.error || response.statusText}`);
  return payload;
}

function assertCounts(workspace) {
  const expected = { subjects: 49, phases: 12, tasks: 47, subjectEvents: 1, locationEntries: 2 };
  for (const [field, count] of Object.entries(expected)) {
    if (!Array.isArray(workspace[field]) || workspace[field].length !== count) {
      throw new Error(`Unexpected ${field} count: ${workspace[field]?.length}`);
    }
  }
}

function canonicalJson(value) {
  return JSON.stringify(canonical(value));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
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
