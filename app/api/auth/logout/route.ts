import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return new Response(null, { status: 204 });
}
