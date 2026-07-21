"use client";

import { type DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTaskWorkspace } from "../hooks/use-task-workspace";
import {
  compareDateOnly,
  getPhaseDateRangeError,
  getHorizonLabel,
  getSubjectDescendantIds,
  getSubjectPath,
  getTaskAvailablePhases,
  isActiveTask,
  subjectHorizons,
  sortedSubjectPhases,
  taskPriorities,
  taskStatuses,
  taskTreeItems,
  type Subject,
  type SubjectHorizon,
  type SubjectPhase,
  type SubjectPhaseDraft,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from "../lib/tasks";

type ViewKey = "today" | "inbox" | "upcoming" | "waiting" | "completed" | "subjects";
type SubjectViewMode = "tree" | "horizon";
type EditableTaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "notes"
    | "subjectIds"
    | "phaseId"
    | "parentTaskId"
    | "hacerEl"
    | "venceEl"
    | "priority"
    | "status"
  >
>;

type SubjectTreeItem = {
  subject: Subject;
  depth: number;
  hasChildren: boolean;
};

const viewLabels: Record<ViewKey, string> = {
  today: "Hoy",
  inbox: "Bandeja",
  upcoming: "Proximas",
  waiting: "Esperando",
  completed: "Completadas",
  subjects: "Asuntos",
};

const viewDescriptions: Record<ViewKey, string> = {
  today: "Lo que requiere atención en esta fecha.",
  inbox: "Ideas y tareas que todavía no organizaste.",
  upcoming: "El trabajo que se acerca en los próximos días.",
  waiting: "Tareas detenidas por una respuesta o condición externa.",
  completed: "El registro de lo que ya resolviste.",
  subjects: "Organiza el trabajo por contexto, horizonte y fases.",
};

function ViewIcon({ view }: { view: ViewKey }) {
  const paths: Record<ViewKey, React.ReactNode> = {
    today: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    inbox: <><path d="M4 5.5h16v13H4z" /><path d="M4 14h4l1.5 2h5l1.5-2h4" /></>,
    upcoming: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    waiting: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5v7M14.5 8.5v7" /></>,
    completed: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8.5" /></>,
    subjects: <><path d="M4 6.5h7l2 2H20v10H4z" /><path d="M4 10h16" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[view]}
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: TaskStatus) {
  return taskStatuses.find((item) => item.value === status)?.label ?? status;
}

function getPriorityLabel(priority: TaskPriority) {
  return taskPriorities.find((item) => item.value === priority)?.label ?? priority;
}

function subjectLabels(subjects: Subject[], subjectIds: string[]) {
  if (subjectIds.length === 0) {
    return ["Sin asunto"];
  }

  return subjectIds.map((id) => getSubjectPath(subjects, id));
}

function taskParentLabel(tasks: Task[], parentTaskId: string | null) {
  if (!parentTaskId) {
    return "Tarea raiz";
  }

  return tasks.find((task) => task.id === parentTaskId)?.title ?? "Tarea superior";
}

function taskMatchesQuery(
  task: Task,
  tasks: Task[],
  subjects: Subject[],
  phases: SubjectPhase[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const labels = subjectLabels(subjects, task.subjectIds);
  const horizons = task.subjectIds.map((id) => {
    const subject = subjects.find((item) => item.id === id);
    return subject ? getHorizonLabel(subject.horizon) : "";
  });
  const searchable = [
    task.title,
    task.notes,
    taskParentLabel(tasks, task.parentTaskId),
    ...labels,
    ...horizons,
    getStatusLabel(task.status),
    getPriorityLabel(task.priority),
    getPhaseLabel(phases, task.phaseId),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function getPhaseLabel(phases: SubjectPhase[], phaseId: string | null) {
  if (!phaseId) {
    return "Directamente en el asunto";
  }

  return phases.find((phase) => phase.id === phaseId)?.name ?? "Fase no disponible";
}

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

function getSubjectTreeItems(subjects: Subject[], expandedSubjectIds: Set<string>): SubjectTreeItem[] {
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const childrenByParent = new Map<string | null, Subject[]>();

  for (const subject of subjects) {
    const parentId =
      subject.parentSubjectId && subjectIds.has(subject.parentSubjectId)
        ? subject.parentSubjectId
        : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(subject);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const items: SubjectTreeItem[] = [];

  function walk(subject: Subject, depth: number, visited: Set<string>) {
    if (visited.has(subject.id)) {
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(subject.id);
    const children = childrenByParent.get(subject.id) ?? [];

    items.push({
      subject,
      depth,
      hasChildren: children.length > 0,
    });

    if (!expandedSubjectIds.has(subject.id)) {
      return;
    }

    for (const child of children) {
      walk(child, depth + 1, nextVisited);
    }
  }

  for (const root of childrenByParent.get(null) ?? []) {
    walk(root, 0, new Set());
  }

  return items;
}

function sortedSubjects(subjects: Subject[]) {
  return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
}

function TaskEmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#344562] bg-[#0d1725]/75 px-6 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#365079] bg-[#132642] text-lg text-[#82afff]">→</span>
        <p className="mt-4 text-sm font-bold text-[#c9d6eb]">{label}</p>
        {hint ? <p className="mt-1.5 text-xs leading-5 text-[#7f91ad]">{hint}</p> : null}
      </div>
    </div>
  );
}

function TaskBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral: "border-[#3b506e] bg-[#18283e] text-[#c1cee1]",
    warning: "border-[#745a28] bg-[#2b2415] text-[#f2be67]",
    danger: "border-[#7a3d32] bg-[#2e1716] text-[#ff9d88]",
    info: "border-[#38659a] bg-[#132844] text-[#82afff]",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black ${styles[tone]}`}>
      {children}
    </span>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8090ad]">
      {label}
      {children}
    </label>
  );
}

const controlClass =
  "h-11 w-full rounded-xl border border-[#324968] bg-[#0b1726] px-3 text-sm font-normal normal-case tracking-normal text-[#dce6f8] outline-none transition placeholder:text-[#61708d] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15";

function SubjectChips({ subjects, subjectIds }: { subjects: Subject[]; subjectIds: string[] }) {
  const labels = subjectLabels(subjects, subjectIds);

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-[#35557e] bg-[#132642] px-2.5 py-1 text-[10px] font-bold text-[#a9cbff]"
        >
          {label}
        </span>
      ))}
    </div>
  );
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
      className="group grid w-full gap-3 rounded-2xl border border-[#293b57] bg-[#142338] p-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#466188] hover:bg-[#182a42] hover:shadow-[0_14px_35px_rgba(0,0,0,0.18)] sm:grid-cols-[4px_auto_minmax(0,1fr)] sm:p-4"
      style={{ marginLeft: depth ? `${Math.min(depth, 4) * 18}px` : undefined }}
    >
      <div
        className={`hidden rounded-full sm:block ${
          isCompleted ? "bg-[#45546d]" : depth > 0 ? "bg-[#f6c177]" : "bg-[#8ab4f8]"
        }`}
      />
      <label className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#38506f] bg-[#0b1726] sm:mt-0.5">
        <input
          type="checkbox"
          checked={isCompleted}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) =>
            onStatus(task.id, event.target.checked ? "completed" : "pending")
          }
          aria-label={`Completar ${task.title}`}
          className="h-4 w-4 accent-[#8ab4f8]"
        />
      </label>

      <button type="button" onClick={() => onOpen(task.id)} className="min-w-0 space-y-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#82afff]/50">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <span
              className={`block w-full min-w-0 truncate text-base font-semibold text-[#eef4ff] ${
                isCompleted ? "line-through opacity-55" : ""
              }`}
            >
              {task.title}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#91a0bb]">
              {depth > 0 ? <span>Subtarea</span> : <span>Tarea raiz</span>}
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
          <p className="line-clamp-1 text-sm text-[#9aa8c3]">{task.notes}</p>
        ) : null}
        <span className="sr-only">Abrir detalle de {task.title}</span>
      </button>
    </article>
  );
}

function TaskEditModal({
  task,
  subjects,
  phases,
  today,
  onPatch,
  onStatus,
  onPriority,
  onDelete,
  onClose,
  getAvailableParentTasksForTask,
}: {
  task: Task | null;
  subjects: Subject[];
  phases: SubjectPhase[];
  today: string;
  onPatch: (taskId: string, patch: EditableTaskPatch) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onPriority: (taskId: string, priority: TaskPriority) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  getAvailableParentTasksForTask: (taskId: string) => Task[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  if (!task) {
    return null;
  }

  const isCompleted = task.status === "completed";
  const isDueToday = task.venceEl === today;
  const isOverdue =
    Boolean(task.venceEl) && compareDateOnly(task.venceEl as string, today) < 0 && !isCompleted;
  const isUnplanned = isActiveTask(task) && Boolean(task.venceEl) && !task.hacerEl;
  const parentOptions = getAvailableParentTasksForTask(task.id);
  const parentTask = parentOptions.find((option) => option.id === task.parentTaskId);
  const availablePhases = getTaskAvailablePhases(phases, task.subjectIds);
  const selectedPhase = phases.find((phase) => phase.id === task.phaseId) ?? null;

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Detalle de tarea</p>
            <h3 id="edit-task-title" className="mt-1 truncate text-xl font-black text-[#eef4ff]">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
          >
            x
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <TaskBadge tone={task.status === "waiting" ? "info" : "neutral"}>
              {getStatusLabel(task.status)}
            </TaskBadge>
            {isOverdue ? <TaskBadge tone="danger">Vencida</TaskBadge> : null}
            {isDueToday ? <TaskBadge tone="warning">Vence hoy</TaskBadge> : null}
            {isUnplanned ? <TaskBadge tone="warning">Sin plan</TaskBadge> : null}
          </div>

          {isEditing ? (
            <>
              <input
                value={task.title}
                onChange={(event) => onPatch(task.id, { title: event.target.value })}
                aria-label="Titulo de la tarea"
                className="h-12 min-w-0 rounded-lg border border-[#33435f] bg-[#0c1320] px-4 text-base font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#6d7b97] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
              />

              <textarea
                value={task.notes}
                onChange={(event) => onPatch(task.id, { notes: event.target.value })}
                rows={4}
                aria-label="Notas"
                placeholder="Notas"
                className="w-full resize-none rounded-md border border-[#2f3e59] bg-[#101827] px-3 py-2 text-sm text-[#cbd7ee] outline-none transition placeholder:text-[#61708d] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
              />
            </>
          ) : (
            <>
              <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-4 py-3">
                <p className="text-[11px] font-bold uppercase text-[#8090ad]">Titulo</p>
                <p className="mt-1 text-base font-semibold text-[#eef4ff]">{task.title}</p>
              </div>

              <div className="min-h-24 rounded-lg border border-[#2f3e59] bg-[#101827] px-4 py-3">
                <p className="text-[11px] font-bold uppercase text-[#8090ad]">Notas</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#cbd7ee]">
                  {task.notes || "Sin notas"}
                </p>
              </div>
            </>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isEditing ? (
              <>
                <FieldLabel label="Estado">
                  <select
                    value={task.status}
                    onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)}
                    className={controlClass}
                  >
                    {taskStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Depende de">
                  <select
                    value={task.parentTaskId ?? ""}
                    onChange={(event) =>
                      onPatch(task.id, { parentTaskId: event.target.value || null })
                    }
                    className={controlClass}
                  >
                    <option value="">Tarea raiz</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Hacer el">
                  <input
                    type="date"
                    value={task.hacerEl ?? ""}
                    onChange={(event) =>
                      onPatch(task.id, { hacerEl: event.target.value || null })
                    }
                    className={controlClass}
                  />
                </FieldLabel>

                <FieldLabel label="Vence el">
                  <input
                    type="date"
                    value={task.venceEl ?? ""}
                    onChange={(event) =>
                      onPatch(task.id, { venceEl: event.target.value || null })
                    }
                    className={controlClass}
                  />
                </FieldLabel>

                <FieldLabel label="Prioridad">
                  <select
                    value={task.priority}
                    onChange={(event) => onPriority(task.id, event.target.value as TaskPriority)}
                    className={controlClass}
                  >
                    {taskPriorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Fase">
                  <select
                    value={task.phaseId ?? ""}
                    onChange={(event) =>
                      onPatch(task.id, { phaseId: event.target.value || null })
                    }
                    className={controlClass}
                  >
                    <option value="">Directamente en el asunto</option>
                    {availablePhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {getSubjectPath(subjects, phase.subjectId)} · {phase.name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Asuntos">
                  <div className="grid min-h-24 gap-3 rounded-md border border-[#32415d] bg-[#0f1726] px-3 py-3">
                    <SubjectChips subjects={subjects} subjectIds={task.subjectIds} />
                    <button
                      type="button"
                      onClick={() => setIsSubjectPickerOpen(true)}
                      className="h-10 w-fit rounded-md border border-[#344562] px-3 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                    >
                      Añadir asuntos
                    </button>
                  </div>
                </FieldLabel>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Estado</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getStatusLabel(task.status)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Depende de</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {parentTask?.title ?? "Tarea raiz"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Hacer el</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {task.hacerEl ? formatDate(task.hacerEl) : "Sin fecha"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Vence el</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {task.venceEl ? formatDate(task.venceEl) : "Sin fecha"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Prioridad</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getPriorityLabel(task.priority)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Fase</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getPhaseLabel(phases, task.phaseId)}
                  </p>
                  {selectedPhase ? (
                    <p className="mt-1 text-xs text-[#91a0bb]">
                      {getSubjectPath(subjects, selectedPhase.subjectId)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Asuntos</p>
                  <div className="mt-2">
                    <SubjectChips subjects={subjects} subjectIds={task.subjectIds} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                handleClose();
              }}
              className="h-10 rounded-md border border-[#55352f] px-4 text-sm font-bold text-[#ff9d88] transition hover:border-[#7a3d32] hover:bg-[#2e1716] focus:outline-none focus:ring-2 focus:ring-[#ff9d88]/30"
            >
              Borrar
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
              >
                Guardar cambios
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <TaskSubjectPickerModal
        key={`${task.id}-${isSubjectPickerOpen ? task.subjectIds.join("|") : "closed"}`}
        isOpen={isSubjectPickerOpen}
        subjects={subjects}
        selectedSubjectIds={task.subjectIds}
        onApply={(subjectIds) => {
          onPatch(task.id, { subjectIds });
          setIsSubjectPickerOpen(false);
        }}
        onClose={() => setIsSubjectPickerOpen(false)}
      />
    </div>
  );
}

function TaskSubjectPickerModal({
  isOpen,
  subjects,
  selectedSubjectIds,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  subjects: Subject[];
  selectedSubjectIds: string[];
  onApply: (subjectIds: string[]) => void;
  onClose: () => void;
}) {
  const [draftSubjectIds, setDraftSubjectIds] = useState<string[]>(selectedSubjectIds);

  if (!isOpen) {
    return null;
  }

  const selectedIds = new Set(draftSubjectIds);
  const expandedSubjectIds = new Set(subjects.map((subject) => subject.id));
  const treeItems = getSubjectTreeItems(subjects, expandedSubjectIds);

  function toggleSubject(subjectId: string) {
    setDraftSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  function handleClose() {
    setDraftSubjectIds(selectedSubjectIds);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-subject-picker-title"
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Asuntos</p>
            <h3 id="task-subject-picker-title" className="mt-1 text-xl font-black text-[#eef4ff]">
              Añadir asuntos
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
          >
            x
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-3">
            {subjects.length === 0 ? (
              <TaskEmptyState label="Sin asuntos todavia." />
            ) : (
              <div className="space-y-1">
                {treeItems.map(({ subject, depth }) => (
                  <label
                    key={subject.id}
                    className="grid min-h-10 cursor-pointer grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-md border border-[#24344f] bg-[#0f1726] px-2 py-2 transition hover:border-[#3f5578] hover:bg-[#182238]"
                    style={{ marginLeft: depth ? `${Math.min(depth, 6) * 18}px` : undefined }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="h-4 w-4 accent-[#8ab4f8]"
                    />
                    <span className="truncate text-sm font-semibold text-[#eef4ff]">
                      {subject.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-3">
            <p className="text-[11px] font-bold uppercase text-[#8090ad]">Seleccionados</p>
            <div className="mt-2">
              <SubjectChips subjects={subjects} subjectIds={draftSubjectIds} />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onApply(draftSubjectIds)}
              className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
            >
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCreateModal({
  isOpen,
  subjects,
  phases,
  tasks,
  onAddTask,
  onClose,
  defaultSubjectIds = [],
}: {
  isOpen: boolean;
  subjects: Subject[];
  phases: SubjectPhase[];
  tasks: Task[];
  onAddTask: (draft: TaskDraft) => void;
  onClose: () => void;
  defaultSubjectIds?: string[];
}) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(defaultSubjectIds);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setSelectedSubjectIds(defaultSubjectIds);
    setSelectedPhaseId(null);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "");
    const notes = String(data.get("notes") ?? "");
    const parentTaskId = String(data.get("parentTaskId") ?? "");
    const hacerEl = String(data.get("hacerEl") ?? "");
    const venceEl = String(data.get("venceEl") ?? "");
    const priority = String(data.get("priority") ?? "normal") as TaskPriority;

    if (!title.trim()) {
      return;
    }

    onAddTask({
      title,
      notes,
      subjectIds: selectedSubjectIds,
      phaseId: selectedPhaseId,
      parentTaskId: parentTaskId || null,
      hacerEl: hacerEl || null,
      venceEl: venceEl || null,
      priority,
    });
    form.reset();
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-title"
    >
      <div className="w-full max-w-3xl rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Nueva tarea</p>
            <h3 id="new-task-title" className="mt-1 text-xl font-black text-[#eef4ff]">
              Crear tarea
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
          >
            x
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 p-4 sm:p-5"
        >
          <input
            name="title"
            placeholder="Titulo de la tarea"
            aria-label="Titulo de la nueva tarea"
            autoFocus
            className="h-12 min-w-0 rounded-lg border border-[#33435f] bg-[#0c1320] px-4 text-base font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#6d7b97] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Notas">
              <input
                name="notes"
                placeholder="Notas"
                aria-label="Notas de la nueva tarea"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Depende de">
              <select name="parentTaskId" aria-label="Tarea superior" className={controlClass}>
                <option value="">Tarea raiz</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Hacer el">
              <input
                type="date"
                name="hacerEl"
                aria-label="Hacer el"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Vence el">
              <input
                type="date"
                name="venceEl"
                aria-label="Vence el"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Prioridad">
              <select
                name="priority"
                defaultValue="normal"
                aria-label="Prioridad"
                className={controlClass}
              >
                {taskPriorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Fase">
              <select
                value={selectedPhaseId ?? ""}
                onChange={(event) => setSelectedPhaseId(event.target.value || null)}
                aria-label="Fase de la tarea"
                className={controlClass}
              >
                <option value="">Directamente en el asunto</option>
                {getTaskAvailablePhases(phases, selectedSubjectIds).map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {getSubjectPath(subjects, phase.subjectId)} · {phase.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Asuntos">
              <div className="grid min-h-24 gap-3 rounded-md border border-[#32415d] bg-[#0f1726] px-3 py-3">
                <SubjectChips subjects={subjects} subjectIds={selectedSubjectIds} />
                <button
                  type="button"
                  onClick={() => setIsSubjectPickerOpen(true)}
                  className="h-10 w-fit rounded-md border border-[#344562] px-3 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                >
                  Agregar asuntos
                </button>
              </div>
            </FieldLabel>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
            >
              Crear tarea
            </button>
          </div>
        </form>
      </div>
      <TaskSubjectPickerModal
        key={`new-task-${isSubjectPickerOpen ? selectedSubjectIds.join("|") : "closed"}`}
        isOpen={isSubjectPickerOpen}
        subjects={subjects}
        selectedSubjectIds={selectedSubjectIds}
        onApply={(subjectIds) => {
          setSelectedSubjectIds(subjectIds);
          const selectedPhase = phases.find((phase) => phase.id === selectedPhaseId);
          if (selectedPhase && !subjectIds.includes(selectedPhase.subjectId)) {
            setSelectedPhaseId(null);
          }
          setIsSubjectPickerOpen(false);
        }}
        onClose={() => setIsSubjectPickerOpen(false)}
      />
    </div>
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-subject-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Nuevo asunto</p>
            <h3 id="new-subject-title" className="mt-1 text-xl font-black text-[#eef4ff]">
              Crear asunto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-5">
          <input
            name="name"
            placeholder="Nombre del asunto"
            aria-label="Nombre del nuevo asunto"
            autoFocus
            className="h-12 min-w-0 rounded-lg border border-[#33435f] bg-[#0c1320] px-4 text-base font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#6d7b97] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Asunto superior">
              <select
                name="parentSubjectId"
                defaultValue={defaultParentSubjectId ?? ""}
                aria-label="Asunto superior"
                className={controlClass}
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
                className={controlClass}
              >
                {subjectHorizons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
            >
              Crear asunto
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-subject-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Editar asunto</p>
            <h3 id="edit-subject-title" className="mt-1 truncate text-xl font-black text-[#eef4ff]">
              {subject.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-5">
          <input
            name="name"
            defaultValue={subject.name}
            aria-label="Nombre del asunto"
            autoFocus
            className="h-12 min-w-0 rounded-lg border border-[#33435f] bg-[#0c1320] px-4 text-base font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#6d7b97] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Asunto superior">
              <select
                name="parentSubjectId"
                defaultValue={subject.parentSubjectId ?? ""}
                aria-label="Asunto superior"
                className={controlClass}
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
                className={controlClass}
              >
                {subjectHorizons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
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
              className="mr-auto h-10 rounded-md border border-[#55352f] px-4 text-sm font-bold text-[#ff9d88] transition hover:bg-[#2e1716] focus:outline-none focus:ring-2 focus:ring-[#ff9d88]/30"
            >
              Borrar asunto
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
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

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#050812]/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-form-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#4a412c] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#383526] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f6c177]">
              {phase ? "Editar fase" : "Nueva fase"}
            </p>
            <h3 id="phase-form-title" className="mt-1 truncate text-xl font-black text-[#eef4ff]">
              {subjectName}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#4a412c] text-lg font-black text-[#d5c69e] transition hover:bg-[#282116] focus:outline-none focus:ring-2 focus:ring-[#f6c177]/30"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 p-4 sm:p-5">
          <FieldLabel label="Nombre de la fase">
            <input
              name="name"
              defaultValue={phase?.name ?? ""}
              placeholder="Ej. Preparación"
              autoFocus
              required
              className={controlClass}
            />
          </FieldLabel>

          <div className="grid gap-4 rounded-xl border border-[#293852] bg-[#0d1422] p-4 md:grid-cols-2">
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8ab4f8]">Plan</p>
                <p className="mt-1 text-xs text-[#8090ad]">Las fechas que orientan el trabajo.</p>
              </div>
              <FieldLabel label="Inicio planificado">
                <input type="date" name="plannedStart" defaultValue={phase?.plannedStart ?? ""} className={controlClass} />
              </FieldLabel>
              <FieldLabel label="Finalización planificada">
                <input type="date" name="plannedEnd" defaultValue={phase?.plannedEnd ?? ""} className={controlClass} />
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
                <p className="mt-1 text-xs text-[#8090ad]">Lo que ocurrió en la práctica.</p>
              </div>
              <FieldLabel label="Inicio ejecutado">
                <input type="date" name="executedStart" defaultValue={phase?.executedStart ?? ""} className={controlClass} />
              </FieldLabel>
              <FieldLabel label="Finalización ejecutada">
                <input type="date" name="executedEnd" defaultValue={phase?.executedEnd ?? ""} className={controlClass} />
              </FieldLabel>
              {rangeError === "executed" ? (
                <p role="alert" className="text-xs font-bold text-[#ff9d88]">
                  La finalización ejecutada no puede ser anterior al inicio.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button type="button" onClick={handleClose} className="h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30">
              Cancelar
            </button>
            <button type="submit" className="h-10 rounded-md border border-[#f6c177] bg-[#f6c177] px-4 text-sm font-black text-[#1b1407] transition hover:bg-[#ffd797] focus:outline-none focus:ring-2 focus:ring-[#f6c177]/40">
              {phase ? "Guardar fase" : "Crear fase"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <section className="overflow-hidden rounded-xl border border-[#3c3928] bg-[#111a2b]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#383526] bg-[#151a25] px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f6c177]">Secuencia del asunto</p>
          <h4 className="mt-1 text-base font-black text-[#eef4ff]">Fases</h4>
        </div>
        <button type="button" onClick={openCreate} className="rounded-lg border border-[#66532f] bg-[#282116] px-3 py-2 text-sm font-black text-[#f6c177] transition hover:border-[#8c713d] hover:bg-[#332919] focus:outline-none focus:ring-2 focus:ring-[#f6c177]/30">
          Nueva fase
        </button>
      </div>

      {orderedPhases.length === 0 ? (
        <div className="m-4 rounded-lg border border-dashed border-[#544a31] bg-[#141720] px-5 py-8 text-center">
          <p className="text-sm font-bold text-[#d7c9a8]">Este asunto todavía no tiene fases.</p>
          <p className="mt-1 text-xs text-[#8f8a7b]">Crea la primera para separar el plan de lo que realmente se ejecutó.</p>
        </div>
      ) : (
        <ol className="relative grid gap-0 p-4 before:absolute before:bottom-8 before:left-[35px] before:top-8 before:w-px before:bg-[#66532f]">
          {orderedPhases.map((phase, index) => {
            const taskCount = tasks.filter((task) => task.phaseId === phase.id).length;

            return (
              <li key={phase.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-2">
                <div className="relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-[#8c713d] bg-[#282116] font-mono text-xs font-black text-[#f6c177]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <article className="rounded-xl border border-[#2f3e59] bg-[#0f1726] p-3 transition hover:border-[#4a4d45] sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h5 className="truncate text-base font-black text-[#eef4ff]">{phase.name}</h5>
                      <p className="mt-1 text-xs font-semibold text-[#91a0bb]">
                        {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => onMovePhase(phase.id, "up")} disabled={index === 0} aria-label={`Subir ${phase.name}`} className="h-8 rounded-md border border-[#344562] px-2 text-xs font-black text-[#b9c5dd] transition hover:bg-[#182238] disabled:cursor-not-allowed disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => onMovePhase(phase.id, "down")} disabled={index === orderedPhases.length - 1} aria-label={`Bajar ${phase.name}`} className="h-8 rounded-md border border-[#344562] px-2 text-xs font-black text-[#b9c5dd] transition hover:bg-[#182238] disabled:cursor-not-allowed disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => openEdit(phase)} className="h-8 rounded-md border border-[#344562] px-2.5 text-xs font-bold text-[#b9c5dd] transition hover:bg-[#182238]">Editar</button>
                      <button
                        type="button"
                        onClick={() => {
                          const message = taskCount
                            ? `Esta fase tiene ${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}. Las tareas quedarán directamente en el asunto. ¿Borrar la fase?`
                            : "¿Borrar esta fase?";
                          if (window.confirm(message)) onDeletePhase(phase.id);
                        }}
                        className="h-8 rounded-md border border-[#55352f] px-2.5 text-xs font-bold text-[#ff9d88] transition hover:bg-[#2e1716]"
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

function SubjectPanel({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onAddChildSubject,
}: {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string | null) => void;
  onAddChildSubject: (subjectId: string) => void;
}) {
  const [collapsedSubjectIds, setCollapsedSubjectIds] = useState<Set<string>>(() => new Set());
  const [subjectQuery, setSubjectQuery] = useState("");
  const visibleSubjects = useMemo(() => {
    const query = subjectQuery.trim().toLocaleLowerCase("es");

    if (!query) return subjects;

    const visibleIds = new Set<string>();
    for (const subject of subjects) {
      if (getSubjectPath(subjects, subject.id).toLocaleLowerCase("es").includes(query)) {
        visibleIds.add(subject.id);
        for (const ancestorId of getSubjectAncestorIds(subjects, subject.id)) {
          visibleIds.add(ancestorId);
        }
      }
    }

    return subjects.filter((subject) => visibleIds.has(subject.id));
  }, [subjectQuery, subjects]);

  function toggleSubject(subjectId: string) {
    setCollapsedSubjectIds((current) => {
      const next = new Set(current);

      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }

      return next;
    });
  }

  const expandedSubjectIds = useMemo(() => {
    const selectedAncestors = new Set(getSubjectAncestorIds(subjects, selectedSubjectId));

    return new Set(
      visibleSubjects
        .filter(
          (subject) =>
            Boolean(subjectQuery.trim()) ||
            !collapsedSubjectIds.has(subject.id) ||
            selectedAncestors.has(subject.id),
        )
        .map((subject) => subject.id),
    );
  }, [collapsedSubjectIds, selectedSubjectId, subjectQuery, subjects, visibleSubjects]);

  const treeItems = useMemo(
    () => getSubjectTreeItems(visibleSubjects, expandedSubjectIds),
    [expandedSubjectIds, visibleSubjects],
  );

  return (
    <aside>
      {subjects.length === 0 ? (
        <TaskEmptyState label="Todavía no hay asuntos." hint="Crea uno para agrupar tareas por contexto." />
      ) : (
        <div className="rounded-xl border border-[#263d5c] bg-[#091522] p-2">
          <label className="relative mb-2 block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#69809f]">⌕</span>
            <input
              value={subjectQuery}
              onChange={(event) => setSubjectQuery(event.target.value)}
              placeholder="Filtrar asuntos"
              aria-label="Filtrar asuntos"
              className="h-10 w-full rounded-lg border border-[#2b4261] bg-[#0d1a2a] pl-9 pr-3 text-sm font-semibold text-[#e7eef9] outline-none transition placeholder:text-[#637794] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15"
            />
          </label>
          <div className="hide-scrollbar max-h-[min(55vh,620px)] space-y-1 overflow-y-auto pr-0.5">
          {treeItems.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[#7f91ad]">No hay asuntos que coincidan.</p>
          ) : treeItems.map(({ subject, depth, hasChildren }) => {
            const isSelected = selectedSubjectId === subject.id;
            const isExpanded = expandedSubjectIds.has(subject.id);

            return (
              <div
                key={subject.id}
                className="relative"
                style={{ paddingLeft: depth ? `${Math.min(depth, 6) * 18}px` : undefined }}
              >
                {depth > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1 top-0 h-full w-px bg-[#253750]"
                  />
                ) : null}

                <div
                  className={`grid grid-cols-[28px_minmax(0,1fr)_32px] items-center gap-2 rounded-lg border p-2 transition ${
                    isSelected
                      ? "border-[#5588ce] bg-[#17345a]"
                      : "border-transparent bg-[#0d1a2a] hover:border-[#345171] hover:bg-[#14273d]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => (hasChildren ? toggleSubject(subject.id) : onSelectSubject(subject.id))}
                    aria-label={
                      hasChildren
                        ? isExpanded
                          ? `Cerrar ${subject.name}`
                          : `Abrir ${subject.name}`
                        : `Seleccionar ${subject.name}`
                    }
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30 ${
                      hasChildren
                        ? "border-[#314966] bg-[#102038] text-[#82afff] hover:bg-[#173050]"
                        : "border-transparent bg-transparent text-[#52617b]"
                    }`}
                  >
                    {hasChildren ? (isExpanded ? "v" : ">") : ""}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSubject(subject.id)}
                    className="min-w-0 truncate text-left text-sm font-semibold text-[#e8effa] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
                  >
                    {subject.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddChildSubject(subject.id)}
                    aria-label={`Agregar asunto dentro de ${subject.name}`}
                    title={`Agregar asunto dentro de ${subject.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#314966] bg-[#102038] text-sm font-black text-[#82afff] transition hover:bg-[#173050] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </aside>
  );
}

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
        {subjectHorizons.map((horizon) => {
          const horizonSubjects = subjectsByHorizon.get(horizon.value) ?? [];

          return (
            <section
              key={horizon.value}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, horizon.value)}
              className="rounded-lg border border-[#24344f] bg-[#0d1422] p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-xs font-black uppercase text-[#dce6f8]">
                  {horizon.label}
                </h4>
                <span className="rounded-full bg-[#22304a] px-2 py-0.5 text-xs font-bold text-[#b8c4dc]">
                  {horizonSubjects.length}
                </span>
              </div>

              <div className="flex min-h-24 flex-wrap gap-2">
                {horizonSubjects.length === 0 ? (
                  <div className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-[#344562] px-3 text-center text-sm text-[#8090ad]">
                    Arrastra asuntos aqui
                  </div>
                ) : (
                  horizonSubjects.map((subject) => {
                    const isSelected = selectedSubjectId === subject.id;

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        draggable
                        onClick={() => onSelectSubject(subject.id)}
                        onDragStart={(event) => {
                          setDraggingSubjectId(subject.id);
                          event.dataTransfer.setData("text/plain", subject.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggingSubjectId(null)}
                        className={`min-h-16 w-full rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30 sm:w-[calc(50%-0.25rem)] 2xl:w-[calc(33.333%-0.34rem)] ${
                          isSelected
                            ? "border-[#8ab4f8] bg-[#142a47]"
                            : "border-[#24344f] bg-[#101827] hover:border-[#3f5578] hover:bg-[#182238]"
                        }`}
                      >
                        <span className="block truncate text-sm font-semibold text-[#eef4ff]">
                          {subject.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[#8fa0bd]">
                          {getSubjectPath(subjects, subject.parentSubjectId)}
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

export default function TaskManager() {
  const workspace = useTaskWorkspace();
  const [activeView, setActiveView] = useState<ViewKey>("today");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectParentId, setNewSubjectParentId] = useState<string | null>(null);
  const [isSubjectEditModalOpen, setIsSubjectEditModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subjectViewMode, setSubjectViewMode] = useState<SubjectViewMode>("tree");
  const searchRef = useRef<HTMLInputElement>(null);

  const activeTasks = workspace.tasks.filter(isActiveTask);
  const selectedSubject = selectedSubjectId
    ? (workspace.subjects.find((subject) => subject.id === selectedSubjectId) ?? null)
    : null;
  const selectedTask = selectedTaskId
    ? (workspace.tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
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

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key.toLowerCase() === "n" && activeView !== "subjects") {
        event.preventDefault();
        setIsTaskModalOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeView]);

  const visibleTasks = useMemo(() => {
    if (activeView === "today") {
      return workspace.views.today;
    }

    if (activeView === "inbox") {
      return workspace.views.inbox;
    }

    if (activeView === "upcoming") {
      return workspace.views.upcoming;
    }

    if (activeView === "waiting") {
      return workspace.views.waiting;
    }

    if (activeView === "completed") {
      return workspace.views.completed;
    }

    if (selectedSubjectId) {
      return workspace.getTasksForSubject(selectedSubjectId);
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
    { key: "today", count: workspace.views.today.length },
    { key: "inbox", count: workspace.views.inbox.length },
    { key: "upcoming", count: workspace.views.upcoming.length },
    { key: "waiting", count: workspace.views.waiting.length },
    { key: "completed", count: workspace.views.completed.length },
    { key: "subjects", count: workspace.subjects.length },
  ];

  const heading = activeView === "subjects" ? viewLabels.subjects : viewLabels[activeView];
  const hasSearch = searchQuery.trim().length > 0;
  const emptyLabel =
    activeView === "subjects" && !selectedSubject
      ? "Elegi un asunto para ver sus tareas."
      : hasSearch
        ? "No hay coincidencias en esta vista."
        : "No hay tareas en esta vista.";
  const defaultTaskSubjectIds =
    activeView === "subjects" && selectedSubjectId ? [selectedSubjectId] : [];
  const totalTasks = activeTasks.length + workspace.views.completed.length;
  const completionRate = totalTasks
    ? Math.round((workspace.views.completed.length / totalTasks) * 100)
    : 0;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07111d] text-[#eaf1fb]">
      <div aria-hidden="true" className="app-grid pointer-events-none absolute inset-0" />
      {!workspace.isLoaded ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07111d]">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#82afff] font-mono font-black text-[#07111d]">E</span>
            <p className="mt-4 text-sm font-bold text-[#c8d5e8]">Abriendo tu espacio</p>
            <p className="mt-1 text-xs text-[#7185a3]">Sincronizando tareas y asuntos…</p>
          </div>
        </div>
      ) : null}
      <div className="relative grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)] lg:grid-rows-1">
        <nav aria-label="Vistas principales" className="min-w-0 max-w-full border-b border-[#20334d] bg-[#0b1624]/95 px-3 py-3 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#253a57] bg-[#0d1a2a] px-3 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.2)] lg:block lg:px-4 lg:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#82afff] font-mono text-sm font-black text-[#07111d] shadow-[0_8px_22px_rgba(130,175,255,0.25)]">E</span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#82afff]">Epixodo</p>
                <h1 className="truncate text-base font-black tracking-[-0.02em] text-[#f4f7fc] lg:text-lg">Mi espacio</h1>
              </div>
            </div>
            <div className="hidden lg:mt-5 lg:block">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-2xl font-black text-[#f4f7fc]">{activeTasks.length}</p>
                  <p className="text-xs font-semibold text-[#8192ad]">tareas activas</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#63d3a5]">{completionRate}% resuelto</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1b2c43]">
                <span className="block h-full rounded-full bg-[#63d3a5] transition-[width] duration-500" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-[#2f496c] bg-[#13233a] px-2.5 py-1 font-mono text-xs font-black text-[#bcd3f8] lg:hidden">{activeTasks.length}</span>
          </div>

          <div className="hide-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:mt-6 lg:grid lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {navItems.map((item) => {
              const isActive = activeView === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-left text-sm font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#82afff]/30 lg:grid lg:h-11 lg:w-full lg:grid-cols-[20px_minmax(0,1fr)_auto] lg:gap-3 ${
                    isActive
                      ? "border-[#3c68a5] bg-[#17345a] text-[#f2f6ff] shadow-[inset_0_0_0_1px_rgba(130,175,255,0.08)]"
                      : "border-[#20334d] bg-[#0d1a2a] text-[#9fb0c9] hover:border-[#365176] hover:bg-[#13233a] hover:text-[#eef4ff] lg:border-transparent lg:bg-transparent"
                  }`}
                >
                  <span className={isActive ? "text-[#82afff]" : "text-[#7185a3]"}><ViewIcon view={item.key} /></span>
                  <span className="truncate">{viewLabels[item.key]}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      isActive ? "bg-[#82afff] text-[#07111f]" : "bg-[#1d304a] text-[#aebbd0]"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto hidden rounded-2xl border border-[#243955] bg-[#0d1a2a] p-3 lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Atajos</p>
            <div className="mt-2 grid gap-2 text-xs text-[#91a3bc]">
              <div className="flex items-center justify-between"><span>Buscar</span><kbd className="rounded-md border border-[#334b6d] bg-[#142338] px-1.5 py-0.5 font-mono text-[#cad8ed]">/</kbd></div>
              <div className="flex items-center justify-between"><span>Nueva tarea</span><kbd className="rounded-md border border-[#334b6d] bg-[#142338] px-1.5 py-0.5 font-mono text-[#cad8ed]">N</kbd></div>
              <div className="flex items-center justify-between"><span>Cerrar</span><kbd className="rounded-md border border-[#334b6d] bg-[#142338] px-1.5 py-0.5 font-mono text-[#cad8ed]">Esc</kbd></div>
            </div>
          </div>
        </nav>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#20334d] bg-[#07111d]/88 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
              <label className="relative min-w-[220px] flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7890b2]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                </span>
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar en tu espacio…"
                  aria-label="Buscar tareas"
                  className="h-11 w-full rounded-xl border border-[#2b4261] bg-[#0d1a2a] pl-10 pr-14 text-sm font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#667b9a] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#334b6d] bg-[#142338] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#8295b0] sm:block">/</kbd>
              </label>
              <div className="flex items-center gap-2 text-xs font-bold text-[#9dabc6]">
                <span className="hidden rounded-full border border-[#2c4260] bg-[#0d1a2a] px-3 py-2 font-mono sm:inline-flex">
                  {workspace.today}
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${
                    workspace.syncError
                      ? "border-[#7a3d32] bg-[#2e1716] text-[#ff9d88]"
                      : workspace.isSaving
                        ? "border-[#315887] bg-[#132844] text-[#82afff]"
                        : "border-[#2d674f] bg-[#102b23] text-[#63d3a5]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${workspace.syncError ? "bg-[#ff9d88]" : workspace.isSaving ? "animate-pulse bg-[#82afff]" : "bg-[#63d3a5]"}`} />
                  {workspace.syncError
                    ? "Sin sincronizar"
                    : workspace.isSaving
                      ? "Sincronizando"
                      : "Sincronizado"}
                </span>
              </div>
            </div>
            {workspace.syncError ? (
              <p className="mt-2 text-xs font-semibold text-[#ff9d88]">
                {workspace.syncError}
              </p>
            ) : null}
          </header>

          <div className="mx-auto grid max-w-[1500px] gap-5 p-4 md:p-6 lg:p-8">
            <section key={activeView} className="view-enter min-w-0 space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#20334d] pb-5">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#82afff]">
                    {hasSearch ? `${filteredTasks.length} de ${visibleTasks.length} resultados` : `${visibleTasks.length} ${visibleTasks.length === 1 ? "tarea" : "tareas"}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black tracking-[-0.04em] text-[#f4f7fc] md:text-5xl">
                      {heading}
                    </h2>
                    {activeView === "subjects" ? (
                      <div className="grid grid-cols-2 rounded-xl border border-[#293f5e] bg-[#0d1a2a] p-1">
                        {[
                          { key: "tree" as const, label: "Arbol" },
                          { key: "horizon" as const, label: "Horizonte" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSubjectViewMode(item.key)}
                            className={`h-9 px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30 ${
                              subjectViewMode === item.key
                                ? "rounded-lg bg-[#82afff] text-[#07111f] shadow-[0_5px_16px_rgba(130,175,255,0.18)]"
                                : "rounded-lg text-[#aebbd0] hover:bg-[#16283f]"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
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
                  {activeView !== "subjects" ? (
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

              {activeView === "subjects" ? (
                <div
                  className={`grid gap-6 ${
                    subjectViewMode === "horizon"
                      ? "xl:grid-cols-[minmax(520px,1fr)_minmax(360px,520px)]"
                      : "xl:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]"
                  }`}
                >
                  <div className="rounded-2xl border border-[#293f5e] bg-[#0d1a2a] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.14)] xl:sticky xl:top-24 xl:self-start">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7185a3]">Contextos</p>
                        <h3 className="mt-1 text-base font-black text-[#e9f0fb]">Asuntos</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubjectParentId(null);
                          setIsSubjectModalOpen(true);
                        }}
                        className="rounded-xl border border-[#355174] bg-[#13233a] px-3 py-2 text-sm font-bold text-[#c6d4e9] transition hover:border-[#4b6b94] hover:bg-[#192d46] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
                      >
                        + Asunto
                      </button>
                    </div>
                    {subjectViewMode === "tree" ? (
                      <SubjectPanel
                        subjects={workspace.subjects}
                        selectedSubjectId={selectedSubjectId}
                        onSelectSubject={(subjectId) => {
                          setSelectedSubjectId(subjectId);
                          setActiveView("subjects");
                        }}
                        onAddChildSubject={(subjectId) => {
                          setNewSubjectParentId(subjectId);
                          setIsSubjectModalOpen(true);
                        }}
                      />
                    ) : (
                      <SubjectHorizonBoard
                        subjects={workspace.subjects}
                        selectedSubjectId={selectedSubjectId}
                        onSelectSubject={(subjectId) => {
                          setSelectedSubjectId(subjectId);
                          setActiveView("subjects");
                        }}
                        onSetSubjectHorizon={workspace.setSubjectHorizon}
                      />
                    )}
                  </div>

                  <div className="min-w-0 space-y-6">
                    {selectedSubject ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#315177] bg-[linear-gradient(135deg,#10233a,#0d1a2a)] px-4 py-4 shadow-[0_14px_35px_rgba(0,0,0,0.14)] sm:px-5">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#82afff]">
                              Asunto activo
                            </p>
                            <h3 className="mt-1 truncate text-xl font-black tracking-[-0.02em] text-[#f4f7fc]">
                              {getSubjectPath(workspace.subjects, selectedSubject.id)}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setIsSubjectEditModalOpen(true)}
                              className="rounded-xl border border-[#3a5578] px-4 py-2.5 text-sm font-bold text-[#c1cee2] transition hover:bg-[#182a42] focus:outline-none focus:ring-2 focus:ring-[#82afff]/30"
                            >
                              Editar asunto
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsTaskModalOpen(true)}
                              className="rounded-xl border border-[#82afff] bg-[#82afff] px-4 py-2.5 text-sm font-black text-[#07111f] transition hover:-translate-y-0.5 hover:bg-[#a8c7ff] focus:outline-none focus:ring-2 focus:ring-[#82afff]/40"
                            >
                              Nueva tarea
                            </button>
                          </div>
                        </div>
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
                    <div className="space-y-3">
                      {filteredTaskItems.length === 0 ? (
                        <TaskEmptyState label={emptyLabel} hint={selectedSubject ? "Crea una tarea para empezar a mover este asunto." : "Selecciona un asunto de la lista para ver su trabajo."} />
                      ) : (
                        filteredTaskItems.map(({ task, depth }) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            subjects={workspace.subjects}
                            phases={workspace.phases}
                            depth={depth}
                            today={workspace.today}
                            onStatus={workspace.setTaskStatus}
                            onOpen={setSelectedTaskId}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
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
                        onStatus={workspace.setTaskStatus}
                        onOpen={setSelectedTaskId}
                      />
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      <TaskCreateModal
        key={`create-task-${defaultTaskSubjectIds.join("|")}`}
        isOpen={isTaskModalOpen}
        subjects={workspace.subjects}
        phases={workspace.phases}
        tasks={workspace.tasks}
        onAddTask={workspace.addTask}
        onClose={() => setIsTaskModalOpen(false)}
        defaultSubjectIds={defaultTaskSubjectIds}
      />
      <TaskEditModal
        task={selectedTask}
        subjects={workspace.subjects}
        phases={workspace.phases}
        today={workspace.today}
        onPatch={workspace.patchTask}
        onStatus={workspace.setTaskStatus}
        onPriority={workspace.setTaskPriority}
        onDelete={workspace.deleteTask}
        onClose={() => setSelectedTaskId(null)}
        getAvailableParentTasksForTask={workspace.getAvailableParentTasksForTask}
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
