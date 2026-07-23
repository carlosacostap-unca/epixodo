export const SESSION_COOKIE_NAME = "epixodo_session";
const DEFAULT_SESSION_LIFETIME_MS = 60 * 60 * 1000;

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

export class AuthenticationError extends Error {
  readonly status: 401 | 502;

  constructor(message: string, status: 401 | 502) {
    super(message);
    this.name = "AuthenticationError";
    this.status = status;
  }
}

export function validateLoginInput(value: unknown) {
  if (!value || typeof value !== "object") {
    return { error: "Ingresá tu email y contraseña." } as const;
  }

  const candidate = value as { email?: unknown; password?: unknown };
  const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : "";
  const password = typeof candidate.password === "string" ? candidate.password : "";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isEmail) {
    return { error: "Ingresá un email válido." } as const;
  }

  if (!password) {
    return { error: "Ingresá tu contraseña." } as const;
  }

  return { credentials: { email, password } } as const;
}

export function getTokenExpiry(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(token: string) {
  const expiresAt = getTokenExpiry(token) ?? Date.now() + DEFAULT_SESSION_LIFETIME_MS;

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high" as const,
    expires: new Date(expiresAt),
  };
}
