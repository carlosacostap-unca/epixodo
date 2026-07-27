import { getAuthenticatedUser } from "../../../lib/auth";
import { MAX_COMPANION_MESSAGE_LENGTH, normalizeCompanionMessage } from "../../../lib/companion";
import { companionSafetyIdentifier, requestCompanionReply } from "../../../lib/ai-companion";
import {
  appendCompanionMessage,
  createCompanionConversation,
  findCompanionConversationRecord,
  listCompanionMessages,
  touchCompanionConversation,
} from "../../../lib/companion-persistence";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { conversationId?: unknown; content?: unknown } | null;
  const rawContent = typeof payload?.content === "string" ? payload.content : "";
  if (rawContent.trim().length > MAX_COMPANION_MESSAGE_LENGTH) {
    return Response.json({ error: "El mensaje supera el límite de 6.000 caracteres." }, { status: 413 });
  }
  const content = normalizeCompanionMessage(rawContent);
  if (!content) return Response.json({ error: "Escribí algo para continuar la conversación." }, { status: 400 });

  try {
    let conversation;
    if (typeof payload?.conversationId === "string" && payload.conversationId) {
      const current = await findCompanionConversationRecord(user.id, payload.conversationId);
      if (!current) return Response.json({ error: "No se encontró la conversación." }, { status: 404 });
      conversation = await touchCompanionConversation(user.id, payload.conversationId);
    } else {
      conversation = await createCompanionConversation(user.id, content);
    }
    if (!conversation) return Response.json({ error: "No se encontró la conversación." }, { status: 404 });

    const userMessage = await appendCompanionMessage(user.id, conversation.id, "user", content);
    if (!userMessage) return Response.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
    const messages = await listCompanionMessages(user.id, conversation.id);
    if (!messages) return Response.json({ error: "No se pudo cargar el contexto." }, { status: 500 });

    try {
      const reply = await requestCompanionReply(messages, companionSafetyIdentifier(user.id));
      const assistantMessage = await appendCompanionMessage(user.id, conversation.id, "assistant", reply);
      if (!assistantMessage) throw new Error("No se pudo guardar la respuesta.");
      await touchCompanionConversation(user.id, conversation.id);
      return Response.json({ conversation, userMessage, assistantMessage }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo obtener una respuesta.";
      return Response.json({ error: message, conversation, userMessage }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo continuar la conversación.";
    return Response.json({ error: message }, { status: 500 });
  }
}
