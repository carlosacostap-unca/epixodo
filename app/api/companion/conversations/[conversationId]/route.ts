import { getAuthenticatedUser } from "../../../../lib/auth";
import { deleteCompanionConversation, renameCompanionConversation } from "../../../../lib/companion-persistence";
import { normalizeCompanionTitle } from "../../../../lib/companion";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext<"/api/companion/conversations/[conversationId]">) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  const { conversationId } = await context.params;
  const payload = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = normalizeCompanionTitle(payload?.title);
  if (!title) return Response.json({ error: "Escribí un título para la conversación." }, { status: 400 });
  try {
    const conversation = await renameCompanionConversation(user.id, conversationId, title);
    return conversation
      ? Response.json({ conversation })
      : Response.json({ error: "No se encontró la conversación." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo renombrar la conversación.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/companion/conversations/[conversationId]">) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  const { conversationId } = await context.params;
  try {
    return await deleteCompanionConversation(user.id, conversationId)
      ? new Response(null, { status: 204 })
      : Response.json({ error: "No se encontró la conversación." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar la conversación.";
    return Response.json({ error: message }, { status: 500 });
  }
}
