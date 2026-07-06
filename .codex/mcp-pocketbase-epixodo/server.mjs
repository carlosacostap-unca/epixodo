#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

const serverInfo = {
  name: "mcp-pocketbase-epixodo",
  version: "1.0.0",
};

const env = loadEnv([
  process.env.MCP_ENV_FILE,
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, ".env"),
]);

const pocketBaseUrl = stripTrailingSlash(
  env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL || env.PB_URL || "",
);

let authCache = null;

const tools = [
  {
    name: "health",
    description: "Check PocketBase health and configured URL.",
    inputSchema: objectSchema({}),
  },
  {
    name: "whoami",
    description: "Authenticate with PocketBase and return safe auth metadata.",
    inputSchema: objectSchema({}),
  },
  {
    name: "list_collections",
    description: "List PocketBase collections.",
    inputSchema: objectSchema({
      perPage: numberSchema("Maximum collections to request.", 1, 500, 200),
    }),
  },
  {
    name: "get_collection",
    description: "Get a PocketBase collection by name or id.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
    }, ["collection"]),
  },
  {
    name: "list_records",
    description: "List records from a PocketBase collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      page: numberSchema("Page number.", 1, 100000, 1),
      perPage: numberSchema("Records per page.", 1, 500, 50),
      filter: stringSchema("PocketBase filter expression."),
      sort: stringSchema("PocketBase sort expression."),
      expand: stringSchema("PocketBase expand expression."),
      fields: stringSchema("Comma-separated field projection."),
      fullList: booleanSchema("Fetch all pages up to maxPages."),
      maxPages: numberSchema("Safety limit for fullList.", 1, 200, 20),
    }, ["collection"]),
  },
  {
    name: "get_record",
    description: "Get a single record by id.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      id: stringSchema("Record id."),
      expand: stringSchema("PocketBase expand expression."),
      fields: stringSchema("Comma-separated field projection."),
    }, ["collection", "id"]),
  },
  {
    name: "create_record",
    description: "Create a record in a collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      data: objectSchema({}, [], "Record JSON data.", true),
    }, ["collection", "data"]),
  },
  {
    name: "update_record",
    description: "Patch a record in a collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      id: stringSchema("Record id."),
      data: objectSchema({}, [], "Record JSON patch data.", true),
    }, ["collection", "id", "data"]),
  },
  {
    name: "delete_record",
    description: "Delete a record from a collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      id: stringSchema("Record id."),
    }, ["collection", "id"]),
  },
  {
    name: "create_collection",
    description: "Create a PocketBase collection.",
    inputSchema: objectSchema({
      data: objectSchema({}, [], "Collection JSON definition.", true),
    }, ["data"]),
  },
  {
    name: "update_collection",
    description: "Patch a PocketBase collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
      data: objectSchema({}, [], "Collection JSON patch data.", true),
    }, ["collection", "data"]),
  },
  {
    name: "delete_collection",
    description: "Delete a PocketBase collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Collection name or id."),
    }, ["collection"]),
  },
  {
    name: "list_projects",
    description: "List project-like records. Defaults to the projects collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Project collection name.", "projects"),
      filter: stringSchema("Additional PocketBase filter expression."),
      sort: stringSchema("PocketBase sort expression.", "name"),
      perPage: numberSchema("Records per page.", 1, 500, 100),
    }),
  },
  {
    name: "list_tasks",
    description: "List task-like records. Defaults to the tasks collection.",
    inputSchema: objectSchema({
      collection: stringSchema("Task collection name.", "tasks"),
      filter: stringSchema("Additional PocketBase filter expression."),
      sort: stringSchema("PocketBase sort expression.", "-created"),
      expand: stringSchema("PocketBase expand expression.", "project"),
      perPage: numberSchema("Records per page.", 1, 500, 100),
    }),
  },
  {
    name: "validate_epixodo_schema",
    description: "Check whether expected Epixodo task/project collections and fields exist.",
    inputSchema: objectSchema({
      projectsCollection: stringSchema("Project collection name.", "projects"),
      tasksCollection: stringSchema("Task collection name.", "tasks"),
    }),
  },
];

