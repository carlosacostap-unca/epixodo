"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import type { TaskWorkspace } from "../hooks/use-task-workspace";
import { getIdealDayGoals, getPreviousIdealDayDates, idealDayGoalMatchesQuery, isIdealDayGoalAlreadyAdded, type IdealDayGoal, type IdealDayGoalDraft } from "../lib/ideal-day";
import { getTodayDateOnly, isValidDateOnly } from "../lib/tasks";

const fieldClass = "w-full rounded-xl border border-[#344a65] bg-[#091727] px-3 py-2.5 text-sm text-[#edf3ff] outline-none placeholder:text-[#7185a3] focus:border-[#f2be67] focus:ring-2 focus:ring-[#f2be67]/15";
const buttonClass = "min-h-11 rounded-xl border border-[#344a65] px-3 py-2 text-sm font-bold text-[#b9c9dd] transition hover:bg-[#192d46]";
const primaryClass = "min-h-11 rounded-xl bg-[#f2be67] px-4 py-2.5 text-sm font-black text-[#191509] transition hover:bg-[#f7d398]";

function dateObject(value: string) {
  return new Date(`${value}T12:00:00`);
}

function shiftDate(value: string, offset: number) {
  const date = dateObject(value);
  date.setDate(date.getDate() + offset);
  return getTodayDateOnly(date);
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return dateObject(value).toLocaleDateString("es-AR", options);
}

