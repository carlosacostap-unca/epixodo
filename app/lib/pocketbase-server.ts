import { emptyWorkspace, type WorkspaceData } from "./tasks";
import { normalizeWorkspaceData } from "./workspace-codec";

type PocketBaseAuth = {
  token: string;
  expiresAt: number;
};

type PocketBaseRecord = {
  id: string;
  key: string;
  data?: unknown;
};

let authCache: PocketBaseAuth | null = null;

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getPocketBaseUrl() {
  const url = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;

  if (!url) {
    throw new Error("Missing PocketBase URL.");
  }

  return stripTrailingSlash(url);
}

function getTokenExpiry(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function pocketBaseRequest<T>(
  apiPath: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const url = new URL(apiPath, `${getPocketBaseUrl()}/`);
  const headers: HeadersInit = options.body ? { "Content-Type": "application/json" } : {};

  if (options.auth !== false) {
    const token = await getPocketBaseToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : response.statusText;
    throw new Error(`PocketBase ${response.status}: ${message}`);
  }

  return payload as T;
}

async function getPocketBaseToken() {
  if (authCache && authCache.expiresAt > Date.now() + 30_000) {
    return authCache.token;
  }

  const existingToken = process.env.POCKETBASE_ADMIN_TOKEN || process.env.PB_AUTH_TOKEN;
  if (existingToken) {
    authCache = {
      token: existingToken,
      expiresAt: getTokenExpiry(existingToken) ?? Date.now() + 5 * 60_000,
    };
    return existingToken;
  }

  const email = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing PocketBase admin credentials.");
  }

  const body = { identity: email, password };
  const endpoints = [
    "/api/admins/auth-with-password",
    "/api/collections/_superusers/auth-with-password",
  ];
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const result = await pocketBaseRequest<{ token: string }>(endpoint, {
        auth: false,
        method: "POST",
        body,
      });

      authCache = {
        token: result.token,
        expiresAt: getTokenExpiry(result.token) ?? Date.now() + 15 * 60_000,
      };

      return result.token;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("PocketBase authentication failed.");
}

function workspaceCollection() {
  return process.env.POCKETBASE_WORKSPACES_COLLECTION || "workspaces";
}

function workspaceKey() {
  return process.env.POCKETBASE_WORKSPACE_KEY || "default";
}

function quoteFilterValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function getWorkspaceRecord(): Promise<PocketBaseRecord | null> {
  const collection = workspaceCollection();
  const key = workspaceKey();
  const filter = encodeURIComponent(`key = "${quoteFilterValue(key)}"`);
  const result = await pocketBaseRequest<{ items?: PocketBaseRecord[] }>(
    `/api/collections/${encodeURIComponent(collection)}/records?perPage=1&filter=${filter}`,
  );

  return result.items?.[0] ?? null;
}

export async function getPocketBaseWorkspace(): Promise<WorkspaceData> {
  const record = await getWorkspaceRecord();

  if (!record) {
    return emptyWorkspace();
  }

  return normalizeWorkspaceData(record.data);
}

export async function savePocketBaseWorkspace(workspace: WorkspaceData): Promise<WorkspaceData> {
  const collection = workspaceCollection();
  const key = workspaceKey();
  const data = normalizeWorkspaceData(workspace);
  const current = await getWorkspaceRecord();

  if (current) {
    const record = await pocketBaseRequest<PocketBaseRecord>(
      `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(current.id)}`,
      {
        method: "PATCH",
        body: { data },
      },
    );
    return normalizeWorkspaceData(record.data);
  }

  const record = await pocketBaseRequest<PocketBaseRecord>(
    `/api/collections/${encodeURIComponent(collection)}/records`,
    {
      method: "POST",
      body: { key, data },
    },
  );

  return normalizeWorkspaceData(record.data);
}
