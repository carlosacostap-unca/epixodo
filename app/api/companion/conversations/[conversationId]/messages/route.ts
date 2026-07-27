import { getAuthenticatedUser } from "../../../../../lib/auth";
import { listCompanionMessages } from "../../../../../lib/companion-persistence";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/companion/conversations/[conversationId]/messages">) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  const { conversationId } = await context.params;
  try {
    const messages = await listCompanionMessages(user.id, conversationId);
    return messages
      ? Response.json({ messages })
      : Response.json({ error: "No se encontró la conversación." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la conversación.";
    return Response.json({ error: message }, { status: 500 });
  }
}
