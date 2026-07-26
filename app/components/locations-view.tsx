"use client";

import { FormEvent, useMemo, useState } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import {
  isValidLocationEntryDraft,
  locationMatchesQuery,
  type LocationEntry,
  type LocationEntryDraft,
} from "../lib/locations";

const emptyDraft = (date: string): LocationEntryDraft => ({
  date,
  startTime: "09:00",
  endTime: "10:00",
  plannedLocation: "",
  actualLocation: "",
  notes: "",
});

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: string, amount: number) {
  const next = parseDate(date);
  next.setDate(next.getDate() + amount);
  return toDateOnly(next);
}

function startOfWeek(date: string) {
  const value = parseDate(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return toDateOnly(value);
}

function dateLabel(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", options).format(parseDate(date));
}

function LocationIcon({ kind }: { kind: "pin" | "route" | "check" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kind === "pin" ? <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> : null}
      {kind === "route" ? <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" /></> : null}
      {kind === "check" ? <path d="m5 12 4 4L19 6" /> : null}
    </svg>
  );
}

function EntryEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: LocationEntryDraft;
  onSave: (draft: LocationEntryDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [showError, setShowError] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidLocationEntryDraft(draft)) {
      setShowError(true);
      return;
    }
    onSave(draft);
  }

  const inputClass = "h-11 w-full rounded-xl border border-[#314966] bg-[#0a1625] px-3 text-sm font-semibold text-[#edf4ff] outline-none transition placeholder:text-[#607794] focus:border-[#8eb8ff] focus:ring-2 focus:ring-[#82afff]/15";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#3b5b83] bg-[#0f2034] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#82afff]">Franja horaria</p>
          <h3 className="mt-1 text-lg font-black text-[#f4f7fc]">Plan y registro</h3>
        </div>
        <button type="button" onClick={onCancel} className="h-9 rounded-lg px-3 text-sm font-bold text-[#9fb0c9] hover:bg-[#182c45]">Cerrar</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold text-[#9fb0c9]">Día<input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-bold text-[#9fb0c9]">Desde<input required type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-bold text-[#9fb0c9]">Hasta<input required type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className={inputClass} /></label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-bold text-[#b9c9de]">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#82afff]" />Dónde debo estar</span>
          <input required value={draft.plannedLocation} onChange={(event) => setDraft({ ...draft, plannedLocation: event.target.value })} placeholder="Ej. Oficina, Palermo" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-[#b9c9de]">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#63d3a5]" />Dónde estuve</span>
          <input value={draft.actualLocation} onChange={(event) => setDraft({ ...draft, actualLocation: event.target.value })} placeholder="Podés completarlo después" className={inputClass} />
        </label>
      </div>
      <label className="mt-4 grid gap-1.5 text-xs font-bold text-[#9fb0c9]">Nota opcional<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Reunión, traslado, referencia…" rows={2} className="w-full resize-none rounded-xl border border-[#314966] bg-[#0a1625] px-3 py-2.5 text-sm text-[#edf4ff] outline-none placeholder:text-[#607794] focus:border-[#8eb8ff]" /></label>
      {showError ? <p className="mt-3 text-xs font-bold text-[#ff9d88]">Revisá la fecha, el lugar previsto y que la hora final sea posterior a la inicial.</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-[#314966] px-4 py-2.5 text-sm font-bold text-[#b9c5dd] hover:bg-[#16283f]">Cancelar</button>
        <button type="submit" className="rounded-xl bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f] shadow-[0_10px_24px_rgba(130,175,255,0.18)] hover:bg-[#a8c7ff]">Guardar franja</button>
      </div>
    </form>
  );
}

export default function LocationsView({ workspace, searchQuery }: { workspace: TaskWorkspace; searchQuery: string }) {
  const [selectedDate, setSelectedDate] = useState(workspace.today);
  const [weekStart, setWeekStart] = useState(startOfWeek(workspace.today));
  const [editing, setEditing] = useState<LocationEntry | "new" | null>(null);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const dayEntries = useMemo(
    () => workspace.locationEntries
      .filter((entry) => entry.date === selectedDate && locationMatchesQuery(entry, searchQuery))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [searchQuery, selectedDate, workspace.locationEntries],
  );
  const recorded = dayEntries.filter((entry) => entry.actualLocation).length;
  const matched = dayEntries.filter((entry) => entry.actualLocation && entry.actualLocation.toLocaleLowerCase("es") === entry.plannedLocation.toLocaleLowerCase("es")).length;

  function moveWeek(amount: number) {
    const next = addDays(weekStart, amount * 7);
    setWeekStart(next);
    setSelectedDate(next);
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[#2b4668] bg-[#0d1a2a] shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#243b5a] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => moveWeek(-1)} aria-label="Semana anterior" className="grid h-9 w-9 place-items-center rounded-xl border border-[#314966] text-lg text-[#b8c8dc] hover:bg-[#16283f]">‹</button>
            <div className="min-w-[180px] text-center">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Semana</p>
              <p className="mt-0.5 text-sm font-black capitalize text-[#eaf1fb]">{dateLabel(weekStart, { day: "numeric", month: "short" })} — {dateLabel(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <button type="button" onClick={() => moveWeek(1)} aria-label="Semana siguiente" className="grid h-9 w-9 place-items-center rounded-xl border border-[#314966] text-lg text-[#b8c8dc] hover:bg-[#16283f]">›</button>
          </div>
          <button type="button" onClick={() => { setWeekStart(startOfWeek(workspace.today)); setSelectedDate(workspace.today); setEditing(null); }} className="rounded-xl border border-[#34547a] px-3 py-2 text-xs font-black text-[#aecaef] hover:bg-[#16283f]">Volver a hoy</button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-[#203650]">
          {weekDays.map((date) => {
            const isSelected = date === selectedDate;
            const isToday = date === workspace.today;
            const count = workspace.locationEntries.filter((entry) => entry.date === date).length;
            return (
              <button key={date} type="button" onClick={() => { setSelectedDate(date); setEditing(null); }} className={`relative min-w-0 bg-[#0d1a2a] px-1 py-3 text-center transition sm:px-3 sm:py-4 ${isSelected ? "!bg-[#17345a]" : "hover:!bg-[#13263d]"}`}>
                <span className={`block text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px] ${isSelected ? "text-[#a8c7ff]" : "text-[#7185a3]"}`}>{dateLabel(date, { weekday: "short" }).replace(".", "")}</span>
                <span className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full font-mono text-sm font-black ${isToday ? "bg-[#82afff] text-[#07111f]" : "text-[#dce7f7]"}`}>{parseDate(date).getDate()}</span>
                <span className={`mx-auto mt-2 block h-1 w-1 rounded-full ${count ? "bg-[#63d3a5]" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 rounded-2xl border border-[#293f5e] bg-[#0b1828] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.17em] text-[#82afff]">{selectedDate === workspace.today ? "Hoy" : dateLabel(selectedDate, { weekday: "long" })}</p>
              <h3 className="mt-1 text-xl font-black capitalize tracking-[-0.02em] text-[#f4f7fc]">{dateLabel(selectedDate, { day: "numeric", month: "long" })}</h3>
            </div>
            <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-xl bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f] shadow-[0_10px_24px_rgba(130,175,255,0.18)] hover:-translate-y-0.5 hover:bg-[#a8c7ff]"><span className="text-lg leading-none">+</span> Añadir horario</button>
          </div>

          {editing ? (
            <div className="mt-5">
              <EntryEditor
                initial={editing === "new" ? emptyDraft(selectedDate) : editing}
                onCancel={() => setEditing(null)}
                onSave={(draft) => {
                  if (editing === "new") workspace.addLocationEntry(draft);
                  else workspace.updateLocationEntry(editing.id, draft);
                  setSelectedDate(draft.date);
                  setWeekStart(startOfWeek(draft.date));
                  setEditing(null);
                }}
              />
            </div>
          ) : null}

          <div className="relative mt-6 space-y-3 before:absolute before:bottom-4 before:left-[68px] before:top-4 before:w-px before:bg-[#29415f] sm:before:left-[84px]">
            {dayEntries.length ? dayEntries.map((entry) => {
              const isMatch = Boolean(entry.actualLocation) && entry.actualLocation.toLocaleLowerCase("es") === entry.plannedLocation.toLocaleLowerCase("es");
              return (
                <article key={entry.id} className="group relative grid grid-cols-[56px_minmax(0,1fr)] gap-4 sm:grid-cols-[68px_minmax(0,1fr)]">
                  <div className="pt-3 text-right font-mono text-xs font-black text-[#a7b7cc]">{entry.startTime}<span className="block mt-0.5 text-[9px] font-bold text-[#5f7593]">{entry.endTime}</span></div>
                  <span className={`absolute left-[64px] top-4 z-10 h-2.5 w-2.5 rounded-full ring-4 ring-[#0b1828] sm:left-[80px] ${entry.actualLocation ? "bg-[#63d3a5]" : "bg-[#82afff]"}`} />
                  <div className="ml-2 rounded-2xl border border-[#2a4261] bg-[#0f1e30] p-4 transition hover:border-[#3a5a82] sm:ml-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex gap-3"><span className="mt-0.5 text-[#82afff]"><LocationIcon kind="pin" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6681a3]">Previsto</p><p className="mt-0.5 font-black text-[#edf4ff]">{entry.plannedLocation}</p></div></div>
                        {entry.actualLocation ? <div className="flex gap-3"><span className="mt-0.5 text-[#63d3a5]"><LocationIcon kind="check" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#668f81]">Estuve</p><p className="mt-0.5 font-black text-[#d9f7eb]">{entry.actualLocation}</p></div></div> : <button type="button" onClick={() => setEditing(entry)} className="ml-8 text-left text-xs font-bold text-[#82afff] hover:text-[#b6d0ff]">+ Registrar dónde estuve</button>}
                        {entry.notes ? <p className="ml-8 text-xs leading-5 text-[#879ab5]">{entry.notes}</p> : null}
                      </div>
                      <div className="flex items-center gap-1">
                        {entry.actualLocation ? <span className={`mr-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${isMatch ? "border-[#2d674f] bg-[#102b23] text-[#63d3a5]" : "border-[#6a552e] bg-[#292216] text-[#f2be67]"}`}>{isMatch ? "Coincide" : "Cambio"}</span> : null}
                        <button type="button" onClick={() => setEditing(entry)} aria-label="Editar horario" className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#8fa3be] opacity-70 hover:bg-[#1b304b] hover:text-white group-hover:opacity-100">Editar</button>
                        <button type="button" onClick={() => workspace.deleteLocationEntry(entry.id)} aria-label="Eliminar horario" className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#8fa3be] opacity-70 hover:bg-[#371d20] hover:text-[#ff9d88] group-hover:opacity-100">×</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }) : (
              <div className="relative ml-[72px] rounded-2xl border border-dashed border-[#304965] px-5 py-12 text-center sm:ml-[96px]">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#13263d] text-[#82afff]"><LocationIcon kind="route" /></span>
                <p className="mt-3 text-sm font-black text-[#dce7f7]">Este día todavía no tiene recorrido</p>
                <p className="mt-1 text-xs text-[#7185a3]">Añadí el primer horario para empezar a planificarlo.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#2b4668] bg-[linear-gradient(145deg,#11263d,#0d1a2a)] p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Balance del día</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div><p className="font-mono text-3xl font-black text-[#f4f7fc]">{dayEntries.length}</p><p className="mt-1 text-xs font-bold text-[#8293ad]">franjas</p></div>
              <div><p className="font-mono text-3xl font-black text-[#63d3a5]">{recorded}</p><p className="mt-1 text-xs font-bold text-[#8293ad]">registradas</p></div>
            </div>
            <div className="mt-5 border-t border-[#29415f] pt-4">
              <div className="flex items-center justify-between text-xs font-bold"><span className="text-[#8fa3be]">Plan cumplido</span><span className="font-mono text-[#dce7f7]">{recorded ? Math.round((matched / recorded) * 100) : 0}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1c3049]"><span className="block h-full rounded-full bg-[#63d3a5] transition-all" style={{ width: `${recorded ? (matched / recorded) * 100 : 0}%` }} /></div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#293f5e] bg-[#0d1a2a] p-4 text-xs leading-5 text-[#8293ad]">
            <p className="font-black text-[#c9d7ea]">Cómo usar la bitácora</p>
            <p className="mt-2">Planificá primero dónde debés estar. Cuando termine la franja, registrá dónde estuviste para distinguir coincidencias y cambios.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
