import fs from "node:fs";
import path from "node:path";
import { createRule, normalizedSchema, ownerRule } from "./normalized-schema-manifest.mjs";

const env = loadEnv([path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(/\/+$/, "");
let tokenCache = null;

if (!baseUrl) throw new Error("Missing PocketBase URL.");

const collections = await request("/api/collections?perPage=200");
const byName = new Map(collections.items.map((collection) => [collection.name, collection]));
const errors = [];

for (const [name, expected] of Object.entries(normalizedSchema)) {
  const actual = byName.get(name);
  if (!actual) {
    errors.push(`${name}: missing collection`);
    continue;
  }
  for (const ruleName of ["listRule", "viewRule", "updateRule", "deleteRule"]) {
    if (actual[ruleName] !== ownerRule) errors.push(`${name}: invalid ${ruleName}`);
  }
  if (actual.createRule !== createRule) errors.push(`${name}: invalid createRule`);
  const actualFields = new Map(actual.fields.map((field) => [field.name, field]));
  for (const [fieldName, fieldExpected] of Object.entries(expected.fields)) {
    const field = actualFields.get(fieldName);
    if (!field) {
      errors.push(`${name}.${fieldName}: missing field`);
      continue;
    }
    if (field.type !== fieldExpected.type) errors.push(`${name}.${fieldName}: expected ${fieldExpected.type}, got ${field.type}`);
    if (Boolean(field.required) !== fieldExpected.required) errors.push(`${name}.${fieldName}: required mismatch`);
    if (fieldExpected.target) {
      const target = byName.get(fieldExpected.target);
      if (!target || field.collectionId !== target.id) errors.push(`${name}.${fieldName}: relation target mismatch`);
    }
  }
  const indexes = (actual.indexes || []).join("\n").toLowerCase();
  if (!indexes.includes("owner") || !indexes.includes("client_id")) {
    errors.push(`${name}: missing owner/client identity index`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Normalized PocketBase schema ready: ${Object.keys(normalizedSchema).length} collections`);

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
