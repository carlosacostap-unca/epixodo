export const MAX_COMPANION_MESSAGE_LENGTH = 6_000;
export const MAX_COMPANION_TITLE_LENGTH = 80;
export const MAX_COMPANION_CONTEXT_MESSAGES = 24;
export const MAX_COMPANION_CONTEXT_CHARACTERS = 30_000;

export type CompanionRole = "user" | "assistant";

export type CompanionConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanionMessage = {
  id: string;
  conversationId: string;
  role: CompanionRole;
  content: string;
  createdAt: string;
};

export function normalizeCompanionMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, MAX_COMPANION_MESSAGE_LENGTH);
}

export function normalizeCompanionTitle(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_COMPANION_TITLE_LENGTH);
}

export function deriveCompanionTitle(message: string) {
  const clean = normalizeCompanionTitle(message);
  if (!clean) return "Nueva conversación";
  const boundary = clean.slice(0, 64);
  const lastSpace = boundary.lastIndexOf(" ");
  const title = clean.length > 64 && lastSpace > 32 ? boundary.slice(0, lastSpace) : boundary;
  return clean.length > title.length ? `${title}…` : title;
}

export function isCompanionRole(value: unknown): value is CompanionRole {
  return value === "user" || value === "assistant";
}
