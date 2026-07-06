import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const env = loadEnv([
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
]);
const pocketBaseUrl = stripTrailingSlash(
  env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || "",
);
const collectionName = env.POCKETBASE_WORKSPACES_COLLECTION || "workspaces";

let authCache = null;

async function main() {
  if (!pocketBaseUrl) {
    throw new Error("Missing PocketBase URL. Set NEXT_PUBLIC_POCKETBASE_URL or POCKETBASE_URL.");
  }

  const existing = await getCollection(collectionName);
  if (!existing) {
    const created = await request("/api/collections", {
      method: "POST",
      body: collectionSchema(),
    });
    console.log(`Created PocketBase collection: ${created.name}`);
    return;
  }

  const fields = new Set((existing.fields || existing.schema || []).map((field) => field.name));
  const missingFields = ["key", "data"].filter((field) => !fields.has(field));

  if (missingFields.length > 0) {
    throw new Error(
      `Collection ${collectionName} exists but is missing fields: ${missingFields.join(", ")}`,
    );
  }

  console.log(`PocketBase collection ready: ${collectionName}`);
}

function collectionSchema() {
  return {
    name: collectionName,
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "key",
        type: "text",
        required: true,
        presentable: true,
        min: 1,
        max: 80,
        pattern: "",
      },
      {
        name: "data",
        type: "json",
        required: true,
        maxSize: 0,
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false,
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: [`CREATE UNIQUE INDEX \`idx_${collectionName}_key\` ON \`${collectionName}\` (\`key\`)`],
  };
}

async function getCollection(collection) {
  try {
    return await request(`/api/collections/${encodeURIComponent(collection)}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("PocketBase 404")) {
      return null;
    }

    throw error;
  }
}

async function request(apiPath, options = {}) {
  const url = new URL(apiPath, `${pocketBaseUrl}/`);
  const headers = options.body ? { "Content-Type": "application/json" } : {};

  if (options.auth !== false) {
    headers.Authorization = `Bearer ${await getToken()}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || response.statusText;
    throw new Error(`PocketBase ${response.status}: ${message}`);
  }

  return payload;
}

async function getToken() {
  if (authCache?.expiresAt && authCache.expiresAt > Date.now() + 30_000) {
    return authCache.token;
  }

  const existingToken = env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN;
  if (existingToken) {
    authCache = {
      token: existingToken,
      expiresAt: getTokenExpiry(existingToken) || Date.now() + 5 * 60_000,
    };
    return existingToken;
  }

  const email = env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD || env.PB_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing PocketBase admin credentials.");
  }

  const body = { identity: email, password };
  const endpoints = [
    "/api/admins/auth-with-password",
    "/api/collections/_superusers/auth-with-password",
  ];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const result = await request(endpoint, {
        auth: false,
        method: "POST",
        body,
      });
      authCache = {
        token: result.token,
        expiresAt: getTokenExpiry(result.token) || Date.now() + 15 * 60_000,
      };
      return result.token;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("PocketBase authentication failed.");
}

function loadEnv(files) {
  const merged = { ...process.env };

  for (const file of files) {
    if (!fs.existsSync(file)) {
      continue;
    }

    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match && merged[match[1]] === undefined) {
        merged[match[1]] = unquote(match[2].trim());
      }
    }
  }

  return merged;
}

function unquote(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function getTokenExpiry(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return json.exp ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