const handlers = {
  async health() {
    assertConfigured();
    const response = await request("/api/health", { auth: false });
    return {
      url: pocketBaseUrl,
      ok: true,
      health: response,
    };
  },

  async whoami() {
    assertConfigured();
    const auth = await getAuth();
    return {
      url: pocketBaseUrl,
      authenticated: true,
      authMode: auth.mode,
      email: auth.email,
      tokenPresent: Boolean(auth.token),
    };
  },

  async list_collections(args) {
    const perPage = args.perPage ?? 200;
    return request(`/api/collections?${toQuery({ perPage, sort: "name" })}`);
  },

  async get_collection(args) {
    requireString(args.collection, "collection");
    return request(`/api/collections/${encodeURIComponent(args.collection)}`);
  },

  async list_records(args) {
    requireString(args.collection, "collection");
    if (args.fullList) {
      const maxPages = args.maxPages ?? 20;
      const perPage = args.perPage ?? 100;
      const items = [];
      let meta = null;

      for (let page = 1; page <= maxPages; page += 1) {
        const result = await listRecordsPage(args.collection, {
          ...args,
          page,
          perPage,
        });
        meta = omit(result, ["items"]);
        items.push(...(result.items ?? []));
        if (!result.totalPages || page >= result.totalPages) {
          break;
        }
      }

      return {
        ...meta,
        items,
        fetchedItems: items.length,
      };
    }

    return listRecordsPage(args.collection, args);
  },

  async get_record(args) {
    requireString(args.collection, "collection");
    requireString(args.id, "id");
    return request(
      `/api/collections/${encodeURIComponent(args.collection)}/records/${encodeURIComponent(args.id)}?${toQuery({
        expand: args.expand,
        fields: args.fields,
      })}`,
    );
  },

  async create_record(args) {
    requireString(args.collection, "collection");
    requirePlainObject(args.data, "data");
    return request(`/api/collections/${encodeURIComponent(args.collection)}/records`, {
      method: "POST",
      body: args.data,
    });
  },

  async update_record(args) {
    requireString(args.collection, "collection");
    requireString(args.id, "id");
    requirePlainObject(args.data, "data");
    return request(
      `/api/collections/${encodeURIComponent(args.collection)}/records/${encodeURIComponent(args.id)}`,
      {
        method: "PATCH",
        body: args.data,
      },
    );
  },

  async delete_record(args) {
    requireString(args.collection, "collection");
    requireString(args.id, "id");
    await request(
      `/api/collections/${encodeURIComponent(args.collection)}/records/${encodeURIComponent(args.id)}`,
      { method: "DELETE" },
    );
    return { deleted: true };
  },

  async create_collection(args) {
    requirePlainObject(args.data, "data");
    return request("/api/collections", {
      method: "POST",
      body: args.data,
    });
  },

  async update_collection(args) {
    requireString(args.collection, "collection");
    requirePlainObject(args.data, "data");
    return request(`/api/collections/${encodeURIComponent(args.collection)}`, {
      method: "PATCH",
      body: args.data,
    });
  },

  async delete_collection(args) {
    requireString(args.collection, "collection");
    await request(`/api/collections/${encodeURIComponent(args.collection)}`, {
      method: "DELETE",
    });
    return { deleted: true };
  },

  async list_projects(args) {
    return handlers.list_records({
      collection: args.collection || "projects",
      filter: args.filter,
      sort: args.sort || "name",
      perPage: args.perPage ?? 100,
    });
  },

  async list_tasks(args) {
    return handlers.list_records({
      collection: args.collection || "tasks",
      filter: args.filter,
      sort: args.sort || "-created",
      expand: args.expand ?? "project",
      perPage: args.perPage ?? 100,
    });
  },

  async validate_epixodo_schema(args) {
    const projectsCollection = args.projectsCollection || "projects";
    const tasksCollection = args.tasksCollection || "tasks";
    const expected = {
      [projectsCollection]: ["name"],
      [tasksCollection]: ["title", "notes", "project", "hacerEl", "venceEl", "priority", "status"],
    };
    const result = {};

    for (const [collection, fieldNames] of Object.entries(expected)) {
      try {
        const schema = await handlers.get_collection({ collection });
        const fields = new Set((schema.fields || schema.schema || []).map((field) => field.name));
        result[collection] = {
          exists: true,
          missingFields: fieldNames.filter((field) => !fields.has(field)),
          presentFields: fieldNames.filter((field) => fields.has(field)),
        };
      } catch (error) {
        result[collection] = {
          exists: false,
          error: sanitizeError(error),
        };
      }
    }

    return result;
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    writeError(null, -32700, "Parse error", sanitizeError(error));
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(message, "id")) {
    return;
  }

  try {
    const result = await route(message.method, message.params || {});
    write({ jsonrpc: "2.0", id: message.id, result });
  } catch (error) {
    writeError(message.id, -32000, "Tool error", sanitizeError(error));
  }
});

