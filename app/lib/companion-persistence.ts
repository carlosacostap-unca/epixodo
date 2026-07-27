import {
  type CompanionConversation,
  type CompanionMessage,
  type CompanionRole,
  deriveCompanionTitle,
} from "./companion";
import { pocketBaseRequest, type PocketBaseRequestOptions } from "./pocketbase-server";

type Requester = <T>(path: string, options?: PocketBaseRequestOptions) => Promise<T>;
type RecordData = Record<string, unknown> & { id: string; client_id: string; created: string; updated: string };
type RecordList = { items?: RecordData[]; totalPages?: number };

const conversationsCollection = "companion_conversations";
const messagesCollection = "companion_messages";

function quoteFilter(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}

function toIso(value: unknown) {
  if (typeof value !== "string" || !value) return new Date(0).toISOString();
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString();
}

function toConversation(record: RecordData): CompanionConversation {
  return {
    id: record.client_id,
    title: typeof record.title === "string" ? record.title : "Nueva conversación",
    createdAt: toIso(record.client_created_at ?? record.created),
    updatedAt: toIso(record.client_updated_at ?? record.updated),
  };
}

function toMessage(record: RecordData, conversationId: string): CompanionMessage {
  return {
    id: record.client_id,
    conversationId,
    role: record.role as CompanionRole,
    content: typeof record.content === "string" ? record.content : "",
    createdAt: toIso(record.client_created_at ?? record.created),
  };
}

function createClientId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function listAll(request: Requester, collection: string, filter: string, sort: string) {
  const records: RecordData[] = [];
  for (let page = 1; ; page += 1) {
    const result = await request<RecordList>(
      `/api/collections/${collection}/records?page=${page}&perPage=200&filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}`,
    );
    records.push(...(result.items ?? []));
    if (!result.totalPages || page >= result.totalPages) return records;
  }
}

export async function findCompanionConversationRecord(
  ownerId: string,
  conversationId: string,
  request: Requester = pocketBaseRequest,
) {
  const filter = `owner = "${quoteFilter(ownerId)}" && client_id = "${quoteFilter(conversationId)}"`;
  const result = await request<RecordList>(
    `/api/collections/${conversationsCollection}/records?perPage=1&filter=${encodeURIComponent(filter)}`,
  );
  return result.items?.[0] ?? null;
}

export async function listCompanionConversations(ownerId: string, request: Requester = pocketBaseRequest) {
  const records = await listAll(request, conversationsCollection, `owner = "${quoteFilter(ownerId)}"`, "-client_updated_at");
  return records.map(toConversation);
}

export async function createCompanionConversation(ownerId: string, firstMessage: string, request: Requester = pocketBaseRequest) {
  const timestamp = new Date().toISOString();
  const record = await request<RecordData>(`/api/collections/${conversationsCollection}/records`, {
    method: "POST",
    body: {
      owner: ownerId,
      client_id: createClientId("conversation"),
      title: deriveCompanionTitle(firstMessage),
      client_created_at: timestamp,
      client_updated_at: timestamp,
    },
  });
  return toConversation(record);
}

export async function renameCompanionConversation(ownerId: string, conversationId: string, title: string, request: Requester = pocketBaseRequest) {
  const current = await findCompanionConversationRecord(ownerId, conversationId, request);
  if (!current) return null;
  const record = await request<RecordData>(`/api/collections/${conversationsCollection}/records/${current.id}`, {
    method: "PATCH",
    body: { title, client_updated_at: new Date().toISOString() },
  });
  return toConversation(record);
}

export async function touchCompanionConversation(ownerId: string, conversationId: string, request: Requester = pocketBaseRequest) {
  const current = await findCompanionConversationRecord(ownerId, conversationId, request);
  if (!current) return null;
  const record = await request<RecordData>(`/api/collections/${conversationsCollection}/records/${current.id}`, {
    method: "PATCH",
    body: { client_updated_at: new Date().toISOString() },
  });
  return toConversation(record);
}

export async function listCompanionMessages(ownerId: string, conversationId: string, request: Requester = pocketBaseRequest) {
  const conversation = await findCompanionConversationRecord(ownerId, conversationId, request);
  if (!conversation) return null;
  const filter = `owner = "${quoteFilter(ownerId)}" && conversation = "${quoteFilter(conversation.id)}"`;
  const records = await listAll(request, messagesCollection, filter, "client_created_at");
  return records.map((record) => toMessage(record, conversationId));
}

export async function appendCompanionMessage(ownerId: string, conversationId: string, role: CompanionRole, content: string, request: Requester = pocketBaseRequest) {
  const conversation = await findCompanionConversationRecord(ownerId, conversationId, request);
  if (!conversation) return null;
  const timestamp = new Date().toISOString();
  const record = await request<RecordData>(`/api/collections/${messagesCollection}/records`, {
    method: "POST",
    body: {
      owner: ownerId,
      client_id: createClientId("message"),
      conversation: conversation.id,
      role,
      content,
      client_created_at: timestamp,
      client_updated_at: timestamp,
    },
  });
  return toMessage(record, conversationId);
}

export async function deleteCompanionConversation(ownerId: string, conversationId: string, request: Requester = pocketBaseRequest) {
  const conversation = await findCompanionConversationRecord(ownerId, conversationId, request);
  if (!conversation) return false;
  const filter = `owner = "${quoteFilter(ownerId)}" && conversation = "${quoteFilter(conversation.id)}"`;
  const messages = await listAll(request, messagesCollection, filter, "client_created_at");
  for (const message of messages) {
    await request(`/api/collections/${messagesCollection}/records/${message.id}`, { method: "DELETE" });
  }
  await request(`/api/collections/${conversationsCollection}/records/${conversation.id}`, { method: "DELETE" });
  return true;
}
