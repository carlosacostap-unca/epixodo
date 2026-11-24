"use client";

import { type DragEvent, type ReactNode, FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { workspaceHref, type LegacyWorkspaceView, type WorkspaceView } from "../lib/module-navigation";
import { useWorkspace, WorkspaceLoading } from "./workspace-provider";
import NutritionView from "./nutrition-view";
import LocationsView from "./locations-view";
import ExpectationsView from "./expectations-view";
import IdealDayView from "./ideal-day-view";
import CompanionView from "./companion-view";
import TodayOverview from "./today-overview";
import ViewIcon from "./view-icon";
import dailyStyles from "./daily-workspace.module.css";
import ui from "./workspace-screen.module.css";
import { TaskCreateModal, TaskEditModal } from "../modules/planning/task-forms";
import PlanningTabs from "../modules/planning/planning-tabs";
import planningStyles from "../modules/planning/planning.module.css";
import { subjectManagementHref } from "../modules/planning/navigation";
import { formatDate, getStatusLabel, getPriorityLabel, taskMatchesQuery, sortedSubjects, TaskEmptyState, TaskBadge, FieldLabel, SubjectChips } from "../modules/planning/task-ui";
import {
  compareDateOnly,
  getPhaseDateRangeError,
  getHorizonLabel,
  getSubjectDescendantIds,
  getSubjectPath,
  getSubjectEventLabel,
  isActiveTask,
  isValidSubjectEventDraft,
  isValidSubjectDeliverableDraft,
  subjectHorizons,
  sortedSubjectPhases,
  sortedSubjectEvents,
  sortedSubjectDeliverables,
  taskTreeItems,
  type Subject,
  type SubjectDeliverable,
  type SubjectDeliverableDraft,
  type SubjectEvent,
  type SubjectEventDraft,
  type SubjectEventKind,
  type SubjectHorizon,
  type SubjectPhase,
  type SubjectPhaseDraft,
  type Task,
  type TaskStatus,
} from "../lib/tasks";

type ViewKey = LegacyWorkspaceView;
type SubjectViewMode = "folders" | "horizon";
const viewLabels: Record<ViewKey, string> = {
  companion: "Compañía",
  today: "Hoy",
  "ideal-day": "Mi día ideal",
  upcoming: "Próximas",
  unassigned: "Sin asunto",
  waiting: "Esperando",
  completed: "Completadas",
  calendar: "Calendario",
  subjects: "Asuntos",
  nutrition: "Nutrición",
  locations: "Ubicaciones",
  expectations: "Esperas",
};

const viewDescriptions: Record<Exclude<ViewKey, "today">, string> = {
  companion: "Un lugar para pensar en voz alta, contar cómo viene el día y retomar cada conversación cuando quieras.",
  "ideal-day": "Elegí una fecha y definí los objetivos que querés lograr ese día.",
  upcoming: "El trabajo que se acerca en los próximos días.",
  unassigned: "Tareas revisadas que todavía no tienen asunto.",
  waiting: "Tareas detenidas por una respuesta o condición externa.",
  completed: "El registro de lo que ya resolviste.",
  calendar: "Tus eventos, hitos y vencimientos, ordenados en el tiempo.",
  subjects: "Explora tus asuntos por carpetas u horizonte y abre su detalle para gestionar las tareas.",
  nutrition: "Planificá, registrá y prepará tus comidas desde un mismo cuaderno diario.",
  locations: "Planificá dónde debés estar y registrá tu recorrido real, día a día y por horario.",
  expectations: "Entregas, respuestas y novedades que dependen de otros y querés confirmar cuando llegue el día.",
};

const todayDate = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const planningControlClass = `${ui.control} w-full px-3`;
const primaryButtonClass = `${ui.button} ${ui.primary}`;
const dangerButtonClass = `${ui.button} ${ui.danger}`;

function PhaseChip({ phase }: { phase: SubjectPhase | null }) {
  if (!phase) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#66532f] bg-[#282116] px-2 py-0.5 text-[11px] font-bold text-[#f6c177]">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f6c177]" />
      {phase.name}
    </span>
  );
}

function getSubjectAncestorIds(subjects: Subject[], subjectId: string | null): string[] {
  if (!subjectId) {
    return [];
  }

  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(subjectId);

  while (current?.parentSubjectId && !visited.has(current.parentSubjectId)) {
    visited.add(current.parentSubjectId);
    ancestors.unshift(current.parentSubjectId);
    current = byId.get(current.parentSubjectId);
  }

  return ancestors;
}

function TaskRow({
  task,
  subjects,
  phases,
  depth,
  today,
  onStatus,
  onOpen,
}: {
  task: Task;
  subjects: Subject[];
  phases: SubjectPhase[];
  depth: number;
  today: string;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onOpen: (taskId: string) => void;
}) {
  const isCompleted = task.status === "completed";
  const isDueToday = task.venceEl === today;
  const isOverdue =
    Boolean(task.venceEl) && compareDateOnly(task.venceEl as string, today) < 0 && !isCompleted;
  const isUnplanned = isActiveTask(task) && Boolean(task.venceEl) && !task.hacerEl;
  const phase = phases.find((item) => item.id === task.phaseId) ?? null;

  return (
    <article
      className={`${dailyStyles.taskRow} group grid w-full gap-3 rounded-2xl border border-[#293b57] bg-[#142338] p-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#466188] hover:bg-[#182a42] hover:shadow-[0_14px_35px_rgba(0,0,0,0.18)] sm:grid-cols-[4px_auto_minmax(0,1fr)] sm:p-4`}
      style={{ marginLeft: depth ? `${Math.min(depth, 4) * 18}px` : undefined }}
    >
      <div
        className={`${dailyStyles.taskMarker} hidden rounded-full sm:block ${
          isCompleted ? "bg-[#45546d]" : depth > 0 ? "bg-[#f6c177]" : "bg-[#8ab4f8]"
        }`}
      />
      {task.aiSuggestion ? (
        <span aria-label="Entrada pendiente de procesar" className={`${dailyStyles.taskToggle} flex h-9 w-9 items-center justify-center rounded-xl border border-[#3f6b73] bg-[#0c2530] font-mono text-sm font-black text-[#7fd8d0] sm:mt-0.5`}>↧</span>
      ) : (
        <label className={`${dailyStyles.taskToggle} flex h-9 w-9 items-center justify-center rounded-xl border border-[#38506f] bg-[#0b1726] sm:mt-0.5`}>
          <input type="checkbox" checked={isCompleted} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => onStatus(task.id, event.target.checked ? "completed" : "pending")} aria-label={`Completar ${task.title}`} className="h-4 w-4 accent-[#8ab4f8]" />
        </label>
      )}

      <button type="button" onClick={() => onOpen(task.id)} className={`${dailyStyles.taskDetail} min-w-0 space-y-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#82afff]/50`}>
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <span
              className={`${dailyStyles.taskTitle} block w-full min-w-0 truncate text-base font-semibold text-[#eef4ff] ${
                isCompleted ? "line-through opacity-55" : ""
              }`}
            >
              {task.title}
            </span>
            <div className={`${dailyStyles.taskMeta} mt-2 flex flex-wrap items-center gap-2 text-xs text-[#91a0bb]`}>
              {task.aiSuggestion ? <span>Entrada capturada</span> : depth > 0 ? <span>Subtarea</span> : <span>Tarea raíz</span>}
              {task.hacerEl ? <span>Hacer {formatDate(task.hacerEl)}</span> : null}
              {task.venceEl ? <span>Vence {formatDate(task.venceEl)}</span> : null}
              <span>{getPriorityLabel(task.priority)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <TaskBadge tone={task.status === "waiting" ? "info" : "neutral"}>
              {getStatusLabel(task.status)}
            </TaskBadge>
            {isOverdue ? <TaskBadge tone="danger">Vencida</TaskBadge> : null}
            {isDueToday ? <TaskBadge tone="warning">Vence hoy</TaskBadge> : null}
            {isUnplanned ? <TaskBadge tone="warning">Sin plan</TaskBadge> : null}
          </div>
        </div>

        <SubjectChips subjects={subjects} subjectIds={task.subjectIds} />
        <PhaseChip phase={phase} />
        {task.notes ? (
          <p className={`${dailyStyles.taskMeta} line-clamp-1 text-sm text-[#9aa8c3]`}>{task.notes}</p>
        ) : null}
        <span className="sr-only">Abrir detalle de {task.title}</span>
      </button>
      {!isCompleted && task.aiSuggestion ? (
        <Link href={workspaceHref("inbox")} className={`${dailyStyles.reviewLink} text-sm font-semibold text-[#a8c7ff] underline underline-offset-4 sm:col-start-3`}>Revisar en Bandeja</Link>
      ) : null}
    </article>
  );
}

