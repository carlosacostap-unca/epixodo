import assert from "node:assert/strict";
import {
  MAX_COMPANION_CONTEXT_CHARACTERS,
  MAX_COMPANION_CONTEXT_MESSAGES,
  MAX_COMPANION_MESSAGE_LENGTH,
  deriveCompanionTitle,
  normalizeCompanionMessage,
  normalizeCompanionTitle,
} from "../app/lib/companion.ts";
import {
  buildCompanionContext,
  companionSafetyIdentifier,
  requestCompanionReply,
} from "../app/lib/ai-companion.ts";
import {
  appendCompanionMessage,
  findCompanionConversationRecord,
  listCompanionMessages,
} from "../app/lib/companion-persistence.ts";
import { normalizedSchema } from "./normalized-schema-manifest.mjs";

assert.equal(normalizeCompanionMessage("  hola\r\nallá  "), "hola\nallá");
assert.equal(normalizeCompanionMessage("x".repeat(MAX_COMPANION_MESSAGE_LENGTH + 2)).length, MAX_COMPANION_MESSAGE_LENGTH);
assert.equal(normalizeCompanionTitle("  Un   título  "), "Un título");
assert.equal(deriveCompanionTitle(""), "Nueva conversación");
assert.ok(deriveCompanionTitle("una conversación muy larga ".repeat(8)).endsWith("…"));

const messages = Array.from({ length: 40 }, (_, index) => ({
  id: `message-${index}`,
  conversationId: "conversation-1",
  role: index % 2 ? "assistant" : "user",
  content: `${index}: ${"x".repeat(1_800)}`,
  createdAt: new Date(index * 1_000).toISOString(),
}));
const context = buildCompanionContext(messages);
assert.ok(context.length <= MAX_COMPANION_CONTEXT_MESSAGES);
assert.ok(context.reduce((total, item) => total + item.content.length, 0) <= MAX_COMPANION_CONTEXT_CHARACTERS);
assert.equal(context.at(-1).content, messages.at(-1).content);

assert.equal(companionSafetyIdentifier("owner-a"), companionSafetyIdentifier("owner-a"));
assert.notEqual(companionSafetyIdentifier("owner-a"), companionSafetyIdentifier("owner-b"));
assert.ok(!companionSafetyIdentifier("owner-a").includes("owner-a"));

const previousKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = "test-key";
let sentBody;
const reply = await requestCompanionReply(messages.slice(-2), "safe-test", async (_url, init) => {
  sentBody = JSON.parse(init.body);
  return new Response(JSON.stringify({ output_text: "Te estoy escuchando." }), { status: 200 });
});
assert.equal(reply, "Te estoy escuchando.");
assert.equal(sentBody.store, false);
assert.equal(sentBody.reasoning.effort, "none");
assert.equal(sentBody.safety_identifier, "safe-test");
assert.equal(sentBody.input.length, 2);
await assert.rejects(
  requestCompanionReply(messages.slice(-1), "safe-test", async () => new Response(JSON.stringify({ error: { message: "provider down" } }), { status: 503 })),
  /provider down/,
);
if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
else process.env.OPENAI_API_KEY = previousKey;

const conversationRecord = {
  id: "pb-conversation",
  client_id: "conversation-a",
  title: "Mi día",
  client_created_at: "2026-07-26T10:00:00.000Z",
  client_updated_at: "2026-07-26T11:00:00.000Z",
  created: "2026-07-26 10:00:00.000Z",
  updated: "2026-07-26 11:00:00.000Z",
};
const persistenceCalls = [];
const fakeRequest = async (path, options = {}) => {
  persistenceCalls.push({ path, options });
  const decoded = decodeURIComponent(path);
  if (path.includes("companion_conversations") && !options.method) {
    return decoded.includes('owner = "owner-a"') && decoded.includes('client_id = "conversation-a"')
      ? { items: [conversationRecord] }
      : { items: [] };
  }
  if (path.includes("companion_messages") && !options.method) {
    assert.match(decoded, /owner = "owner-a"/);
    assert.match(decoded, /conversation = "pb-conversation"/);
    return {
      items: [{
        id: "pb-message",
        client_id: "message-a",
        role: "user",
        content: "Hola",
        client_created_at: "2026-07-26T11:01:00.000Z",
        created: "2026-07-26 11:01:00.000Z",
        updated: "2026-07-26 11:01:00.000Z",
      }],
      totalPages: 1,
    };
  }
  if (path.includes("companion_messages") && options.method === "POST") {
    assert.equal(options.body.owner, "owner-a");
    assert.equal(options.body.conversation, "pb-conversation");
    return { id: "pb-new", created: options.body.client_created_at, updated: options.body.client_updated_at, ...options.body };
  }
  throw new Error(`Unexpected fake request: ${path}`);
};

assert.equal(await findCompanionConversationRecord("owner-b", "conversation-a", fakeRequest), null);
const storedMessages = await listCompanionMessages("owner-a", "conversation-a", fakeRequest);
assert.equal(storedMessages.length, 1);
assert.equal(storedMessages[0].conversationId, "conversation-a");
const appended = await appendCompanionMessage("owner-a", "conversation-a", "assistant", "Acá estoy.", fakeRequest);
assert.equal(appended.role, "assistant");
assert.ok(persistenceCalls.every((call) => !decodeURIComponent(call.path).includes("owner-b") || call.path.includes("companion_conversations")));

assert.equal(normalizedSchema.companion_conversations.fields.title.required, true);
assert.equal(normalizedSchema.companion_messages.fields.conversation.target, "companion_conversations");
assert.equal(normalizedSchema.companion_messages.fields.content.required, true);

console.log("Companion domain, AI context, owner scoping, and schema manifest tests passed.");
