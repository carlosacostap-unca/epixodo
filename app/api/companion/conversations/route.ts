import { getAuthenticatedUser } from "../../../lib/auth";
import { listCompanionConversations } from "../../../lib/companion-persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  try {
    return Response.json({ conversations: await listCompanionConversations(user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las conversaciones.";
    return Response.json({ error: message }, { status: 500 });
  }
}