export default function IdealDayView({ workspace, searchQuery }: { workspace: TaskWorkspace; searchQuery: string }) {
  const [selectedDate, setSelectedDate] = useState(workspace.today);
  const goals = getIdealDayGoals(workspace.idealDayGoals, selectedDate);
  const completed = goals.filter((goal) => goal.completed).length;
  const weekStart = shiftDate(selectedDate, -((dateObject(selectedDate).getDay() + 6) % 7));

  return (
    <div className="grid min-w-0 gap-5">
      <section aria-label="Elegir día" className="overflow-hidden rounded-2xl border border-[#344a65] bg-[#0d1a2a]">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2be67]">Un día a tu manera</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#eef4ff] first-letter:uppercase sm:text-2xl">{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</h2>
            <p className="mt-1 text-sm text-[#91a3bc]">¿Qué te gustaría haber logrado al terminar este día?</p>
          </div>
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-bold text-[#91a3bc] sm:flex-none">
              Elegir fecha
              <input type="date" value={selectedDate} onChange={(event) => {
                if (isValidDateOnly(event.target.value)) setSelectedDate(event.target.value);
              }} className={`${fieldClass} min-h-11`} />
            </label>
            <button type="button" onClick={() => setSelectedDate(workspace.today)} className={buttonClass}>Hoy</button>
          </div>
        </div>
        <div className="flex items-center gap-1 border-t border-[#20334d] px-1 py-3 sm:gap-2 sm:px-3">
          <button type="button" aria-label="Semana anterior" onClick={() => setSelectedDate(shiftDate(selectedDate, -7))} className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-[#a6b8d0] hover:bg-[#192d46] sm:w-10">←</button>
          <div className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }, (_, index) => {
              const date = shiftDate(weekStart, index);
              const active = date === selectedDate;
              const dayGoals = getIdealDayGoals(workspace.idealDayGoals, date);
              return (
                <button key={date} type="button" aria-pressed={active} aria-label={formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} onClick={() => setSelectedDate(date)}
                  className={`grid min-h-20 min-w-0 justify-items-center gap-1 rounded-xl border py-2 ${active ? "border-[#f2be67] bg-[#f2be67]/10 text-[#f7d398]" : "border-transparent text-[#91a3bc] hover:bg-[#192d46]"}`}>
                  <span className="text-[10px] font-bold capitalize sm:text-xs">{formatDate(date, { weekday: "short" }).replace(".", "")}</span>
                  <span className={`font-mono text-base font-bold sm:text-lg ${date === workspace.today && !active ? "text-[#82afff]" : ""}`}>{date.slice(-2)}</span>
                  <span aria-hidden="true" className={`h-1 w-1 rounded-full ${dayGoals.length ? dayGoals.every((goal) => goal.completed) ? "bg-[#63d3a5]" : "bg-[#f2be67]" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
          <button type="button" aria-label="Semana siguiente" onClick={() => setSelectedDate(shiftDate(selectedDate, 7))} className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-[#a6b8d0] hover:bg-[#192d46] sm:w-10">→</button>
        </div>
      </section>

      <section aria-labelledby="ideal-day-goals-heading" className="overflow-hidden rounded-2xl border border-[#293f5e] bg-[#0d1a2a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#20334d] px-4 py-4 sm:px-5">
          <h2 id="ideal-day-goals-heading" className="font-bold text-[#eef4ff]">Mis objetivos del día</h2>
          <p role="status" className="font-mono text-xs text-[#91a3bc]">{completed} de {goals.length} {goals.length === 1 ? "completado" : "completados"}</p>
        </div>
        {goals.length > 0 ? <progress aria-label="Objetivos completados del día" value={completed} max={goals.length} className="block h-1 w-full appearance-none [&::-webkit-progress-bar]:bg-[#1b2c43] [&::-webkit-progress-value]:bg-[#f2be67] [&::-moz-progress-bar]:bg-[#f2be67]" /> : null}
        <DayGoals key={selectedDate} date={selectedDate} goals={goals} workspace={workspace} searchQuery={searchQuery} />
      </section>
    </div>
  );
}

function DayGoals({ date, goals, workspace, searchQuery }: { date: string; goals: IdealDayGoal[]; workspace: TaskWorkspace; searchQuery: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const visibleGoals = goals.filter((goal) => idealDayGoalMatchesQuery(goal, searchQuery));

  return (
    <div className="grid gap-5 p-4 sm:p-5">
      <ReusableGoals date={date} workspace={workspace} />
      <GoalForm date={date} disabled={!workspace.isLoaded} onSave={(draft) => workspace.addIdealDayGoal(draft)} />
      {!workspace.isLoaded ? <p className="py-8 text-center text-sm text-[#91a3bc]">Cargando tus objetivos…</p> : visibleGoals.length ? (
        <ul className="grid gap-3">
          {visibleGoals.map((goal) => (
            <li key={goal.id} className={`rounded-xl border p-4 ${goal.completed ? "border-[#294d46] bg-[#102322]/40" : "border-[#293f5e] bg-[#111f34]"}`}>
              {editingId === goal.id ? (
                <GoalForm date={date} goal={goal} onCancel={() => setEditingId(null)} onSave={(draft) => {
                  workspace.updateIdealDayGoal(goal.id, { title: draft.title, notes: draft.notes });
                  setEditingId(null);
                  return true;
                }} />
              ) : (
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={goal.completed} onChange={(event) => workspace.updateIdealDayGoal(goal.id, { completed: event.target.checked })} aria-label={`Marcar «${goal.title}» como ${goal.completed ? "pendiente" : "completado"}`} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#63d3a5]" />
                  <div className="min-w-0 flex-1">
                    <h3 className={`break-words text-sm font-bold ${goal.completed ? "text-[#8ea9a1] line-through" : "text-[#eef4ff]"}`}>{goal.title}</h3>
                    {goal.notes ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#91a3bc]">{goal.notes}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-x-5">
                      <button type="button" onClick={() => setEditingId(goal.id)} aria-label={`Editar objetivo: ${goal.title}`} className="min-h-9 text-xs font-bold text-[#a9c9ff] hover:underline">Editar</button>
                      <button type="button" onClick={() => {
                        if (window.confirm(`¿Eliminar el objetivo «${goal.title}»?`)) workspace.deleteIdealDayGoal(goal.id);
                      }} aria-label={`Eliminar objetivo: ${goal.title}`} className="min-h-9 text-xs font-bold text-[#e59a92] hover:underline">Eliminar</button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-[#344a65] px-5 py-9 text-center">
          <h3 className="text-sm font-bold text-[#dce7f6]">{searchQuery.trim() ? "No hay objetivos que coincidan" : "Tu día ideal empieza con un objetivo"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91a3bc]">{searchQuery.trim() ? "Probá otra búsqueda para esta fecha." : "Escribí algo que quieras lograr en esta fecha, como salir a caminar o dedicar un rato a leer."}</p>
        </div>
      )}
    </div>
  );
}

function ReusableGoals({ date, workspace }: { date: string; workspace: TaskWorkspace }) {
  const [isOpen, setIsOpen] = useState(false);
  const previousDates = getPreviousIdealDayDates(workspace.idealDayGoals, date);
  const [chosenSourceDate, setSourceDate] = useState("");
  const sourceDate = previousDates.includes(chosenSourceDate) ? chosenSourceDate : previousDates[0] ?? "";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const panelId = useId();
  const sourceGoals = getIdealDayGoals(workspace.idealDayGoals, sourceDate);
  const available = sourceGoals.filter((goal) => !isIdealDayGoalAlreadyAdded(goal, workspace.idealDayGoals, date));
  const selected = available.filter((goal) => selectedIds.includes(goal.id));
  const allSelected = available.length > 0 && selected.length === available.length;

  function copySelected() {
    if (!selected.length) return;
    workspace.reuseIdealDayGoals(date, selected.map((goal) => goal.id));
    setSelectedIds([]);
    setMessage("Objetivos añadidos a este día como pendientes.");
  }

  return (
    <div className="rounded-xl border border-[#344a65] bg-[#091727]">
      <button type="button" disabled={!workspace.isLoaded} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-[#f2be67] hover:bg-[#192d46]">
        <span>Reutilizar objetivos de días anteriores</span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen ? (
        <div id={panelId} className="grid gap-4 border-t border-[#20334d] p-4">
          {previousDates.length ? (
            <>
              <label className="grid min-w-0 gap-1.5 text-xs font-bold text-[#a6b8d0]">
                Copiar desde
                <select value={sourceDate} onChange={(event) => {
                  setSourceDate(event.target.value);
                  setSelectedIds([]);
                  setMessage("");
                }} className={`${fieldClass} min-h-11 min-w-0`}>
                  {previousDates.map((previousDate) => <option key={previousDate} value={previousDate}>{formatDate(previousDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#91a3bc]">Elegí los objetivos que querés repetir.</p>
                <button type="button" disabled={!available.length} onClick={() => {
                  setSelectedIds(allSelected ? [] : available.map((goal) => goal.id));
                  setMessage("");
                }} className="min-h-11 text-xs font-bold text-[#a9c9ff] hover:underline">{allSelected ? "Deseleccionar todos" : "Seleccionar todos"}</button>
              </div>
              <ul aria-label="Objetivos del día anterior elegido" className="grid max-h-80 gap-2 overflow-y-auto overscroll-contain">
                {sourceGoals.map((goal) => {
                  const alreadyAdded = isIdealDayGoalAlreadyAdded(goal, workspace.idealDayGoals, date);
                  return (
                    <li key={goal.id}>
                      <label className={`flex min-h-12 items-start gap-3 rounded-lg border border-[#293f5e] p-3 ${alreadyAdded ? "text-[#8192ad]" : "cursor-pointer text-[#edf3ff] hover:bg-[#192d46]"}`}>
                        <input type="checkbox" disabled={alreadyAdded} checked={!alreadyAdded && selectedIds.includes(goal.id)} onChange={(event) => {
                          setSelectedIds((current) => event.target.checked ? [...current, goal.id] : current.filter((id) => id !== goal.id));
                          setMessage("");
                        }} aria-label={`Reutilizar: ${goal.title}`} className="mt-0.5 h-5 w-5 shrink-0 accent-[#f2be67]" />
                        <span className="grid min-w-0 gap-1">
                          <span className="break-words text-sm font-bold">{goal.title}</span>
                          {goal.notes ? <span className="whitespace-pre-wrap break-words text-xs leading-5 text-[#91a3bc]">{goal.notes}</span> : null}
                          {alreadyAdded ? <span className="text-xs text-[#63d3a5]">Ya está en este día</span> : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={!selected.length} onClick={copySelected} className={primaryClass}>Añadir {selected.length || "los"} {selected.length === 1 ? "objetivo" : "objetivos"}</button>
                <p className="text-xs text-[#91a3bc]">Se copiarán con sus notas y como pendientes.</p>
              </div>
            </>
          ) : <p className="text-sm leading-6 text-[#91a3bc]">Todavía no tenés objetivos en fechas anteriores a este día. Cuando los registres, podrás reutilizarlos desde acá.</p>}
          {message ? <p role="status" className="text-sm text-[#63d3a5]">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function GoalForm({ date, goal, disabled = false, onSave, onCancel }: {
  date: string;
  goal?: IdealDayGoal;
  disabled?: boolean;
  onSave: (draft: IdealDayGoalDraft) => boolean;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [notes, setNotes] = useState(goal?.notes ?? "");
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    if (!onSave({ date, title, notes })) {
      setError("Escribí un objetivo de hasta 300 caracteres y notas de hasta 10.000 caracteres.");
      return;
    }
    setTitle("");
    setNotes("");
    setError("");
    if (!goal) titleRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <fieldset disabled={disabled} className="grid min-w-0 gap-3">
        <label className="grid gap-1.5 text-xs font-bold text-[#a6b8d0]">
          {goal ? "Objetivo" : "Nuevo objetivo"}
          <input ref={titleRef} required maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="¿Qué querés lograr?" className={fieldClass} autoFocus={Boolean(goal)} />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-[#a6b8d0]">
          Notas <span className="sr-only">del objetivo</span>
          <textarea maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Agregá un detalle si lo necesitás (opcional)" rows={2} className={`${fieldClass} min-h-20 resize-y`} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!title.trim()} className={primaryClass}>{goal ? "Guardar cambios" : "Añadir objetivo"}</button>
          {onCancel ? <button type="button" onClick={onCancel} className={buttonClass}>Cancelar</button> : null}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-[#e59a92]">{error}</p> : null}
    </form>
  );
}
