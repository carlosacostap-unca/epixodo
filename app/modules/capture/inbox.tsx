"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../../components/workspace-provider";
import { workspaceHref } from "../../lib/module-navigation";
import type { Task, TaskAiSuggestion } from "../../lib/tasks";
import { capturedText } from "./actions";
import ReviewForm, { captureDestination } from "./review-form";
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

export default function CaptureInbox() {
  const { capture, finance, subjects, today } = useWorkspace();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("es");
  const filtered = capture.entries.filter((entry) => !query ||
    [entry.title, entry.notes, captureDestination(entry.aiSuggestion)].join(" ").toLocaleLowerCase("es").includes(query),
  );
  const selected = filtered.find(({ id }) => id === selectedId) ?? filtered[0];
  const selectedDate = selected ? new Date(selected.createdAt) : null;

  if (capture.entries.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[#574d41] bg-[#191815] px-5 py-12 text-center">
        <h2 className="font-serif text-3xl tracking-tight">Bandeja al día</h2>
        <Link href={workspaceHref("capture")} className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#ffd08a] underline underline-offset-4">Guardar una entrada</Link>
      </section>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
      <aside aria-label="Cola de Bandeja" className="self-start overflow-hidden rounded-lg border border-[#423c35] bg-[#191815]">
        <div className="border-b border-[#423c35] p-3">
          <label className="grid gap-2 text-sm font-semibold text-[#c0b5a7]">
            Buscar entradas
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 min-w-0 border border-[#574d41] bg-[#151412] px-3 text-base text-[#f5eee3]" />
          </label>
          <p role="status" className="mt-2 text-xs tabular-nums text-[#c0b5a7]">
            {filtered.length} {filtered.length === 1 ? "entrada" : "entradas"}{query ? ` de ${capture.entries.length}` : " por revisar"}
          </p>
        </div>
        <ul className="max-h-52 divide-y divide-[#423c35] overflow-y-auto lg:max-h-[65dvh]">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                aria-pressed={entry.id === selected?.id}
                aria-controls="capture-review"
                onClick={() => setSelectedId(entry.id)}
                className="grid min-h-16 w-full min-w-0 gap-1 !rounded-none border-l-[3px] border-transparent px-3 py-2.5 text-left outline-offset-[-3px] hover:bg-[#2b2822] aria-pressed:border-[#ffcb7e] aria-pressed:bg-[#352b20]"
              >
                <span className="truncate text-sm font-bold">{entry.title}</span>
                <span className="text-xs text-[#c0b5a7]">{captureDestination(entry.aiSuggestion)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section id="capture-review" aria-label="Revisión de entrada" className="min-w-0 rounded-lg border border-[#423c35] bg-[#1e1b17]">
        {selected ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#423c35] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                {selectedDate && Number.isFinite(selectedDate.valueOf()) ? (
                  <time dateTime={selected.createdAt} className="font-mono text-xs text-[#c0b5a7]">{captureDate.format(selectedDate)}</time>
                ) : null}
                <h2 className="mt-1 break-words font-serif text-3xl leading-tight tracking-tight">{selected.title}</h2>
              </div>
              <button type="button" onClick={() => {
                if (window.confirm(`¿Descartar «${selected.title}» de Bandeja?`)) capture.discardEntry(selected.id);
              }} className="min-h-11 px-3 text-sm font-semibold text-[#e4aa9b] hover:bg-[#332520]">Descartar entrada</button>
            </header>
            <div className="grid items-start gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <article className={`${styles.paper} min-w-0 rounded-md border border-[#423c35] bg-[#191815] px-4 py-4 pl-10`}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ffd08a]">Texto capturado</h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#e3d9cd]">{capturedText(selected)}</p>
              </article>
              <ReviewForm
                key={selected.id}
                suggestion={suggestionFor(selected)}
                isSuggested={!!selected.aiSuggestion}
                accounts={finance.accounts}
                subjects={subjects}
                today={today}
                applyError={capture.errors.get(selected.id)}
                onApply={(action) => capture.confirmEntry(selected.id, action)}
                onOpenModule={(destination) => router.push(workspaceHref(destination))}
              />
            </div>
          </>
        ) : (
          <p className="px-5 py-8 text-sm text-[#c0b5a7]">No hay entradas que coincidan con la búsqueda.</p>
        )}
      </section>
    </div>
  );
}
