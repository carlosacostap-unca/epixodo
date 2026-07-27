import fs from "node:fs";
import path from "node:path";
import { createRule, ownerRule } from "./normalized-schema-manifest.mjs";

const env = loadEnv([path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(/\/+$/, "");
let tokenCache = null;

if (!baseUrl) throw new Error("Missing PocketBase URL.");

const users = await getCollection("users");
if (!users) throw new Error("Missing users collection.");

const conversations = await ensureCollection("companion_conversations", (ids) => ({
  fields: [
    relationField("owner", ids.users, true),
    textField("client_id", true, 160),
    dateField("client_created_at"),
    dateField("client_updated_at"),
    textField("title", true, 80),
  ],
  indexes: [
    "CREATE UNIQUE INDEX `idx_companion_conversations_owner_client` ON `companion_conversations` (`owner`, `client_id`)",
    "CREATE INDEX `idx_companion_conversations_owner_updated` ON `companion_conversations` (`owner`, `client_updated_at`)",
  ],
}), { users: users.id });

await ensureCollection("companion_messages", (ids) => ({
  fields: [
    relationField("owner", ids.users, true),
    textField("client_id", true, 160),
    dateField("client_created_at"),
    dateField("client_updated_at"),
    relationField("conversation", ids.conversations, true, true),
    { name: "role", type: "select", required: true, maxSelect: 1, values: ["user", "assistant"] },
    { name: "content", type: "editor", required: true, convertUrls: false, maxSize: 6500 },
  ],
  indexes: [
    "CREATE UNIQUE INDEX `idx_companion_messages_owner_client` ON `companion_messages` (`owner`, `client_id`)",
    "CREATE INDEX `idx_companion_messages_thread_created` ON `companion_messages` (`owner`, `conversation`, `client_created_at`)",
  ],
}), { users: users.id, conversations: conversations.id });

console.log("PocketBase companion schema ready: 2 collections");

async function ensureCollection(name, definition, ids) {
  const existing = await getCollection(name);
  if (existing) {
    const actual = new Set((existing.fields || []).map((field) => field.name));
    const missing = definition(ids).fields.map((field) => field.name).filter((field) => !actual.has(field));
    if (missing.length) throw new Error(`${name} is missing fields: ${missing.join(", ")}`);
    return existing;
  }
  const detail = definition(ids);
  const created = await request("/api/collections", {
    method: "POST",
    body: {
      name,
      type: "base",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: detail.fields,
      indexes: detail.indexes,
    },
  });
  console.log(`Created PocketBase collection: ${name}`);
  return created;
}

function textField(name, required, max) {
  return { name, type: "text", required, min: required ? 1 : 0, max, pattern: "" };
}

function dateField(name) {
  return { name, type: "date", required: false, min: "", max: "" };
}

function relationField(name, collectionId, required, cascadeDelete = false) {
  return { name, type: "relation", required, collectionId, cascadeDelete, minSelect: required ? 1 : 0, maxSelect: 1 };
}

async function getCollection(name) {
  try {
    return await request(`/api/collections/${encodeURIComponent(name)}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("PocketBase 404")) return null;
    throw error;
  }
}

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
      result[match[1]] = ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) ? value.slice(1, -1) : value;
    }
  }
  return result;
}
