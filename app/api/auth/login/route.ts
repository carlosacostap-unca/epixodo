import { cookies } from "next/headers";
import {
  AuthenticationError,
  authenticateWithPassword,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  validateLoginInput,
} from "../../../lib/auth";

export async function POST(request: Request) {
  const input = validateLoginInput(await request.json().catch(() => null));

  if ("error" in input) {
    return Response.json({ error: input.error }, { status: 400 });
  }

  try {
    const { token, user } = await authenticateWithPassword(
      input.credentials.email,
      input.credentials.password,
    );
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(token));

    return Response.json({ user });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "No se pudo iniciar sesión. Intentá nuevamente." },
      { status: 500 },
    );
  }
}