async function route(method, params) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo,
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools };
    case "tools/call": {
      const name = params.name;
      const args = params.arguments || {};
      if (!handlers[name]) {
        throw new Error(`Unknown tool: ${name}`);
      }
      const result = await handlers[name](args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function listRecordsPage(collection, args) {
  const query = toQuery({
    page: args.page ?? 1,
    perPage: args.perPage ?? 50,
    filter: args.filter,
    sort: args.sort,
    expand: args.expand,
    fields: args.fields,
  });

  return request(`/api/collections/${encodeURIComponent(collection)}/records?${query}`);
}

async function request(apiPath, options = {}) {
  assertConfigured();
  const url = new URL(apiPath, `${pocketBaseUrl}/`);
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (options.auth !== false) {
    const auth = await getAuth();
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText;
    throw new Error(`PocketBase ${response.status}: ${message}`);
  }

  return payload ?? { ok: true, status: response.status };
}

async function getAuth() {
  if (authCache?.expiresAt && authCache.expiresAt > Date.now() + 30_000) {
    return authCache;
  }

  const token = env.POCKETBASE_ADMIN_TOKEN || env.PB_AUTH_TOKEN;
  if (token) {
    authCache = {
      token,
      mode: "token",
      email: env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL || null,
      expiresAt: Date.now() + 5 * 60_000,
    };
    return authCache;
  }

  const email = env.POCKETBASE_ADMIN_EMAIL || env.PB_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD || env.PB_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing PocketBase admin credentials in .env.local.");
  }

  const body = { identity: email, password };
  const endpoints = [
    ["/api/admins/auth-with-password", "admin"],
    ["/api/collections/_superusers/auth-with-password", "superuser"],
  ];
  let lastError = null;

  for (const [endpoint, mode] of endpoints) {
    try {
      const result = await request(endpoint, {
        auth: false,
        method: "POST",
        body,
      });
      if (!result.token) {
        throw new Error("Auth response did not include a token.");
      }
      authCache = {
        token: result.token,
        mode,
        email,
        expiresAt: getTokenExpiry(result.token) ?? Date.now() + 15 * 60_000,
      };
      return authCache;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("PocketBase authentication failed.");
}

function loadEnv(files) {
  const merged = { ...process.env };
  for (const file of files.filter(Boolean)) {
    if (!fs.existsSync(file)) {
      continue;
    }
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }
      const [, key, rawValue] = match;
      if (merged[key] === undefined) {
        merged[key] = unquote(rawValue.trim());
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

function assertConfigured() {
  if (!pocketBaseUrl) {
    throw new Error("Missing PocketBase URL. Set NEXT_PUBLIC_POCKETBASE_URL or POCKETBASE_URL.");
  }
}

function toQuery(values) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function omit(object, keys) {
  return Object.fromEntries(Object.entries(object || {}).filter(([key]) => !keys.includes(key)));
}

function requireString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required string argument: ${name}`);
  }
}

function requirePlainObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Missing required object argument: ${name}`);
  }
}

function sanitizeError(error) {
  const text = error?.stack || error?.message || String(error);
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/("token"\s*:\s*")[^"]+/g, "$1[redacted]")
    .replace(/(password[=:]\s*)[^\s&"]+/gi, "$1[redacted]");
}

function write(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function writeError(id, code, message, data) {
  write({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data,
    },
  });
}

function objectSchema(properties = {}, required = [], description, additionalProperties = false) {
  return {
    type: "object",
    ...(description ? { description } : {}),
    properties,
    required,
    additionalProperties,
  };
}

function stringSchema(description, defaultValue) {
  return {
    type: "string",
    ...(description ? { description } : {}),
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  };
}

function numberSchema(description, minimum, maximum, defaultValue) {
  return {
    type: "number",
    ...(description ? { description } : {}),
    ...(minimum !== undefined ? { minimum } : {}),
    ...(maximum !== undefined ? { maximum } : {}),
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  };
}

function booleanSchema(description) {
  return {
    type: "boolean",
    ...(description ? { description } : {}),
  };
}
