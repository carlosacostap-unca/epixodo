"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_COMPANION_MESSAGE_LENGTH,
  type CompanionConversation,
  type CompanionMessage,
} from "../lib/companion";

type ApiError = { error?: string };

function messageTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function conversationDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hoy";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(date);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(payload.error || "No se pudo completar la acción.");
  return payload;
}

export default function CompanionView({
  searchQuery,
  onConversationCountChange,
}: {
  searchQuery: string;
  onConversationCountChange?: (count: number) => void;
}) {
  const [conversations, setConversations] = useState<CompanionConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find((item) => item.id === selectedId) ?? null;
  const visibleConversations = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("es");
    return query
      ? conversations.filter((item) => item.title.toLocaleLowerCase("es").includes(query))
      : conversations;
  }, [conversations, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/companion/conversations", { cache: "no-store" })
      .then((response) => readJson<{ conversations: CompanionConversation[] }>(response))
      .then((payload) => {
        if (cancelled) return;
        setConversations(payload.conversations);
        setSelectedId(payload.conversations[0]?.id ?? null);
        setIsLoadingMessages(payload.conversations.length > 0);
        onConversationCountChange?.(payload.conversations.length);
      })
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : "No se pudieron cargar las conversaciones."))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [onConversationCountChange]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void fetch(`/api/companion/conversations/${encodeURIComponent(selectedId)}/messages`, { cache: "no-store" })
      .then((response) => readJson<{ messages: CompanionMessage[] }>(response))
      .then((payload) => !cancelled && setMessages(payload.messages))
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : "No se pudo abrir la conversación."))
      .finally(() => !cancelled && setIsLoadingMessages(false));
    return () => { cancelled = true; };
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  function startNewConversation() {
    setSelectedId(null);
    setMessages([]);
    setDraft("");
    setError("");
    setIsRenaming(false);
    setIsConfirmingDelete(false);
    setIsLoadingMessages(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: CompanionMessage = {
      id: optimisticId,
      conversationId: selectedId ?? "new",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setDraft("");
    setError("");
    setIsSending(true);
    setMessages((current) => [...current, optimistic]);

    try {
      const response = await fetch("/api/companion/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiError & {
        conversation?: CompanionConversation;
        userMessage?: CompanionMessage;
        assistantMessage?: CompanionMessage;
      };
      if (payload.conversation) {
        const fresh = { ...payload.conversation, updatedAt: new Date().toISOString() };
        setConversations((current) => [fresh, ...current.filter((item) => item.id !== fresh.id)]);
        setSelectedId(fresh.id);
        onConversationCountChange?.(conversations.some((item) => item.id === fresh.id) ? conversations.length : conversations.length + 1);
      }
      if (payload.userMessage) {
        setMessages((current) => [
          ...current.filter((item) => item.id !== optimisticId),
          payload.userMessage as CompanionMessage,
          ...(payload.assistantMessage ? [payload.assistantMessage] : []),
        ]);
      }
      if (!response.ok) throw new Error(payload.error || "No se pudo obtener una respuesta.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo continuar la conversación.");
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function renameConversation(event: FormEvent) {
    event.preventDefault();
    if (!selectedConversation || !editingTitle.trim()) return;
    try {
      const payload = await fetch(`/api/companion/conversations/${encodeURIComponent(selectedConversation.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle }),
      }).then((response) => readJson<{ conversation: CompanionConversation }>(response));
      setConversations((current) => current.map((item) => item.id === payload.conversation.id ? payload.conversation : item));
      setIsRenaming(false);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo renombrar la conversación.");
    }
  }

  async function deleteConversation() {
    if (!selectedConversation) return;
    try {
      const response = await fetch(`/api/companion/conversations/${encodeURIComponent(selectedConversation.id)}`, { method: "DELETE" });
      if (!response.ok) await readJson(response);
      const remaining = conversations.filter((item) => item.id !== selectedConversation.id);
      setConversations(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setMessages([]);
      setIsLoadingMessages(remaining.length > 0);
      setIsConfirmingDelete(false);
      onConversationCountChange?.(remaining.length);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo eliminar la conversación.");
    }
  }

  const prompts = [
    "Quiero contarte cómo me siento hoy.",
    "Tengo varias cosas en la cabeza y quiero ordenarlas.",
    "Quiero repasar cómo me fue durante el día.",
  ];

  return (
    <div className="companion-shell grid min-h-[640px] overflow-hidden rounded-3xl border border-[#3c4268] bg-[#0b1423] shadow-[0_28px_80px_rgba(0,0,0,0.28)] lg:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="border-b border-[#303857] bg-[#0d1728] p-4 lg:border-b-0 lg:border-r lg:p-5">
        <button type="button" onClick={startNewConversation} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#8877d8] bg-[#b7a6ff] px-4 text-sm font-black text-[#111125] shadow-[0_10px_28px_rgba(183,166,255,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c9bdff] focus-visible:outline-[#b7a6ff]">
          <span aria-hidden="true" className="text-lg">+</span> Nueva conversación
        </button>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#8f91b5]">Tus hilos</p>
          <span className="rounded-full bg-[#20253e] px-2 py-0.5 font-mono text-[10px] font-bold text-[#bbb9d7]">{visibleConversations.length}</span>
        </div>
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:max-h-[505px] lg:grid lg:overflow-y-auto lg:pr-1">
          {isLoading ? <p className="px-2 py-4 text-sm text-[#818ca7]">Abriendo conversaciones…</p> : null}
          {!isLoading && visibleConversations.length === 0 ? (
            <p className="min-w-64 rounded-xl border border-dashed border-[#353b5d] px-3 py-4 text-sm leading-5 text-[#7f89a5]">{searchQuery ? "Ningún hilo coincide con la búsqueda." : "Todavía no hay conversaciones. Podés empezar sin preparar nada."}</p>
          ) : null}
          {visibleConversations.map((conversation) => {
            const active = conversation.id === selectedId;
            return (
              <button key={conversation.id} type="button" onClick={() => { if (!active) { setIsLoadingMessages(true); setError(""); setSelectedId(conversation.id); } setIsRenaming(false); setIsConfirmingDelete(false); }} className={`min-w-56 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-[#b7a6ff] lg:min-w-0 ${active ? "border-[#7165ae] bg-[#252743] text-[#f5f2ff]" : "border-transparent bg-[#121e31] text-[#aeb8cc] hover:border-[#414968] hover:bg-[#17243a]"}`}>
                <span className="block truncate text-sm font-bold">{conversation.title}</span>
                <span className={`mt-1 block font-mono text-[10px] ${active ? "text-[#b7a6ff]" : "text-[#717d99]"}`}>{conversationDate(conversation.updatedAt)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 hidden border-t border-[#29314d] pt-4 text-xs leading-5 text-[#747f9c] lg:block">
          <p>Este espacio usa IA y puede equivocarse. No reemplaza ayuda profesional ni servicios de emergencia.</p>
        </div>
      </aside>

      <section className="relative flex min-h-[620px] min-w-0 flex-col bg-[radial-gradient(circle_at_55%_0%,rgba(144,119,230,0.10),transparent_32rem)]">
        <header className="flex min-h-[70px] items-center justify-between gap-3 border-b border-[#303857] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#b7a6ff]">Un hilo para volver</p>
            <h3 className="mt-1 truncate text-base font-black text-[#f5f3ff]">{selectedConversation?.title ?? "Una conversación nueva"}</h3>
          </div>
          {selectedConversation ? (
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => { setEditingTitle(selectedConversation.title); setIsRenaming(true); setIsConfirmingDelete(false); }} className="rounded-lg border border-[#3b4564] px-3 py-2 text-xs font-bold text-[#aeb8ce] transition hover:bg-[#19243a] focus-visible:outline-[#b7a6ff]">Renombrar</button>
              <button type="button" onClick={() => { setIsConfirmingDelete(true); setIsRenaming(false); }} className="rounded-lg border border-[#603d4d] px-3 py-2 text-xs font-bold text-[#dca2ae] transition hover:bg-[#2b1924] focus-visible:outline-[#ff9db2]">Eliminar</button>
            </div>
          ) : null}
        </header>

        {isRenaming && selectedConversation ? (
          <form onSubmit={renameConversation} className="flex flex-wrap gap-2 border-b border-[#303857] bg-[#101a2c] px-4 py-3 sm:px-6">
            <label className="min-w-52 flex-1"><span className="sr-only">Título de la conversación</span><input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={80} className="h-10 w-full rounded-lg border border-[#5d5684] bg-[#0b1423] px-3 text-sm text-[#f3efff] outline-none focus:border-[#b7a6ff]" /></label>
            <button type="submit" className="rounded-lg bg-[#b7a6ff] px-3 text-xs font-black text-[#111125]">Guardar</button>
            <button type="button" onClick={() => setIsRenaming(false)} className="rounded-lg border border-[#3b4564] px-3 text-xs font-bold text-[#aeb8ce]">Cancelar</button>
          </form>
        ) : null}

        {isConfirmingDelete && selectedConversation ? (
          <div role="alertdialog" aria-labelledby="delete-companion-title" className="flex flex-wrap items-center gap-3 border-b border-[#603d4d] bg-[#241522] px-4 py-3 sm:px-6">
            <p id="delete-companion-title" className="min-w-56 flex-1 text-sm text-[#e6bdc7]">¿Eliminar este hilo y todos sus mensajes? Esta acción no se puede deshacer.</p>
            <button type="button" onClick={() => void deleteConversation()} className="rounded-lg bg-[#e59aaa] px-3 py-2 text-xs font-black text-[#251018]">Sí, eliminar</button>
            <button type="button" autoFocus onClick={() => setIsConfirmingDelete(false)} className="rounded-lg border border-[#70495a] px-3 py-2 text-xs font-bold text-[#e2b4bf]">Conservar</button>
          </div>
        ) : null}

        <div aria-live="polite" className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8">
          {isLoadingMessages ? <p className="text-center text-sm text-[#858da7]">Recuperando este hilo…</p> : null}
          {!isLoadingMessages && messages.length === 0 ? (
            <div className="mx-auto flex min-h-[330px] max-w-2xl flex-col justify-center">
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="companion-orb flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#8275c7] bg-[#2b2949] shadow-[0_0_38px_rgba(183,166,255,0.22)]"><span className="h-2.5 w-2.5 rounded-full bg-[#c8bcff]" /></span>
                <div>
                  <h4 className="text-2xl font-black tracking-[-0.03em] text-[#f5f3ff]">Podés empezar por donde estés.</h4>
                  <p className="mt-1 text-sm leading-6 text-[#939cb3]">No hace falta llegar con una pregunta. Contá algo, pensá en voz alta o simplemente decí cómo viene el día.</p>
                </div>
              </div>
              <div className="mt-7 grid gap-2 sm:grid-cols-3">
                {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setDraft(prompt); requestAnimationFrame(() => composerRef.current?.focus()); }} className="rounded-xl border border-[#3c4263] bg-[#121d30] p-3 text-left text-xs leading-5 text-[#b5bed0] transition hover:-translate-y-0.5 hover:border-[#7569ae] hover:bg-[#1a2238] focus-visible:outline-[#b7a6ff]">{prompt}</button>)}
              </div>
            </div>
          ) : null}
          <div className="companion-thread mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <article key={message.id} className={`relative pl-9 ${message.role === "user" ? "ml-auto max-w-[88%] sm:max-w-[78%]" : "max-w-[94%] sm:max-w-[84%]"}`}>
                <span aria-hidden="true" className={`absolute left-[7px] top-5 z-10 h-3 w-3 rounded-full border-2 border-[#111a2b] ${message.role === "user" ? "bg-[#82afff]" : "bg-[#b7a6ff]"}`} />
                <div className={`rounded-2xl border px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.12)] ${message.role === "user" ? "border-[#41699e] bg-[#17345a]" : "border-[#484969] bg-[#171f32]"}`}>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#e8edf7]">{message.content}</p>
                  <p className={`mt-2 font-mono text-[9px] ${message.role === "user" ? "text-[#91b8ee]" : "text-[#8d91ad]"}`}>{message.role === "user" ? "Vos" : "Compañía"} · {messageTime(message.createdAt)}</p>
                </div>
              </article>
            ))}
            {isSending ? (
              <div className="relative max-w-[84%] pl-9"><span aria-hidden="true" className="absolute left-[7px] top-4 z-10 h-3 w-3 animate-pulse rounded-full border-2 border-[#111a2b] bg-[#b7a6ff]" /><div className="inline-flex items-center gap-2 rounded-2xl border border-[#484969] bg-[#171f32] px-4 py-3 text-sm text-[#aeb5c8]"><span className="flex gap-1" aria-hidden="true"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b7a6ff]" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b7a6ff] [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b7a6ff] [animation-delay:300ms]" /></span> Pensando con vos…</div></div>
            ) : null}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-[#303857] bg-[#0d1728]/96 p-3 backdrop-blur sm:p-5">
          {error ? <div role="alert" className="mx-auto mb-3 max-w-3xl rounded-xl border border-[#7a3d4d] bg-[#2a1721] px-3 py-2 text-xs font-semibold text-[#ffadbd]">{error} <button type="button" onClick={() => setError("")} className="ml-2 underline">Cerrar</button></div> : null}
          <form onSubmit={sendMessage} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-[#484b70] bg-[#111b2d] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.22)] focus-within:border-[#8c7bd4] focus-within:ring-2 focus-within:ring-[#b7a6ff]/10">
              <textarea ref={composerRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} disabled={isSending} maxLength={MAX_COMPANION_MESSAGE_LENGTH} rows={2} aria-label="Mensaje para Compañía" placeholder="¿Qué tenés en la cabeza?" className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#eef1f8] outline-none placeholder:text-[#68738d]" />
              <button type="submit" disabled={isSending || !draft.trim()} aria-label="Enviar mensaje" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b7a6ff] text-lg font-black text-[#111125] transition hover:bg-[#c9bdff] focus-visible:outline-[#d8d0ff] disabled:translate-y-0">↑</button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 font-mono text-[9px] text-[#69758f]"><span>Enter envía · Shift + Enter baja una línea</span><span>{draft.length}/{MAX_COMPANION_MESSAGE_LENGTH}</span></div>
          </form>
        </div>
      </section>
    </div>
  );
}
