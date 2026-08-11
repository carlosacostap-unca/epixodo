import fs from "node:fs";
import path from "node:path";
import { createRule, ownerRule } from "./normalized-schema-manifest.mjs";

const env = loadEnv([
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".env"),
]);
const baseUrl = (env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "").replace(
  /\/+$/,
  "",
);
let tokenCache = null;

if (!baseUrl) throw new Error("Missing PocketBase URL.");

const users = await requireCollection("users");
const subjects = await requireCollection("subjects");
let deliverables = await getCollection("subject_deliverables");

if (!deliverables) {
  deliverables = await request("/api/collections", {
    method: "POST",
    body: {
      name: "subject_deliverables",
      type: "base",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        relationField("owner", users.id, true),
        textField("client_id", true, 160),
        dateField("client_created_at"),
        dateField("client_updated_at"),
        relationField("subject", subjects.id, true),
        textField("name", true, 160),
        editorField("description", true),
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_subject_deliverables_owner_client` ON `subject_deliverables` (`owner`, `client_id`)",
        "CREATE INDEX `idx_subject_deliverables_owner_subject` ON `subject_deliverables` (`owner`, `subject`)",
      ],
    },
  });
  console.log("Created PocketBase collection: subject_deliverables");
} else {
  assertCollectionFields(deliverables, {
    owner: { type: "relation", collectionId: users.id, required: true },
    client_id: { type: "text", required: true },
    subject: { type: "relation", collectionId: subjects.id, required: true },
    name: { type: "text", required: true },
    description: { type: "editor", required: true },
  });
}

let tasks = await requireCollection("tasks");
let deliverableField = tasks.fields.find((field) => field.name === "deliverable");

if (!deliverableField) {
  tasks = await request(`/api/collections/${encodeURIComponent(tasks.id)}`, {
    method: "PATCH",
    body: {
      fields: [
        ...tasks.fields,
        relationField("deliverable", deliverables.id, false),
      ],
    },
  });
  deliverableField = tasks.fields.find((field) => field.name === "deliverable");
  console.log("Added PocketBase field: tasks.deliverable");
}

if (
  !deliverableField ||
  deliverableField.type !== "relation" ||
  deliverableField.collectionId !== deliverables.id ||
  deliverableField.required
) {
  throw new Error("tasks.deliverable is not the expected optional deliverable relation.");
}

console.log("PocketBase deliverables schema ready.");

function relationField(name, collectionId, required) {
  return {
    name,
    type: "relation",
    required,
    collectionId,
    cascadeDelete: false,
    minSelect: required ? 1 : 0,
    maxSelect: 1,
  };
}

function textField(name, required, max) {
  return { name, type: "text", required, min: required ? 1 : 0, max, pattern: "" };
}

function dateField(name) {
  return { name, type: "date", required: false, min: "", max: "" };
}

function editorField(name, required) {
  return { name, type: "editor", required, convertUrls: false, maxSize: 10000 };
}

function assertCollectionFields(collection, expectedFields) {
  const fields = new Map(collection.fields.map((field) => [field.name, field]));
  const errors = [];

  for (const [name, expected] of Object.entries(expectedFields)) {
    const actual = fields.get(name);
    if (!actual) {
      errors.push(`${name} is missing`);
      continue;
    }
    if (actual.type !== expected.type) errors.push(`${name} has type ${actual.type}`);
    if (Boolean(actual.required) !== expected.required) errors.push(`${name} required mismatch`);
    if (expected.collectionId && actual.collectionId !== expected.collectionId) {
      errors.push(`${name} relation target mismatch`);
    }
  }

  if (errors.length) {
    throw new Error(`${collection.name}: ${errors.join(", ")}`);
  }
}

async function requireCollection(name) {
  const collection = await getCollection(name);
  if (!collection) throw new Error(`Missing PocketBase collection: ${name}`);
  return collection;
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
  if (!response.ok) {
    const details = payload?.data ? ` ${JSON.stringify(payload.data)}` : "";
    throw new Error(
      `PocketBase ${response.status}: ${payload?.message || response.statusText}${details}`,
    );
  }
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
  for (const endpoint of [
    "/api/collections/_superusers/auth-with-password",
    "/api/admins/auth-with-password",
  ]) {
    try {
      const result = await request(endpoint, {
        method: "POST",
        auth: false,
        body: { identity, password },
      });
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
      result[match[1]] =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;
    }
  }
  return result;
}
