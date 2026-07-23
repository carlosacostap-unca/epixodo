import { cookies } from "next/headers";
import {
  AuthenticationError,
  SESSION_COOKIE_NAME,
  type AuthenticatedUser,
} from "./auth-core";
export {
  AuthenticationError,
  getSessionCookieOptions,
  getTokenExpiry,
  SESSION_COOKIE_NAME,
  validateLoginInput,
} from "./auth-core";
export type { AuthenticatedUser } from "./auth-core";

type PocketBaseAuthResponse = {
  token?: unknown;
  record?: {
    id?: unknown;
    email?: unknown;
    name?: unknown;
  };
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getPocketBaseUrl() {
  const url = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;

  if (!url) {
    throw new AuthenticationError("PocketBase no está configurado.", 502);
  }

  return stripTrailingSlash(url);
}

function getUsersCollection() {
  return process.env.POCKETBASE_USERS_COLLECTION || "users";
}

async function requestPocketBaseAuth(
  endpoint: "auth-with-password" | "auth-refresh",
  options: { token?: string; credentials?: { email: string; password: string } },
) {
  const collection = encodeURIComponent(getUsersCollection());
  const response = await fetch(
    `${getPocketBaseUrl()}/api/collections/${collection}/${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.credentials
        ? JSON.stringify({
            identity: options.credentials.email,
            password: options.credentials.password,
          })
        : undefined,
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => null)) as PocketBaseAuthResponse | null;

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new AuthenticationError("El email o la contraseña no son correctos.", 401);
    }

    throw new AuthenticationError("No se pudo conectar con el servicio de acceso.", 502);
  }

  if (
    typeof payload?.token !== "string" ||
    typeof payload.record?.id !== "string" ||
    typeof payload.record.email !== "string"
  ) {
    throw new AuthenticationError("PocketBase devolvió una sesión inválida.", 502);
  }

  return {
    token: payload.token,
    user: {
      id: payload.record.id,
      email: payload.record.email,
      name: typeof payload.record.name === "string" ? payload.record.name : "",
    },
  };
}

export function authenticateWithPassword(email: string, password: string) {
  return requestPocketBaseAuth("auth-with-password", {
    credentials: { email, password },
  });
}

export async function validateSessionToken(token: string) {
  const result = await requestPocketBaseAuth("auth-refresh", { token });
  return result.user;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await validateSessionToken(token);
  } catch {
    return null;
  }
}