function PlanningFormDialog({ title, subjectName, onClose, children }: {
  title: string;
  subjectName?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className={`${ui.dialog} m-auto w-[calc(100%-2rem)] max-w-xl border shadow-2xl backdrop:bg-[#050812]/75`}
      aria-labelledby={titleId}
    >
      <header className="flex items-start justify-between gap-4 border-b border-(--workspace-border) p-4 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className={ui.panelTitle}>{title}</h2>
          {subjectName ? <p className="mt-1 wrap-anywhere text-sm text-(--workspace-muted)">{subjectName}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className={`${ui.button} ${ui.iconButton} shrink-0`}>×</button>
      </header>
      {children}
    </dialog>
  );
}

function SubjectCreateModal({
  isOpen,
  subjects,
  onAddSubject,
  onClose,
  defaultParentSubjectId = null,
}: {
  isOpen: boolean;
  subjects: Subject[];
  onAddSubject: (name: string, horizon: SubjectHorizon, parentSubjectId: string | null) => void;
  onClose: () => void;
  defaultParentSubjectId?: string | null;
}) {
  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const horizon = String(data.get("horizon") ?? "none") as SubjectHorizon;
    const parentSubjectId = String(data.get("parentSubjectId") ?? "");

    if (!name.trim()) {
      return;
    }

    onAddSubject(name, horizon, parentSubjectId || null);
    form.reset();
    onClose();
  }

  return (
    <PlanningFormDialog title="Crear asunto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-5">
        <input
          name="name"
          placeholder="Nombre del asunto"
          aria-label="Nombre del nuevo asunto"
          autoFocus
          className={planningControlClass}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Asunto superior">
            <select
              name="parentSubjectId"
              defaultValue={defaultParentSubjectId ?? ""}
              aria-label="Asunto superior"
              className={planningControlClass}
            >
              <option value="">Asunto raiz</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {getSubjectPath(subjects, subject.id)}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Horizonte">
            <select
              name="horizon"
              defaultValue="none"
              aria-label="Horizonte"
              className={planningControlClass}
            >
              {subjectHorizons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
          <button
            type="button"
            onClick={onClose}
            className={ui.button}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={primaryButtonClass}
          >
            Crear asunto
          </button>
        </div>
      </form>
    </PlanningFormDialog>
  );
}

function SubjectEditModal({
  isOpen,
  subject,
  subjects,
  parentSubjects,
  onRenameSubject,
  onSetSubjectHorizon,
  onSetSubjectParent,
  onDeleteSubject,
  onClose,
}: {
  isOpen: boolean;
  subject: Subject | null;
  subjects: Subject[];
  parentSubjects: Subject[];
  onRenameSubject: (subjectId: string, name: string) => void;
  onSetSubjectHorizon: (subjectId: string, horizon: SubjectHorizon) => void;
  onSetSubjectParent: (subjectId: string, parentSubjectId: string | null) => void;
  onDeleteSubject: (subjectId: string) => void;
  onClose: () => void;
}) {
  if (!isOpen || !subject) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const horizon = String(data.get("horizon") ?? "none") as SubjectHorizon;
    const parentSubjectId = String(data.get("parentSubjectId") ?? "");

    if (!name.trim()) {
      return;
    }

    onRenameSubject(subject.id, name);
    onSetSubjectParent(subject.id, parentSubjectId || null);
    onSetSubjectHorizon(subject.id, horizon);
    onClose();
  }

  return (
    <PlanningFormDialog title="Editar asunto" subjectName={subject.name} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-5">
        <input
          name="name"
          defaultValue={subject.name}
          aria-label="Nombre del asunto"
          autoFocus
          className={planningControlClass}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Asunto superior">
            <select
              name="parentSubjectId"
              defaultValue={subject.parentSubjectId ?? ""}
              aria-label="Asunto superior"
              className={planningControlClass}
            >
              <option value="">Asunto raiz</option>
              {parentSubjects.map((option) => (
                <option key={option.id} value={option.id}>
                  {getSubjectPath(subjects, option.id)}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Horizonte">
            <select
              name="horizon"
              defaultValue={subject.horizon}
              aria-label="Horizonte"
              className={planningControlClass}
            >
              {subjectHorizons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
          <button
            type="button"
            onClick={() => {
              if (!subject) return;
              const descendantCount = getSubjectDescendantIds(subjects, subject.id).length;
              const message = descendantCount
                ? `También se borrarán ${descendantCount} subasuntos. Las tareas se conservarán sin estas asociaciones. ¿Borrar ${subject.name}?`
                : `Las tareas se conservarán sin esta asociación. ¿Borrar ${subject.name}?`;
              if (window.confirm(message)) {
                onDeleteSubject(subject.id);
                onClose();
              }
            }}
            className={`${dangerButtonClass} mr-auto`}
          >
            Borrar asunto
          </button>
          <button
            type="button"
            onClick={onClose}
            className={ui.button}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={primaryButtonClass}
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </PlanningFormDialog>
  );
}

const subjectEventTones: Record<SubjectEventKind, string> = {
  milestone: "border-[#315f5a] bg-[#122b2a] text-[#63d3a5]",
  deadline: "border-[#66532f] bg-[#282116] text-[#f2be67]",
  event: "border-[#46678f] bg-[#142943] text-[#82afff]",
};

function SubjectEventFormModal({
  isOpen,
  event,
  defaultKind,
  subjectName,
  subjects,
  defaultDate,
  phases,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  event: SubjectEvent | null;
  defaultKind: SubjectEventKind;
  subjectName: string;
  subjects?: Subject[];
  defaultDate?: string;
  phases: SubjectPhase[];
  onSave: (draft: SubjectEventDraft, subjectId?: string) => void;
  onClose: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [kind, setKind] = useState<SubjectEventKind>(event?.kind ?? defaultKind);
  const [selectedSubjectId, setSelectedSubjectId] = useState(event?.subjectId ?? subjects?.[0]?.id ?? "");
  const availablePhases = subjects ? phases.filter((phase) => phase.subjectId === selectedSubjectId) : phases;

  if (!isOpen) return null;

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const data = new FormData(submitEvent.currentTarget);
    const draft: SubjectEventDraft = {
      kind: String(data.get("kind")) as SubjectEventKind,
      description: String(data.get("description") ?? ""),
      date: String(data.get("date") ?? ""),
      phaseId: String(data.get("phaseId") ?? "") || null,
      startTime: kind === "event" ? String(data.get("startTime") ?? "") : null,
      endTime: kind === "event" ? String(data.get("endTime") ?? "") : null,
    };

    if (!isValidSubjectEventDraft(draft)) {
      setFormError(kind === "event"
        ? "Completa la descripción y la fecha. Indica horarios válidos, con la finalización posterior al inicio."
        : "Completa una descripción y selecciona una fecha válida.");
      return;
    }

    if (subjects && !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setFormError("Selecciona un asunto para el evento.");
      return;
    }

    onSave(draft, selectedSubjectId || undefined);
    setFormError(null);
    onClose();
  }

  function handleClose() {
    setFormError(null);
    onClose();
  }

  return (
    <PlanningFormDialog title={`${event ? "Editar" : "Crear"} ${getSubjectEventLabel(kind).toLocaleLowerCase("es")}`} subjectName={subjects ? undefined : subjectName} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="grid gap-5 p-4 sm:p-5">
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[#9aabc5]">
            Tipo
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["event", "Evento", "Una actividad con horario"],
              ["milestone", "Hito", "Un logro o punto de referencia"],
              ["deadline", "Vencimiento", "Una entrega o fecha límite"],
            ] as const).map(([value, label, hint]) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => { setKind(value); setFormError(null); }}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-[#344562] bg-[#0d1422] px-2 py-3 transition peer-checked:border-[#82afff] peer-checked:bg-[#152a48] peer-focus-visible:ring-2 peer-focus-visible:ring-[#82afff]/40 sm:p-3">
                  <span className="block text-xs font-black text-[#eef4ff] sm:text-sm">{label}</span>
                  <span className="mt-1 hidden text-xs text-(--workspace-muted) sm:block">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {subjects ? (
          <FieldLabel label="Asunto">
            <select name="subjectId" value={selectedSubjectId} onChange={(changeEvent) => setSelectedSubjectId(changeEvent.target.value)} required className={planningControlClass}>
              <option value="" disabled>Selecciona un asunto</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{getSubjectPath(subjects, subject.id)}</option>)}
            </select>
          </FieldLabel>
        ) : null}

        <FieldLabel label="Descripción">
          <textarea
            name="description"
            defaultValue={event?.description ?? ""}
            placeholder="Ej. Presentación aprobada por el cliente"
            rows={4}
            maxLength={500}
            autoFocus
            required
            className={`${planningControlClass} min-h-28 resize-y py-3`}
          />
        </FieldLabel>

        <FieldLabel label="Fecha">
          <input
            type="date"
            name="date"
            defaultValue={event?.date ?? defaultDate ?? ""}
            required
            className={planningControlClass}
          />
        </FieldLabel>

        {kind === "event" ? (
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Hora de inicio">
              <input type="time" name="startTime" defaultValue={event?.startTime ?? ""} required step={60} className={planningControlClass} />
            </FieldLabel>
            <FieldLabel label="Hora de finalización">
              <input type="time" name="endTime" defaultValue={event?.endTime ?? ""} required step={60} className={planningControlClass} />
            </FieldLabel>
          </div>
        ) : null}

        <FieldLabel label="Fase (opcional)">
          <select
            key={selectedSubjectId}
            name="phaseId"
            defaultValue={event?.phaseId ?? ""}
            className={planningControlClass}
          >
            <option value="">Sin fase</option>
            {availablePhases.map((phase) => (
              <option key={phase.id} value={phase.id}>{phase.name}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-medium leading-5 text-(--workspace-muted)">
            {availablePhases.length > 0
              ? "La fecha aparecerá vinculada a esta etapa del asunto."
              : "Este asunto todavía no tiene fases disponibles."}
          </span>
        </FieldLabel>

        {formError ? (
          <p role="alert" className="rounded-lg border border-[#6f3c35] bg-[#2e1716] px-3 py-2 text-sm font-bold text-[#ff9d88]">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
          <button type="button" onClick={handleClose} className={ui.button}>
            Cancelar
          </button>
          <button type="submit" className={primaryButtonClass}>
            {event ? "Guardar cambios" : `Crear ${getSubjectEventLabel(kind).toLocaleLowerCase("es")}`}
          </button>
        </div>
      </form>
    </PlanningFormDialog>
  );
}

function SubjectEventSection({
  subject,
  events,
  phases,
  onAddEvent,
  onPatchEvent,
  onDeleteEvent,
}: {
  subject: Subject;
  events: SubjectEvent[];
  phases: SubjectPhase[];
  onAddEvent: (subjectId: string, draft: SubjectEventDraft) => void;
  onPatchEvent: (eventId: string, patch: Partial<SubjectEventDraft>) => void;
  onDeleteEvent: (eventId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | SubjectEventKind>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SubjectEvent | null>(null);
  const [defaultKind, setDefaultKind] = useState<SubjectEventKind>("milestone");
  const subjectEvents = sortedSubjectEvents(events, subject.id);
  const visibleEvents = subjectEvents.filter((event) => filter === "all" || event.kind === filter);
  const milestoneCount = subjectEvents.filter((event) => event.kind === "milestone").length;
  const deadlineCount = subjectEvents.filter((event) => event.kind === "deadline").length;
  const eventCount = subjectEvents.filter((event) => event.kind === "event").length;
  const subjectPhases = sortedSubjectPhases(phases, subject.id);

  function openCreate(kind: SubjectEventKind) {
    setEditingEvent(null);
    setDefaultKind(kind);
    setIsFormOpen(true);
  }

  function openEdit(event: SubjectEvent) {
    setEditingEvent(event);
    setDefaultKind(event.kind);
    setIsFormOpen(true);
  }

  return (
    <section className={ui.panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--workspace-border) px-4 py-3">
        <div>
          <h3 className={ui.panelTitle}>Eventos, hitos y vencimientos</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openCreate("event")} className={ui.button}>
            + Evento
          </button>
          <button type="button" onClick={() => openCreate("milestone")} className={ui.button}>
            + Hito
          </button>
          <button type="button" onClick={() => openCreate("deadline")} className={ui.button}>
            + Vencimiento
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-1 border-b border-(--workspace-border) px-2 pt-1" role="group" aria-label="Filtrar fechas clave">
        {([
          ["all", "Todas", subjectEvents.length],
          ["event", "Eventos", eventCount],
          ["milestone", "Hitos", milestoneCount],
          ["deadline", "Vencimientos", deadlineCount],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={ui.tab}
          >
            {label} <span className={planningStyles.tabCount}>{count}</span>
          </button>
        ))}
      </div>

      {visibleEvents.length === 0 ? (
        <div className={`${ui.inset} m-4 border px-5 py-6 text-center`}>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#315177] bg-[#142642] text-[#82afff]" aria-hidden="true">◇</div>
          <p className="mt-3 text-sm font-bold text-(--workspace-muted)">
            {subjectEvents.length === 0 ? "Aún no hay fechas clave." : "No hay elementos de este tipo."}
          </p>
          <p className="mt-1 text-xs text-(--workspace-muted)">Registra un evento con horario, un logro importante o una fecha límite del asunto.</p>
        </div>
      ) : (
        <ol className="relative p-4 before:absolute before:bottom-8 before:left-[43px] before:top-8 before:w-px before:bg-(--workspace-border) lg:max-h-[520px] lg:overflow-y-auto">
          {visibleEvents.map((event) => {
            const phase = event.phaseId
              ? subjectPhases.find((item) => item.id === event.phaseId) ?? null
              : null;
            return (
              <li key={event.id} className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-3 py-2">
                <time dateTime={event.date} className={`relative z-[1] flex h-12 w-12 flex-col items-center justify-center rounded-xl border font-mono ${subjectEventTones[event.kind]}`}>
                  <span className="text-[10px] font-black uppercase">{event.date.slice(5, 7)}</span>
                  <span className="text-base font-black leading-none">{event.date.slice(8, 10)}</span>
                </time>
                <article className={`${ui.inset} border p-3 sm:p-4`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${subjectEventTones[event.kind]}`}>
                          {getSubjectEventLabel(event.kind)}
                        </span>
                        <time dateTime={event.date} className="font-mono text-xs font-bold text-(--workspace-muted)">{formatDate(event.date)}</time>
                        {event.kind === "event" ? <span className="font-mono text-xs font-bold text-[#82afff]">{event.startTime} – {event.endTime}</span> : null}
                        {phase ? (
                          <span className="rounded-full border border-[#3a5170] bg-[#152238] px-2 py-0.5 text-[10px] font-black text-[#a9bdd8]">
                            Fase · {phase.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#e5ebf5]">{event.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(event)} className={ui.button}>Editar</button>
                      <button type="button" onClick={() => { if (window.confirm(`¿Borrar este ${getSubjectEventLabel(event.kind).toLocaleLowerCase("es")}?`)) onDeleteEvent(event.id); }} className={dangerButtonClass}>Borrar</button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {isFormOpen ? <SubjectEventFormModal
        key={editingEvent?.id ?? `new-${defaultKind}`}
        isOpen={isFormOpen}
        event={editingEvent}
        defaultKind={defaultKind}
        subjectName={subject.name}
        phases={subjectPhases}
        onSave={(draft) => {
          if (editingEvent) onPatchEvent(editingEvent.id, draft);
          else onAddEvent(subject.id, draft);
        }}
        onClose={() => setIsFormOpen(false)}
      /> : null}
    </section>
  );
}

const calendarWeekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateOnlyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
  return label.charAt(0).toLocaleUpperCase("es") + label.slice(1);
}

function longDateLabel(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
  return label.charAt(0).toLocaleUpperCase("es") + label.slice(1);
}

function CalendarEventCard({
  event,
  subjects,
  phases,
  onEdit,
  onDelete,
}: {
  event: SubjectEvent;
  subjects: Subject[];
  phases: SubjectPhase[];
  onEdit: (event: SubjectEvent) => void;
  onDelete: (eventId: string) => void;
}) {
  const subjectPath = getSubjectPath(subjects, event.subjectId);
  const phase = event.phaseId ? phases.find((item) => item.id === event.phaseId) ?? null : null;

  return (
    <article className={`${ui.inset} border p-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${subjectEventTones[event.kind]}`}>{getSubjectEventLabel(event.kind)}</span>
        <time dateTime={event.date} className="font-mono text-xs text-(--workspace-muted)">{formatDate(event.date)}</time>
      </div>
      {event.kind === "event" ? <p className="mt-2 font-mono text-xs text-(--accent)">{event.startTime} – {event.endTime}</p> : null}
      <p className="mt-1 wrap-anywhere text-sm font-semibold">{event.description}</p>
      {phase ? <p className="mt-1 wrap-anywhere text-xs text-(--workspace-muted)">Fase · {phase.name}</p> : null}
      <Link href={workspaceHref("subjects", event.subjectId)} className={`${ui.backLink} inline-flex wrap-anywhere`}>
        {subjectPath || "Abrir asunto"} <span aria-hidden="true">→</span>
      </Link>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit(event)} className={ui.button}>Editar</button>
        <button type="button" onClick={() => { if (window.confirm(`¿Borrar este ${getSubjectEventLabel(event.kind).toLocaleLowerCase("es")}?`)) onDelete(event.id); }} className={`${ui.button} ${ui.danger}`}>Borrar</button>
      </div>
    </article>
  );
}

function CalendarView({
  events,
  subjects,
  phases,
  today,
  searchQuery,
  onAddEvent,
  onPatchEvent,
  onDeleteEvent,
}: {
  events: SubjectEvent[];
  subjects: Subject[];
  phases: SubjectPhase[];
  today: string;
  searchQuery: string;
  onAddEvent: (subjectId: string, draft: SubjectEventDraft) => void;
  onPatchEvent: (eventId: string, patch: Partial<SubjectEventDraft>) => void;
  onDeleteEvent: (eventId: string) => void;
}) {
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [filter, setFilter] = useState<"all" | SubjectEventKind>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SubjectEvent | null>(null);
  const query = searchQuery.trim().toLocaleLowerCase("es");
  const matchingEvents = useMemo(
    () =>
      sortedSubjectEvents(events).filter((event) => {
        if (filter !== "all" && event.kind !== filter) return false;
        if (!query) return true;

        return `${event.description} ${getSubjectPath(subjects, event.subjectId)}`
          .toLocaleLowerCase("es")
          .includes(query);
      }),
    [events, filter, query, subjects],
  );
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, SubjectEvent[]>();

    for (const event of matchingEvents) {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    }

    return grouped;
  }, [matchingEvents]);
  const calendarDays = useMemo(() => {
    const [year, month] = monthKey.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month - 1, 1 - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return dateOnlyFromDate(date);
    });
  }, [monthKey]);
  const monthEvents = matchingEvents.filter((event) => event.date.startsWith(monthKey));
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const upcomingEvents = matchingEvents.filter((event) => compareDateOnly(event.date, today) >= 0).slice(0, 6);
  const milestoneCount = events.filter((event) => event.kind === "milestone").length;
  const deadlineCount = events.filter((event) => event.kind === "deadline").length;
  const eventCount = events.filter((event) => event.kind === "event").length;

  function openEdit(event: SubjectEvent) {
    setEditingEvent(event);
    setIsFormOpen(true);
  }

  function moveMonth(offset: number) {
    const [year, month] = monthKey.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    const nextDate = dateOnlyFromDate(next);
    setMonthKey(nextDate.slice(0, 7));
    setSelectedDate(nextDate);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    if (!date.startsWith(monthKey)) setMonthKey(date.slice(0, 7));
  }

  function goToToday() {
    setMonthKey(today.slice(0, 7));
    setSelectedDate(today);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
      <section aria-labelledby="calendar-month-title" className={`${ui.panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--workspace-border) p-4">
          <div>
            <h2 id="calendar-month-title" className={ui.panelTitle}>{monthLabel(monthKey)}</h2>
            <p className="mt-1 text-sm text-(--workspace-muted)">
              {monthEvents.length} {monthEvents.length === 1 ? "fecha clave" : "fechas clave"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={subjects.length === 0} onClick={() => { setEditingEvent(null); setIsFormOpen(true); }} className={`${ui.button} ${ui.primary}`}>+ Evento</button>
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Mes anterior" className={`${ui.button} ${ui.iconButton}`}>←</button>
            <button type="button" onClick={goToToday} className={ui.button}>Hoy</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Mes siguiente" className={`${ui.button} ${ui.iconButton}`}>→</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-1 border-b border-(--workspace-border) px-2 pt-1" role="group" aria-label="Filtrar calendario">
          {([
            ["all", "Todo", events.length],
            ["event", "Eventos", eventCount],
            ["milestone", "Hitos", milestoneCount],
            ["deadline", "Vencimientos", deadlineCount],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={ui.tab}
            >
              {label} <span className={planningStyles.tabCount}>{count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 border-b border-(--workspace-border) bg-(--workspace-inset)">
          {calendarWeekdays.map((weekday) => (
            <div key={weekday} className="py-2 text-center text-xs font-semibold text-(--workspace-muted)">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-(--workspace-border)" role="group" aria-label={`Calendario de ${monthLabel(monthKey)}`}>
          {calendarDays.map((date) => {
            const dayEvents = eventsByDate.get(date) ?? [];
            const isCurrentMonth = date.startsWith(monthKey);
            const isToday = date === today;
            const isSelected = date === selectedDate;

            return (
              <button
                key={date}
                type="button"
                onClick={() => selectDate(date)}
                aria-label={`${longDateLabel(date)}, ${dayEvents.length} ${dayEvents.length === 1 ? "fecha clave" : "fechas clave"}`}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={planningStyles.calendarDay}
              >
                <span className={`grid size-6 place-items-center self-center rounded-md font-mono text-xs font-semibold md:self-start ${isToday ? "bg-(--accent) text-(--workspace-canvas)" : isCurrentMonth ? "" : "text-(--workspace-muted)"}`}>
                  {Number(date.slice(8, 10))}
                </span>
                <span className="flex flex-wrap justify-center gap-0.5 md:hidden" aria-hidden="true">
                  {dayEvents.slice(0, 4).map((event) => (
                    <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.kind === "event" ? "bg-[#82afff]" : event.kind === "milestone" ? "bg-[#63d3a5]" : "bg-[#f2be67]"}`} />
                  ))}
                </span>
                <span className="hidden min-w-0 space-y-1 md:block" aria-hidden="true">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span key={event.id} className={`block truncate rounded-md border-l-2 px-1.5 py-1 text-[10px] font-bold ${subjectEventTones[event.kind]}`}>
                      {event.kind === "event" ? `${event.startTime} ` : ""}{event.description}
                    </span>
                  ))}
                  {dayEvents.length > 2 ? <span className="block font-mono text-xs text-(--workspace-muted)">+{dayEvents.length - 2}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <section aria-labelledby="calendar-day-agenda" className={ui.panel}>
          <div className="border-b border-(--workspace-border) p-4">
            <h2 id="calendar-day-agenda" className={ui.panelTitle}>Agenda del día</h2>
            <p className="mt-1 text-sm text-(--workspace-muted)" aria-live="polite">{longDateLabel(selectedDate)}</p>
          </div>
          <div className="space-y-2 p-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => <CalendarEventCard key={event.id} event={event} subjects={subjects} phases={phases} onEdit={openEdit} onDelete={onDeleteEvent} />)
            ) : (
              <div className="px-2 py-4 text-sm text-(--workspace-muted)">
                <p>Día libre de fechas clave.</p>
                {!subjects.length ? <Link href={subjectManagementHref()} className={`${ui.backLink} inline-flex`}>Crear un asunto</Link> : null}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="calendar-upcoming" className={ui.panel}>
          <div className="border-b border-(--workspace-border) px-4 py-3">
            <h2 id="calendar-upcoming" className={ui.panelTitle}>Próximas fechas</h2>
          </div>
          <div className="space-y-2 p-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => <CalendarEventCard key={event.id} event={event} subjects={subjects} phases={phases} onEdit={openEdit} onDelete={onDeleteEvent} />)
            ) : (
              <p className="px-2 py-4 text-sm text-(--workspace-muted)">No hay próximas fechas con este filtro.</p>
            )}
          </div>
        </section>
      </aside>
      {isFormOpen ? (
        <SubjectEventFormModal
          isOpen
          event={editingEvent}
          defaultKind="event"
          defaultDate={selectedDate}
          subjectName={editingEvent ? getSubjectPath(subjects, editingEvent.subjectId) : "Calendario"}
          subjects={editingEvent ? undefined : subjects}
          phases={editingEvent ? sortedSubjectPhases(phases, editingEvent.subjectId) : phases}
          onSave={(draft, subjectId) => {
            if (editingEvent) onPatchEvent(editingEvent.id, draft);
            else if (subjectId) onAddEvent(subjectId, draft);
            setFilter("all");
            selectDate(draft.date);
          }}
          onClose={() => setIsFormOpen(false)}
        />
      ) : null}
    </div>
  );
}

function PhaseDatePair({
  label,
  start,
  end,
  tone,
}: {
  label: string;
  start: string | null;
  end: string | null;
  tone: "planned" | "executed";
}) {
  const toneClass =
    tone === "planned"
      ? "border-[#30486a] bg-[#111e32] text-[#9fc5ff]"
      : "border-[#4f5030] bg-[#211f15] text-[#f6c177]";

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 font-mono text-xs font-bold">
        {start ? formatDate(start) : "Sin inicio"} → {end ? formatDate(end) : "Sin cierre"}
      </p>
    </div>
  );
}

function DeliverableFormModal({
  isOpen,
  deliverable,
  subjectName,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  deliverable: SubjectDeliverable | null;
  subjectName: string;
  onSave: (draft: SubjectDeliverableDraft) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
    };
    if (!isValidSubjectDeliverableDraft(draft)) {
      setError("Completa el nombre y la descripción.");
      return;
    }
    onSave(draft);
    setError(null);
    onClose();
  }

  return (
    <PlanningFormDialog title={deliverable ? "Editar entregable" : "Nuevo entregable"} subjectName={subjectName} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-5">
        <FieldLabel label="Nombre">
          <input name="name" defaultValue={deliverable?.name ?? ""} placeholder="Ej. Informe final" autoFocus required className={planningControlClass} />
        </FieldLabel>
        <FieldLabel label="Descripción">
          <textarea name="description" defaultValue={deliverable?.description ?? ""} placeholder="Describe qué debe quedar listo y cómo reconocerlo." rows={4} required className={`${planningControlClass} h-auto resize-y py-3`} />
        </FieldLabel>
        {error ? <p role="alert" className="text-xs font-bold text-[#ff9d88]">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-(--workspace-border) pt-4">
          <button type="button" onClick={onClose} className={ui.button}>Cancelar</button>
          <button type="submit" className={primaryButtonClass}>{deliverable ? "Guardar entregable" : "Crear entregable"}</button>
        </div>
      </form>
    </PlanningFormDialog>
  );
}

function SubjectDeliverableSection({
  subject,
  deliverables,
  tasks,
  onAddDeliverable,
  onUpdateDeliverable,
  onDeleteDeliverable,
  onOpenTask,
  onCreateTask,
}: {
  subject: Subject;
  deliverables: SubjectDeliverable[];
  tasks: Task[];
  onAddDeliverable: (subjectId: string, draft: SubjectDeliverableDraft) => void;
  onUpdateDeliverable: (id: string, patch: Partial<SubjectDeliverableDraft>) => void;
  onDeleteDeliverable: (id: string) => void;
  onOpenTask: (id: string) => void;
  onCreateTask: (deliverableId: string) => void;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<SubjectDeliverable | null>(null);
  const subjectDeliverables = sortedSubjectDeliverables(deliverables, subject.id);

  function openCreate() {
    setEditingDeliverable(null);
    setIsFormOpen(true);
  }

  return (
    <section className={ui.panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--workspace-border) px-4 py-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#67d4e7]">Resultados concretos</p>
          <h3 className={ui.panelTitle}>Entregables</h3>
        </div>
        <button type="button" onClick={openCreate} className={ui.button}>Nuevo entregable</button>
      </div>
      {subjectDeliverables.length === 0 ? (
        <div className={`${ui.inset} m-4 border px-5 py-6 text-center`}>
          <p className="text-sm font-bold text-(--workspace-muted)">Este asunto todavía no tiene entregables.</p>
          <p className="mt-1 text-xs text-(--workspace-muted)">Define el primer resultado que querés producir y luego reúne sus tareas.</p>
        </div>
      ) : (
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {subjectDeliverables.map((deliverable) => {
            const assignedTasks = tasks.filter((task) => task.deliverableId === deliverable.id);
            const completed = assignedTasks.filter((task) => task.status === "completed").length;
            const progress = assignedTasks.length ? Math.round((completed / assignedTasks.length) * 100) : 0;
            return (
              <article key={deliverable.id} className={`${ui.inset} border p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="wrap-anywhere text-base font-semibold">{deliverable.name}</h5>
                    <p className="mt-1 text-sm leading-5 text-(--workspace-muted)">{deliverable.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setEditingDeliverable(deliverable); setIsFormOpen(true); }} className={ui.button}>Editar</button>
                    <button type="button" onClick={() => { if (window.confirm(`Las ${assignedTasks.length} tareas vinculadas se conservarán sin entregable. ¿Borrar “${deliverable.name}”?`)) onDeleteDeliverable(deliverable.id); }} className={dangerButtonClass}>Borrar</button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-(--workspace-muted)"><span>{completed} de {assignedTasks.length} tareas completadas</span><span className="font-mono text-[#67d4e7]">{progress}%</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1b3341]"><span className="block h-full rounded-full bg-[#67d4e7] transition-[width]" style={{ width: `${progress}%` }} /></div>
                <div className="mt-4 grid gap-2">
                  {assignedTasks.length ? assignedTasks.map((task) => (
                    <button key={task.id} type="button" onClick={() => onOpenTask(task.id)} className="flex items-center gap-2 rounded-lg border border-[#263d4e] bg-[#101f2e] px-3 py-2 text-left text-sm font-semibold text-[#dce8f5] transition hover:border-[#3d6d7d] hover:bg-[#142838] focus:outline-none focus:ring-2 focus:ring-[#67d4e7]/30">
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${task.status === "completed" ? "bg-[#63d3a5]" : "bg-[#67d4e7]"}`} />
                      <span className={`truncate ${task.status === "completed" ? "line-through opacity-60" : ""}`}>{task.title}</span>
                    </button>
                  )) : <p className="rounded-lg border border-dashed border-[#315363] px-3 py-3 text-xs text-(--workspace-muted)">Sin tareas todavía. Crea una y quedará vinculada a este entregable.</p>}
                  <button type="button" onClick={() => onCreateTask(deliverable.id)} className="mt-1 w-fit text-xs font-black text-[#67d4e7] hover:text-[#9cecf5] focus:outline-none focus:underline">+ Añadir tarea</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <DeliverableFormModal key={editingDeliverable?.id ?? "new-deliverable"} isOpen={isFormOpen} deliverable={editingDeliverable} subjectName={subject.name} onSave={(draft) => editingDeliverable ? onUpdateDeliverable(editingDeliverable.id, draft) : onAddDeliverable(subject.id, draft)} onClose={() => setIsFormOpen(false)} />
    </section>
  );
}

function PhaseFormModal({
  isOpen,
  phase,
  subjectName,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  phase: SubjectPhase | null;
  subjectName: string;
  onSave: (draft: SubjectPhaseDraft) => void;
  onClose: () => void;
}) {
  const [rangeError, setRangeError] = useState<"planned" | "executed" | null>(null);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft: SubjectPhaseDraft = {
      name: String(data.get("name") ?? ""),
      plannedStart: String(data.get("plannedStart") ?? "") || null,
      executedStart: String(data.get("executedStart") ?? "") || null,
      plannedEnd: String(data.get("plannedEnd") ?? "") || null,
      executedEnd: String(data.get("executedEnd") ?? "") || null,
    };
    const nextError = getPhaseDateRangeError(draft);

    if (!draft.name.trim() || nextError) {
      setRangeError(nextError);
      return;
    }

    onSave(draft);
    setRangeError(null);
    onClose();
  }

  function handleClose() {
    setRangeError(null);
    onClose();
  }

  return (
    <PlanningFormDialog title={phase ? "Editar fase" : "Nueva fase"} subjectName={subjectName} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="grid gap-5 p-4 sm:p-5">
        <FieldLabel label="Nombre de la fase">
          <input
            name="name"
            defaultValue={phase?.name ?? ""}
            placeholder="Ej. Preparación"
            autoFocus
            required
            className={planningControlClass}
          />
        </FieldLabel>

        <div className="grid gap-4 rounded-xl border border-[#293852] bg-[#0d1422] p-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8ab4f8]">Plan</p>
              <p className="mt-1 text-xs text-(--workspace-muted)">Las fechas que orientan el trabajo.</p>
            </div>
            <FieldLabel label="Inicio planificado">
              <input type="date" name="plannedStart" defaultValue={phase?.plannedStart ?? ""} className={planningControlClass} />
            </FieldLabel>
            <FieldLabel label="Finalización planificada">
              <input type="date" name="plannedEnd" defaultValue={phase?.plannedEnd ?? ""} className={planningControlClass} />
            </FieldLabel>
            {rangeError === "planned" ? (
              <p role="alert" className="text-xs font-bold text-[#ff9d88]">
                La finalización planificada no puede ser anterior al inicio.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 border-t border-[#293852] pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f6c177]">Ejecución</p>
              <p className="mt-1 text-xs text-(--workspace-muted)">Lo que ocurrió en la práctica.</p>
            </div>
            <FieldLabel label="Inicio ejecutado">
              <input type="date" name="executedStart" defaultValue={phase?.executedStart ?? ""} className={planningControlClass} />
            </FieldLabel>
            <FieldLabel label="Finalización ejecutada">
              <input type="date" name="executedEnd" defaultValue={phase?.executedEnd ?? ""} className={planningControlClass} />
            </FieldLabel>
            {rangeError === "executed" ? (
              <p role="alert" className="text-xs font-bold text-[#ff9d88]">
                La finalización ejecutada no puede ser anterior al inicio.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-(--workspace-border) pt-4">
          <button type="button" onClick={handleClose} className={ui.button}>
            Cancelar
          </button>
          <button type="submit" className={primaryButtonClass}>
            {phase ? "Guardar fase" : "Crear fase"}
          </button>
        </div>
      </form>
    </PlanningFormDialog>
  );
}

function SubjectPhaseSection({
  subject,
  phases,
  tasks,
  onAddPhase,
  onPatchPhase,
  onMovePhase,
  onDeletePhase,
}: {
  subject: Subject;
  phases: SubjectPhase[];
  tasks: Task[];
  onAddPhase: (subjectId: string, draft: SubjectPhaseDraft) => void;
  onPatchPhase: (phaseId: string, patch: Partial<SubjectPhaseDraft>) => void;
  onMovePhase: (phaseId: string, direction: "up" | "down") => void;
  onDeletePhase: (phaseId: string) => void;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<SubjectPhase | null>(null);
  const orderedPhases = sortedSubjectPhases(phases, subject.id);

  function openCreate() {
    setEditingPhase(null);
    setIsFormOpen(true);
  }

  function openEdit(phase: SubjectPhase) {
    setEditingPhase(phase);
    setIsFormOpen(true);
  }

  return (
    <section className={ui.panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--workspace-border) px-4 py-3">
        <div>
          <h3 className={ui.panelTitle}>Fases</h3>
        </div>
        <button type="button" onClick={openCreate} className={ui.button}>
          Nueva fase
        </button>
      </div>

      {orderedPhases.length === 0 ? (
        <div className={`${ui.inset} m-4 border px-5 py-6 text-center`}>
          <p className="text-sm font-bold text-(--workspace-muted)">Este asunto todavía no tiene fases.</p>
          <p className="mt-1 text-xs text-(--workspace-muted)">Crea la primera para separar el plan de lo que realmente se ejecutó.</p>
        </div>
      ) : (
        <ol className="relative grid gap-0 p-4 before:absolute before:bottom-8 before:left-[35px] before:top-8 before:w-px before:bg-(--workspace-border)">
          {orderedPhases.map((phase, index) => {
            const taskCount = tasks.filter((task) => task.phaseId === phase.id).length;

            return (
              <li key={phase.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-2">
                <div className="relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-[#8c713d] bg-[#282116] font-mono text-xs font-black text-[#f6c177]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <article className={`${ui.inset} border p-3 sm:p-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h5 className="wrap-anywhere text-base font-semibold">{phase.name}</h5>
                      <p className="mt-1 text-xs font-semibold text-(--workspace-muted)">
                        {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => onMovePhase(phase.id, "up")} disabled={index === 0} aria-label={`Subir ${phase.name}`} className={`${ui.button} ${ui.iconButton}`}>↑</button>
                      <button type="button" onClick={() => onMovePhase(phase.id, "down")} disabled={index === orderedPhases.length - 1} aria-label={`Bajar ${phase.name}`} className={`${ui.button} ${ui.iconButton}`}>↓</button>
                      <button type="button" onClick={() => openEdit(phase)} className={ui.button}>Editar</button>
                      <button
                        type="button"
                        onClick={() => {
                          const message = taskCount
                            ? `Esta fase tiene ${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}. Las tareas quedarán directamente en el asunto. ¿Borrar la fase?`
                            : "¿Borrar esta fase?";
                          if (window.confirm(message)) onDeletePhase(phase.id);
                        }}
                        className={dangerButtonClass}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <PhaseDatePair label="Plan" start={phase.plannedStart} end={phase.plannedEnd} tone="planned" />
                    <PhaseDatePair label="Ejecución" start={phase.executedStart} end={phase.executedEnd} tone="executed" />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <PhaseFormModal
        key={editingPhase?.id ?? "new-phase"}
        isOpen={isFormOpen}
        phase={editingPhase}
        subjectName={subject.name}
        onSave={(draft) => {
          if (editingPhase) onPatchPhase(editingPhase.id, draft);
          else onAddPhase(subject.id, draft);
        }}
        onClose={() => setIsFormOpen(false)}
      />
    </section>
  );
}

function FolderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.5h7l2 2h8v10h-17z" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

function SubjectFolderBrowser({
  subjects,
  tasks,
  selectedSubjectId,
  onSelectSubject,
  onAddSubject,
}: {
  subjects: Subject[];
  tasks: Task[];
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string | null) => void;
  onAddSubject: (parentSubjectId: string | null) => void;
}) {
  const [currentFolderId, setCurrentFolderId] = useState(selectedSubjectId);
  const [subjectQuery, setSubjectQuery] = useState("");
  const currentFolder = currentFolderId
    ? subjects.find((subject) => subject.id === currentFolderId) ?? null
    : null;
  const activeFolderId = currentFolder?.id ?? null;
  const breadcrumbSubjects = currentFolder
    ? [...getSubjectAncestorIds(subjects, currentFolder.id), currentFolder.id]
        .map((id) => subjects.find((subject) => subject.id === id))
        .filter((subject): subject is Subject => Boolean(subject))
    : [];
  const visibleSubjects = useMemo(() => {
    const query = subjectQuery.trim().toLocaleLowerCase("es");

    if (query) {
      return subjects
        .filter((subject) =>
          getSubjectPath(subjects, subject.id).toLocaleLowerCase("es").includes(query),
        )
        .sort((a, b) =>
          getSubjectPath(subjects, a.id).localeCompare(getSubjectPath(subjects, b.id), "es"),
        );
    }

    return subjects
      .filter((subject) => subject.parentSubjectId === activeFolderId)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [activeFolderId, subjectQuery, subjects]);

  function navigateTo(subjectId: string | null) {
    setCurrentFolderId(subjectId);
    setSubjectQuery("");
    onSelectSubject(subjectId);
  }

  return (
    <div>
      {subjects.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <p className="text-sm text-(--workspace-muted)">Todavía no hay asuntos.</p>
          <button type="button" onClick={() => onAddSubject(null)} className={`${ui.button} ${ui.primary}`}>+ Asunto</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--workspace-border) pb-4">
            <nav aria-label="Ruta de asuntos" className="flex min-w-0 flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => navigateTo(null)}
                aria-current={activeFolderId === null ? "page" : undefined}
                className={ui.tab}
              >
                Todos los asuntos
              </button>
              {breadcrumbSubjects.map((subject) => (
                <div key={subject.id} className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="text-(--workspace-muted)">/</span>
                  <button
                    type="button"
                    onClick={() => navigateTo(subject.id)}
                    aria-current={currentFolderId === subject.id ? "page" : undefined}
                    className={`${ui.tab} min-w-0 wrap-anywhere text-left`}
                  >
                    {subject.name}
                  </button>
                </div>
              ))}
            </nav>
            <div className="flex flex-wrap gap-2">
              {currentFolder ? (
                <button type="button" onClick={() => navigateTo(currentFolder.parentSubjectId)} className={ui.button}>
                  <span aria-hidden="true">←</span> Subir
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onAddSubject(activeFolderId)}
                className={`${ui.button} ${ui.primary}`}
              >
                + {currentFolder ? "Subasunto" : "Asunto"}
              </button>
            </div>
          </div>

          <label className={`${ui.label} mt-4 max-w-xl`}>
            Buscar asuntos
            <input
              type="search"
              value={subjectQuery}
              onChange={(event) => setSubjectQuery(event.target.value)}
              placeholder="Buscar en todas las carpetas"
              className={`${ui.control} w-full px-3`}
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSubjects.length === 0 ? (
              <p className="col-span-full py-2 text-sm text-(--workspace-muted)">{subjectQuery ? "No hay asuntos que coincidan." : "Esta carpeta todavía no tiene subasuntos."}</p>
            ) : visibleSubjects.map((subject) => {
              const isSelected = selectedSubjectId === subject.id;
              const childCount = subjects.filter((item) => item.parentSubjectId === subject.id).length;
              const taskCount = tasks.filter(
                (task) => isActiveTask(task) && task.subjectIds.includes(subject.id),
              ).length;

              return (
                <article
                  key={subject.id}
                  className={`${ui.panel} flex items-start gap-2 p-2`}
                >
                  <button
                    type="button"
                    onClick={() => navigateTo(subject.id)}
                    aria-label={`Abrir carpeta ${subject.name}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={`${ui.selection} flex min-w-0 flex-1 items-start gap-3 rounded-lg p-2 text-left`}
                  >
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-(--accent)"><FolderIcon /></span>
                    <span className="min-w-0">
                      <span className="block wrap-anywhere text-sm font-semibold">{subject.name}</span>
                      {subjectQuery ? <span className="mt-1 block wrap-anywhere text-xs text-(--workspace-muted)">{getSubjectPath(subjects, subject.parentSubjectId)}</span> : null}
                      <span className="mt-2 block wrap-anywhere text-xs text-(--workspace-muted)">
                        {childCount} {childCount === 1 ? "subasunto" : "subasuntos"} · {taskCount} {taskCount === 1 ? "tarea" : "tareas"} · {getHorizonLabel(subject.horizon)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddSubject(subject.id)}
                    aria-label={`Crear subasunto dentro de ${subject.name}`}
                    className={`${ui.button} ${ui.iconButton} shrink-0`}
                  >
                    +
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const subjectHorizonBoardOrder = [...subjectHorizons].sort(
  (a, b) => Number(a.value === "closure") - Number(b.value === "closure"),
);

function SubjectHorizonBoard({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onSetSubjectHorizon,
}: {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string) => void;
  onSetSubjectHorizon: (subjectId: string, horizon: SubjectHorizon) => void;
}) {
  const [draggingSubjectId, setDraggingSubjectId] = useState<string | null>(null);
  const subjectsByHorizon = useMemo(() => {
    const groups = new Map<SubjectHorizon, Subject[]>();
    const parentSubjectIds = new Set(
      subjects
        .map((subject) => subject.parentSubjectId)
        .filter((parentSubjectId): parentSubjectId is string => Boolean(parentSubjectId)),
    );

    for (const item of subjectHorizons) {
      groups.set(item.value, []);
    }

    for (const subject of sortedSubjects(subjects)) {
      if (parentSubjectIds.has(subject.id)) {
        continue;
      }

      groups.get(subject.horizon)?.push(subject);
    }

    return groups;
  }, [subjects]);

  function handleDrop(event: DragEvent<HTMLElement>, horizon: SubjectHorizon) {
    event.preventDefault();
    const subjectId = event.dataTransfer.getData("text/plain") || draggingSubjectId;

    if (subjectId) {
      onSetSubjectHorizon(subjectId, horizon);
    }

    setDraggingSubjectId(null);
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3">
        {subjectHorizonBoardOrder.map((horizon) => {
          const horizonSubjects = subjectsByHorizon.get(horizon.value) ?? [];

          return (
            <section
              key={horizon.value}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, horizon.value)}
              className={`${ui.inset} border p-3`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  {horizon.label}
                </h3>
                <span className={planningStyles.tabCount}>
                  {horizonSubjects.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {horizonSubjects.length === 0 ? (
                  <div className="grid min-h-14 w-full place-items-center rounded-md border border-dashed border-(--workspace-border) px-3 text-center text-sm text-(--workspace-muted)">
                    Sin asuntos en este horizonte
                  </div>
                ) : (
                  horizonSubjects.map((subject) => {
                    const isSelected = selectedSubjectId === subject.id;

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        draggable
                        aria-label={`Abrir detalle de ${subject.name}`}
                        aria-current={isSelected ? "true" : undefined}
                        onClick={() => onSelectSubject(subject.id)}
                        onDragStart={(event) => {
                          setDraggingSubjectId(subject.id);
                          event.dataTransfer.setData("text/plain", subject.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggingSubjectId(null)}
                        className={`${ui.panel} ${ui.selection} min-h-16 w-full px-3 py-2 text-left sm:w-[calc(50%-0.25rem)] 2xl:w-[calc(33.333%-0.34rem)]`}
                      >
                        <span className="block wrap-anywhere text-sm font-semibold">
                          {subject.name}
                        </span>
                        <span className="mt-1 block wrap-anywhere text-xs text-(--workspace-muted)">
                          {getSubjectPath(subjects, subject.parentSubjectId)}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-(--accent)">
                          Ver tareas y detalle →
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function TaskManager({ activeView, tabs, initialSubjectId, planningReturnHref }: {
  activeView: ViewKey;
  tabs: readonly WorkspaceView[];
  initialSubjectId: string | null;
  planningReturnHref?: string;
}) {
  const workspace = useWorkspace();
  const [companionConversationCount, setCompanionConversationCount] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(initialSubjectId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskDeliverableId, setNewTaskDeliverableId] = useState<string | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectParentId, setNewSubjectParentId] = useState<string | null>(null);
  const [isSubjectEditModalOpen, setIsSubjectEditModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subjectViewMode, setSubjectViewMode] = useState<SubjectViewMode>("folders");
  const searchRef = useRef<HTMLInputElement>(null);
  const subjectDetailRef = useRef<HTMLDivElement>(null);
  const isPlanningTool = activeView === "calendar" || activeView === "subjects";

  const selectedSubject = selectedSubjectId
    ? (workspace.subjects.find((subject) => subject.id === selectedSubjectId) ?? null)
    : null;
  const selectedTask = selectedTaskId
    ? (workspace.tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;

  useEffect(() => {
    if (activeView === "subjects" && subjectViewMode === "horizon" && selectedSubjectId) {
      subjectDetailRef.current?.focus({ preventScroll: true });
      subjectDetailRef.current?.scrollIntoView({ block: "start" });
    }
  }, [activeView, selectedSubjectId, subjectViewMode]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (document.querySelector("dialog[open]")) return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        setSelectedTaskId(null);
        setIsTaskModalOpen(false);
        setIsSubjectModalOpen(false);
        setIsSubjectEditModalOpen(false);
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === "/" && searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (
        event.key.toLowerCase() === "n" &&
        activeView !== "companion" &&
        activeView !== "subjects" &&
        activeView !== "nutrition" &&
        activeView !== "locations" &&
        activeView !== "ideal-day" &&
        activeView !== "expectations"
      ) {
        event.preventDefault();
        setIsTaskModalOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeView]);

  const visibleTasks = useMemo(() => {
    if (activeView === "companion") {
      return [];
    }

    if (activeView === "today") {
      return workspace.planning.views.today;
    }

    if (activeView === "unassigned") {
      return workspace.planning.views.unassigned;
    }

    if (activeView === "upcoming") {
      return workspace.planning.views.upcoming;
    }

    if (activeView === "waiting") {
      return workspace.planning.views.waiting;
    }

    if (activeView === "completed") {
      return workspace.planning.views.completed;
    }

    if (activeView === "calendar") {
      return [];
    }

    if (activeView === "nutrition") {
      return [];
    }

    if (activeView === "locations") {
      return [];
    }

    if (activeView === "expectations" || activeView === "ideal-day") {
      return [];
    }

    if (selectedSubjectId) {
      return workspace.planning.getTasksForSubject(selectedSubjectId);
    }

    return [];
  }, [activeView, selectedSubjectId, workspace]);

  const filteredTasks = useMemo(
    () =>
      visibleTasks.filter((task) =>
        taskMatchesQuery(task, workspace.tasks, workspace.subjects, workspace.phases, searchQuery),
      ),
    [searchQuery, visibleTasks, workspace.tasks, workspace.subjects, workspace.phases],
  );
  const filteredTaskItems = useMemo(() => taskTreeItems(filteredTasks), [filteredTasks]);

  const navItems: { key: ViewKey; count: number }[] = [
    { key: "companion", count: companionConversationCount },
    { key: "ideal-day", count: workspace.idealDayGoals.filter((goal) => goal.date === workspace.today && !goal.completed).length },
    { key: "upcoming", count: workspace.planning.views.upcoming.length },
    { key: "unassigned", count: workspace.planning.views.unassigned.length },
    { key: "waiting", count: workspace.planning.views.waiting.length },
    { key: "expectations", count: workspace.expectations.filter((item) => item.status === "pending").length },
    { key: "completed", count: workspace.planning.views.completed.length },
    { key: "calendar", count: workspace.subjectEvents.length },
    { key: "subjects", count: workspace.subjects.length },
    { key: "nutrition", count: workspace.nutritionPlanItems.filter((item) => item.date === workspace.today).length },
    { key: "locations", count: workspace.locationEntries.filter((item) => item.date === workspace.today).length },
  ];
  const localNavigation = tabs.flatMap((view) => navItems.filter(({ key }) => key === view));

  const heading = activeView === "subjects" ? "Gestionar asuntos" : viewLabels[activeView];
  const hasSearch = searchQuery.trim().length > 0;
  const emptyLabel =
    activeView === "subjects" && !selectedSubject
      ? "Elegi un asunto para ver sus tareas."
      : hasSearch
        ? "No hay coincidencias en esta vista."
        : "No hay tareas en esta vista.";
  const defaultTaskSubjectIds =
    activeView === "subjects" && selectedSubjectId ? [selectedSubjectId] : [];
  const screenClass = activeView === "today"
    ? `${ui.screen} ${dailyStyles.screen}`
    : isPlanningTool ? `${ui.screen} ${planningStyles.planning} ${dailyStyles.planningTasks}` : "relative flex-1 overflow-x-hidden bg-[#07111d] text-[#eaf1fb]";
  const planningSearch = (
    <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
      <label className={`${ui.label} min-w-36 flex-1 sm:w-64`}>
        {activeView === "calendar" ? "Buscar fechas clave" : "Buscar tareas del asunto"}
        <input type="search" ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-keyshortcuts="/" className={`${ui.control} w-full px-3`} />
      </label>
      {hasSearch ? <button type="button" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} className={ui.button}>Limpiar búsqueda</button> : null}
    </div>
  );

  if (!workspace.isLoaded) return <WorkspaceLoading />;

  return (
    <main className={screenClass}>
      {activeView === "today" ? (
        <div className={ui.frame}>
          <header className={`${ui.header} grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pb-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end`}>
            <div className="grid gap-2">
              <h1 className={ui.title}>Hoy</h1>
              <time dateTime={workspace.today} className="text-sm text-(--workspace-muted) first-letter:uppercase">
                {todayDate.format(new Date(`${workspace.today}T12:00:00`))}
              </time>
            </div>
            <button type="button" onClick={() => setIsTaskModalOpen(true)} className={`${ui.button} ${ui.primary}`}>
              <span aria-hidden="true">+</span> Crear tarea
            </button>
            <div className="col-span-2 flex min-w-0 flex-wrap items-end gap-2 md:col-span-1">
              <label className={`${ui.label} min-w-36 flex-1 md:w-56 lg:w-64`}>
                Buscar en Hoy
                <input ref={searchRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-keyshortcuts="/" className={`${ui.control} w-full px-3`} />
              </label>
              {hasSearch ? <button type="button" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} className={ui.button}>Limpiar búsqueda</button> : null}
            </div>
          </header>
          <TodayOverview
            workspace={workspace}
            searchQuery={searchQuery}
            taskCount={filteredTaskItems.length}
            taskContent={filteredTaskItems.map(({ task, depth }) => (
              <TaskRow
                key={task.id}
                task={task}
                subjects={workspace.subjects}
                phases={workspace.phases}
                depth={depth}
                today={workspace.today}
                onStatus={workspace.planning.setTaskStatus}
                onOpen={setSelectedTaskId}
              />
            ))}
          />
        </div>
      ) : (
      <div className={isPlanningTool ? ui.frame : "relative min-w-0"}>
        {isPlanningTool ? (
          <header className={ui.header}>
            <div className={ui.heading}>
              <h1 className={`${ui.title} ${planningStyles.title}`}>{heading}</h1>
              {activeView === "subjects" ? (
                <Link href={planningReturnHref ?? workspaceHref("subjects", selectedSubject?.id)} className={planningStyles.actionLink}>
                  <span aria-hidden="true">←</span> Volver a Planificación
                </Link>
              ) : planningSearch}
            </div>
            <PlanningTabs view={activeView === "calendar" ? "calendar" : undefined} unassigned={workspace.planning.views.unassigned.length} />
          </header>
        ) : (
        <>
        <div aria-hidden="true" className="app-grid pointer-events-none absolute inset-0" />
        {localNavigation.length > 1 ? (
          <nav aria-label="Vistas del módulo" className="border-b border-[#20334d] bg-[#0b1624]">
            <div className="mx-auto flex max-w-[1500px] flex-wrap gap-x-2 gap-y-1 px-4 py-2 md:px-6">
              {localNavigation.map(({ key, count }) => (
                <Link key={key} href={workspaceHref(key)} prefetch={false} aria-current={activeView === key ? "page" : undefined} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#b5c6de] hover:bg-[#192d46] aria-[current=page]:bg-[#17345a] aria-[current=page]:text-[#f2f6ff]">
                  <ViewIcon view={key} />
                  {viewLabels[key]}
                  {count > 0 ? <span className="font-mono text-xs opacity-80">{count}</span> : null}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      <header className="hidden lg:block border-b border-[#20334d] bg-[#07111d]/88 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7890b2]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            </span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeView === "ideal-day" ? "Buscar objetivos del día…" : activeView === "companion" ? "Buscar conversaciones…" : activeView === "nutrition" ? "Buscar alimentos y preparaciones…" : activeView === "locations" ? "Buscar lugares y notas…" : "Buscar en tu espacio…"}
              aria-label={activeView === "ideal-day" ? "Buscar objetivos del día" : activeView === "companion" ? "Buscar conversaciones" : activeView === "nutrition" ? "Buscar alimentos y preparaciones" : activeView === "locations" ? "Buscar lugares y notas" : "Buscar en tu espacio"}
              className="h-11 w-full rounded-xl border border-[#2b4261] bg-[#0d1a2a] pl-10 pr-14 text-sm font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#667b9a] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#334b6d] bg-[#142338] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#8295b0] sm:block">/</kbd>
          </label>

        </div>
      </header>
        </>
        )}

      <div className={isPlanningTool ? undefined : "mx-auto grid max-w-[1500px] gap-5 p-4 md:p-6 lg:p-8"}>
        <section key={activeView} className={isPlanningTool ? "min-w-0 space-y-5" : "view-enter min-w-0 space-y-6"}>
          {isPlanningTool ? (
            activeView === "subjects" ? (
                <div role="group" aria-label="Explorador de asuntos" className="flex w-fit flex-wrap gap-1 border-b border-(--workspace-border)">
                  {(["folders", "horizon"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setSubjectViewMode(mode);
                        if (mode === "horizon") setSelectedSubjectId(null);
                      }}
                      aria-pressed={subjectViewMode === mode}
                      className={ui.tab}
                    >
                      {mode === "folders" ? "Carpetas" : "Horizonte"}
                    </button>
                  ))}
                </div>
            ) : null
          ) : (
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#20334d] pb-5">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#82afff]">
                {activeView === "companion"
                  ? `${companionConversationCount} ${companionConversationCount === 1 ? "conversación guardada" : "conversaciones guardadas"}`
                  : activeView === "nutrition"
                  ? `${workspace.nutritionPlanItems.filter((item) => item.date === workspace.today).length} comidas planificadas hoy`
                  : activeView === "locations"
                  ? `${workspace.locationEntries.filter((item) => item.date === workspace.today).length} franjas planificadas hoy`
                  : activeView === "ideal-day"
                  ? "Objetivos para cada fecha"
                  : activeView === "expectations"
                  ? `${workspace.expectations.filter((item) => item.status === "pending").length} ${workspace.expectations.filter((item) => item.status === "pending").length === 1 ? "espera pendiente" : "esperas pendientes"}`

                  : hasSearch
                    ? `${filteredTasks.length} de ${visibleTasks.length} resultados`
                    : `${visibleTasks.length} ${visibleTasks.length === 1 ? "tarea" : "tareas"}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[#f4f7fc] md:text-5xl">
                  {heading}
                </h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8293ad]">{viewDescriptions[activeView]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-[#314966] px-3 py-2.5 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#142338] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
                >
                  Limpiar busqueda
                </button>
              ) : null}
              {activeView !== "companion" && activeView !== "nutrition" && activeView !== "locations" && activeView !== "expectations" && activeView !== "ideal-day" ? (
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#82afff] bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f] shadow-[0_10px_24px_rgba(130,175,255,0.18)] transition hover:-translate-y-0.5 hover:bg-[#a8c7ff] focus:outline-none focus:ring-2 focus:ring-[#82afff]/40"
                >
                  <span className="text-lg leading-none">+</span> Crear tarea
                </button>
              ) : null}
            </div>
          </div>
          )}

          {activeView === "companion" ? (
            <CompanionView
              searchQuery={searchQuery}
              onConversationCountChange={setCompanionConversationCount}
            />
          ) : activeView === "locations" ? (
            <LocationsView workspace={workspace} searchQuery={searchQuery} />
          ) : activeView === "ideal-day" ? (
            <IdealDayView workspace={workspace} searchQuery={searchQuery} />
          ) : activeView === "expectations" ? (
            <ExpectationsView workspace={workspace} />
          ) : activeView === "nutrition" ? (
            <NutritionView workspace={workspace} searchQuery={searchQuery} />
          ) : activeView === "subjects" ? (
            <div ref={subjectDetailRef} tabIndex={-1} className="scroll-mt-24 space-y-6 outline-none">
              {subjectViewMode === "horizon" && selectedSubject ? (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className={ui.button}
                >
                  ← Volver al horizonte
                </button>
              ) : null}
              {subjectViewMode === "folders" || !selectedSubject ? (
                <div className={`${ui.panel} p-4 sm:p-5`}>
                  <div className="mb-4">
                    <h2 className={ui.panelTitle}>{subjectViewMode === "folders" ? "Carpetas de asuntos" : "Asuntos por horizonte"}</h2>
                  </div>
                  {subjectViewMode === "folders" ? (
                    <SubjectFolderBrowser
                      subjects={workspace.subjects}
                      tasks={workspace.tasks}
                      selectedSubjectId={selectedSubjectId}
                      onSelectSubject={(subjectId) => {
                        setSelectedSubjectId(subjectId);
                      }}
                      onAddSubject={(parentSubjectId) => {
                        setNewSubjectParentId(parentSubjectId);
                        setIsSubjectModalOpen(true);
                      }}
                    />
                  ) : (
                    <SubjectHorizonBoard
                      subjects={workspace.subjects}
                      selectedSubjectId={selectedSubjectId}
                      onSelectSubject={(subjectId) => {
                        setSelectedSubjectId(subjectId);
                      }}
                      onSetSubjectHorizon={workspace.setSubjectHorizon}
                    />
                  )}
                </div>
              ) : null}

              {subjectViewMode === "folders" || selectedSubject ? (
                <div className="min-w-0 space-y-6">
                  {selectedSubject ? (
                    <>
                      <div className={`${ui.panel} flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5`}>
                        <div className="min-w-0">
                          <h2 className={`${ui.panelTitle} wrap-anywhere`}>
                            {getSubjectPath(workspace.subjects, selectedSubject.id)}
                          </h2>
                          <p className="mt-1 text-sm text-(--workspace-muted)">
                            {getHorizonLabel(selectedSubject.horizon)} · Pendientes: {visibleTasks.filter(isActiveTask).length} · Completadas: {visibleTasks.filter((task) => task.status === "completed").length}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setIsSubjectEditModalOpen(true)}
                            className={ui.button}
                          >
                            Editar asunto
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsTaskModalOpen(true)}
                            className={`${ui.button} ${ui.primary}`}
                          >
                            Nueva tarea
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {selectedSubject ? <section aria-labelledby="managed-subject-tasks" className={`${ui.panel} space-y-3 p-4`}>
                    <h3 id="managed-subject-tasks" className={ui.panelTitle}>Tareas del asunto</h3>
                    {visibleTasks.length > 0 ? planningSearch : null}
                    {filteredTaskItems.length === 0 ? (
                      <p className="py-3 text-sm text-(--workspace-muted)">{hasSearch ? "No hay tareas que coincidan." : "Este asunto todavía no tiene tareas."}</p>
                    ) : (
                      filteredTaskItems.map(({ task, depth }) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          subjects={workspace.subjects}
                          phases={workspace.phases}
                          depth={depth}
                          today={workspace.today}
                          onStatus={workspace.planning.setTaskStatus}
                          onOpen={setSelectedTaskId}
                        />
                      ))
                    )}
                  </section> : null}
                  {selectedSubject ? (
                    <>
                      <SubjectDeliverableSection
                        subject={selectedSubject}
                        deliverables={workspace.deliverables}
                        tasks={workspace.tasks}
                        onAddDeliverable={workspace.addDeliverable}
                        onUpdateDeliverable={workspace.updateDeliverable}
                        onDeleteDeliverable={workspace.deleteDeliverable}
                        onOpenTask={setSelectedTaskId}
                        onCreateTask={(deliverableId) => {
                          setNewTaskDeliverableId(deliverableId);
                          setIsTaskModalOpen(true);
                        }}
                      />
                      <SubjectEventSection
                        subject={selectedSubject}
                        events={workspace.subjectEvents}
                        phases={workspace.phases}
                        onAddEvent={workspace.addSubjectEvent}
                        onPatchEvent={workspace.updateSubjectEvent}
                        onDeleteEvent={workspace.deleteSubjectEvent}
                      />
                      <SubjectPhaseSection
                        subject={selectedSubject}
                        phases={workspace.phases}
                        tasks={workspace.tasks}
                        onAddPhase={workspace.addPhase}
                        onPatchPhase={workspace.patchPhase}
                        onMovePhase={workspace.movePhase}
                        onDeletePhase={workspace.deletePhase}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : activeView === "calendar" ? (
            <CalendarView
              events={workspace.subjectEvents}
              subjects={workspace.subjects}
              phases={workspace.phases}
              today={workspace.today}
              searchQuery={searchQuery}
              onAddEvent={workspace.addSubjectEvent}
              onPatchEvent={workspace.updateSubjectEvent}
              onDeleteEvent={workspace.deleteSubjectEvent}
            />
          ) : (
            <div className="space-y-3">
              {filteredTaskItems.length === 0 ? (
                <TaskEmptyState label={emptyLabel} hint={hasSearch ? "Prueba con otro término o limpia la búsqueda." : "Usa “Crear tarea” cuando quieras capturar algo nuevo."} />
              ) : (
                filteredTaskItems.map(({ task, depth }) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subjects={workspace.subjects}
                    phases={workspace.phases}
                    depth={depth}
                    today={workspace.today}
                    onStatus={workspace.planning.setTaskStatus}
                    onOpen={setSelectedTaskId}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>
      </div>
      )}
      <TaskCreateModal
        key={`create-task-${defaultTaskSubjectIds.join("|")}-${newTaskDeliverableId ?? "none"}`}
        isOpen={isTaskModalOpen}
        subjects={workspace.subjects}
        deliverables={workspace.deliverables}
        phases={workspace.phases}
        tasks={workspace.tasks}
        onAddTask={workspace.planning.addTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setNewTaskDeliverableId(null);
        }}
        defaultSubjectIds={defaultTaskSubjectIds}
        defaultDeliverableId={newTaskDeliverableId}
      />
      <TaskEditModal
        task={selectedTask}
        subjects={workspace.subjects}
        deliverables={workspace.deliverables}
        phases={workspace.phases}
        today={workspace.today}
        onPatch={workspace.planning.patchTask}
        onAssignSubjects={workspace.planning.assignTaskSubjects}
        onDelete={workspace.planning.deleteTask}
        onClose={() => setSelectedTaskId(null)}
        getAvailableParentTasksForTask={workspace.planning.getAvailableParentTasksForTask}
      />
      <SubjectCreateModal
        isOpen={isSubjectModalOpen}
        subjects={workspace.subjects}
        onAddSubject={workspace.addSubject}
        onClose={() => setIsSubjectModalOpen(false)}
        defaultParentSubjectId={newSubjectParentId}
      />
      <SubjectEditModal
        isOpen={isSubjectEditModalOpen}
        subject={selectedSubject}
        subjects={workspace.subjects}
        parentSubjects={workspace.getAvailableParentSubjects(selectedSubjectId)}
        onRenameSubject={workspace.renameSubject}
        onSetSubjectHorizon={workspace.setSubjectHorizon}
        onSetSubjectParent={workspace.setSubjectParent}
        onDeleteSubject={(subjectId) => {
          workspace.deleteSubject(subjectId);
          setSelectedSubjectId(null);
        }}
        onClose={() => setIsSubjectEditModalOpen(false)}
      />
    </main>
  );
}
