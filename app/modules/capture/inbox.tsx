"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace, useWorkspaceDraft, useWorkspaceMemory } from "../../components/workspace-provider";
import { inboxHref, workspaceHref } from "../../lib/module-navigation";
import type { Task, TaskAiSuggestion } from "../../lib/tasks";
import { capturedText } from "./actions";
import ReviewForm, { captureDestination } from "./review-form";
import ui from "../../components/workspace-screen.module.css";
import styles from "./capture.module.css";

const captureDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

function suggestionFor(entry: Task): TaskAiSuggestion {
  const suggestion = entry.aiSuggestion;
  if (suggestion && suggestion.type !== "task") return suggestion;

  return {
    type: "task",
    title: suggestion?.title ?? entry.title,
    notes: suggestion?.notes || entry.notes,
    hacerEl: suggestion?.hacerEl ?? entry.hacerEl,
    venceEl: suggestion?.venceEl ?? entry.venceEl,
    priority: suggestion?.priority ?? entry.priority,
    subjectName: suggestion?.subjectName ?? "",
  };
}

export default function CaptureInbox({ entryId }: { entryId?: string }) {
  const { capture, finance, subjects, today, syncPending, syncError, retrySync } = useWorkspace();
  const memory = useWorkspaceMemory();
  const router = useRouter();
  const [search, setSearch] = useWorkspaceDraft("capture:search", () => "");
  const query = search.trim().toLocaleLowerCase("es");
  const filtered = capture.entries.filter((entry) => !query ||
    [entry.title, entry.notes, captureDestination(entry.aiSuggestion)].join(" ").toLocaleLowerCase("es").includes(query),
  );
  const openEntry = capture.entries.find(({ id }) => id === entryId);
  const selected = openEntry ?? filtered[0];
  const selectedDate = selected ? new Date(selected.createdAt) : null;

  useEffect(() => {
    if (!entryId || openEntry) return;
    for (const field of ["account", "subject", "fields"]) memory.delete(`review:${entryId}:${field}`);
    router.replace(inboxHref(), { scroll: false });
  }, [entryId, memory, openEntry, router]);

  if (capture.entries.length === 0) {
    return (
      <section className={`${ui.panel} px-5 py-12 text-center`}>
        <h2 className={ui.panelTitle}>Bandeja al día</h2>
        <Link href={workspaceHref("capture")} className={`${ui.button} ${ui.primary} mt-4`}>Guardar una entrada</Link>
      </section>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 sm:gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
      {syncPending ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-(--accent) lg:col-span-2">
          <span role="status">Cambios pendientes de sincronizar</span>
          {syncError ? <button type="button" onClick={retrySync} className="min-h-11 px-2 underline underline-offset-4">Reintentar</button> : null}
        </div>
      ) : null}
      {openEntry ? <Link href={inboxHref()} className={`${ui.backLink} inline-flex justify-self-start lg:hidden`}><span aria-hidden="true">←</span> Volver a Bandeja</Link> : null}
      <aside aria-label="Cola de Bandeja" className={`${ui.panel} self-start ${openEntry ? "hidden lg:block" : ""}`}>
        <div className="border-b border-(--workspace-border) p-3">
          <label className={ui.label}>
            Buscar entradas
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={`${ui.control} w-full px-3`} />
          </label>
          <p role="status" className="mt-2 text-xs tabular-nums text-(--workspace-muted)">
            {filtered.length} {filtered.length === 1 ? "entrada" : "entradas"}{query ? ` de ${capture.entries.length}` : " por revisar"}
          </p>
        </div>
        <ul className="divide-y divide-(--workspace-border) overflow-y-auto lg:max-h-[65dvh]">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <Link
                href={inboxHref(entry.id)}
                aria-current={entry.id === selected?.id ? "true" : undefined}
                className={`${ui.selection} ${styles.queueItem} grid min-h-16 w-full min-w-0 gap-1 px-3 py-2.5 text-left outline-offset-[-3px]`}
              >
                <span className="truncate text-sm font-bold">{entry.title}</span>
                <span className="text-xs text-(--workspace-muted)">{captureDestination(entry.aiSuggestion)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section id="capture-review" aria-label="Revisión de entrada" className={`${ui.panel} ${openEntry ? "" : "hidden lg:block"}`}>
        {selected ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-(--workspace-border) px-4 py-4 sm:px-6">
              <div className="min-w-0">
                {selectedDate && Number.isFinite(selectedDate.valueOf()) ? (
                  <time dateTime={selected.createdAt} className="font-mono text-xs text-(--workspace-muted)">{captureDate.format(selectedDate)}</time>
                ) : null}
                <h2 className={`${ui.panelTitle} mt-1 break-words`}>{selected.title}</h2>
              </div>
              <button type="button" onClick={() => {
                if (window.confirm(`¿Descartar «${selected.title}» de Bandeja?`)) capture.discardEntry(selected.id);
              }} className={`${ui.button} ${ui.danger}`}>Descartar entrada</button>
            </header>
            <div className="grid items-start gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <article className={`${styles.paper} min-w-0 rounded-lg border border-(--workspace-border) bg-(--workspace-inset) py-4 pl-10 pr-4`}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-(--accent)">Texto capturado</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-(--workspace-ink)">{capturedText(selected)}</p>
              </article>
              <ReviewForm
                key={selected.id}
                entryId={selected.id}
                suggestion={suggestionFor(selected)}
                isSuggested={!!selected.aiSuggestion}
                accounts={finance.accounts}
                subjects={subjects}
                today={today}
                applyError={capture.errors.get(selected.id)}
                onApply={(action) => capture.confirmEntry(selected.id, action)}
                onOpenModule={(destination) => router.push(workspaceHref(destination) + "?" + new URLSearchParams({ desdeEntrada: selected.id }))}
              />
            </div>
          </>
        ) : (
          <p className="px-5 py-8 text-sm text-(--workspace-muted)">No hay entradas que coincidan con la búsqueda.</p>
        )}
      </section>
    </div>
  );
}
