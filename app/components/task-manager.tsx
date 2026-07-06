"use client";

import { type DragEvent, FormEvent, useMemo, useState } from "react";
import { useTaskWorkspace } from "../hooks/use-task-workspace";
import {
  compareDateOnly,
  getHorizonLabel,
  getSubjectPath,
  isActiveTask,
  subjectHorizons,
  taskPriorities,
  taskStatuses,
  taskTreeItems,
  type Subject,
  type SubjectHorizon,
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

function taskMatchesQuery(task: Task, tasks: Task[], subjects: Subject[], query: string) {
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
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
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

function TaskEmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-[#344562] bg-[#101827] px-6 py-10 text-center text-sm text-[#98a7c3]">
      {label}
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
    neutral: "border-[#394962] bg-[#182238] text-[#b9c5dd]",
    warning: "border-[#6f5523] bg-[#2b2415] text-[#f6c177]",
    danger: "border-[#7a3d32] bg-[#2e1716] text-[#ff9d88]",
    info: "border-[#315887] bg-[#132844] text-[#8ab4f8]",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[tone]}`}>
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
    <label className="grid gap-1 text-[11px] font-bold uppercase text-[#8090ad]">
      {label}
      {children}
    </label>
  );
}

const controlClass =
  "h-10 w-full rounded-md border border-[#32415d] bg-[#0f1726] px-3 text-sm font-normal normal-case text-[#dce6f8] outline-none transition placeholder:text-[#61708d] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20";

function SubjectChips({ subjects, subjectIds }: { subjects: Subject[]; subjectIds: string[] }) {
  const labels = subjectLabels(subjects, subjectIds);

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-[#30486a] bg-[#14243c] px-2 py-0.5 text-[11px] font-bold text-[#9fc5ff]"
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
  depth,
  today,
  onStatus,
  onOpen,
}: {
  task: Task;
  subjects: Subject[];
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

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task.id);
        }
      }}
      className="group grid w-full gap-3 rounded-lg border border-[#293852] bg-[#172033] p-3 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[#3f5578] hover:bg-[#1b2740] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30 sm:grid-cols-[4px_auto_minmax(0,1fr)] sm:p-4"
      style={{ marginLeft: depth ? `${Math.min(depth, 4) * 18}px` : undefined }}
    >
      <div
        className={`hidden rounded-full sm:block ${
          isCompleted ? "bg-[#45546d]" : depth > 0 ? "bg-[#f6c177]" : "bg-[#8ab4f8]"
        }`}
      />
      <label className="flex h-8 w-8 items-center justify-center rounded-md border border-[#344562] bg-[#101827] sm:mt-1">
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

      <div className="min-w-0 space-y-3">
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
        {task.notes ? (
          <p className="line-clamp-1 text-sm text-[#9aa8c3]">{task.notes}</p>
        ) : null}
      </div>
    </article>
  );
}

function TaskEditModal({
  task,
  subjects,
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
  tasks,
  onAddTask,
  onClose,
  defaultSubjectIds = [],
}: {
  isOpen: boolean;
  subjects: Subject[];
  tasks: Task[];
  onAddTask: (draft: TaskDraft) => void;
  onClose: () => void;
  defaultSubjectIds?: string[];
}) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(defaultSubjectIds);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setSelectedSubjectIds(defaultSubjectIds);
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
  onClose,
}: {
  isOpen: boolean;
  subject: Subject | null;
  subjects: Subject[];
  parentSubjects: Subject[];
  onRenameSubject: (subjectId: string, name: string) => void;
  onSetSubjectHorizon: (subjectId: string, horizon: SubjectHorizon) => void;
  onSetSubjectParent: (subjectId: string, parentSubjectId: string | null) => void;
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
      subjects
        .filter(
          (subject) =>
            !collapsedSubjectIds.has(subject.id) || selectedAncestors.has(subject.id),
        )
        .map((subject) => subject.id),
    );
  }, [collapsedSubjectIds, selectedSubjectId, subjects]);

  const treeItems = useMemo(
    () => getSubjectTreeItems(subjects, expandedSubjectIds),
    [expandedSubjectIds, subjects],
  );

  return (
    <aside>
      {subjects.length === 0 ? (
        <TaskEmptyState label="Sin asuntos todavia." />
      ) : (
        <div className="space-y-1 rounded-lg border border-[#22314a] bg-[#0d1422] p-2">
          {treeItems.map(({ subject, depth, hasChildren }) => {
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
                      ? "border-[#8ab4f8] bg-[#142a47]"
                      : "border-[#24344f] bg-[#101827] hover:border-[#3f5578] hover:bg-[#182238]"
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
                        ? "border-[#31415e] bg-[#111a2b] text-[#8ab4f8] hover:bg-[#173050]"
                        : "border-transparent bg-transparent text-[#52617b]"
                    }`}
                  >
                    {hasChildren ? (isExpanded ? "v" : ">") : ""}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSubject(subject.id)}
                    className="min-w-0 truncate text-left font-semibold text-[#eef4ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                  >
                    {subject.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddChildSubject(subject.id)}
                    aria-label={`Agregar asunto dentro de ${subject.name}`}
                    title={`Agregar asunto dentro de ${subject.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[#31415e] bg-[#111a2b] text-sm font-black text-[#8ab4f8] transition hover:bg-[#173050] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
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

  const activeTasks = workspace.tasks.filter(isActiveTask);
  const selectedSubject = selectedSubjectId
    ? (workspace.subjects.find((subject) => subject.id === selectedSubjectId) ?? null)
    : null;
  const selectedTask = selectedTaskId
    ? (workspace.tasks.find((task) => task.id === selectedTaskId) ?? null)
    : null;

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
        taskMatchesQuery(task, workspace.tasks, workspace.subjects, searchQuery),
      ),
    [searchQuery, visibleTasks, workspace.tasks, workspace.subjects],
  );
  const filteredTaskItems = useMemo(() => taskTreeItems(filteredTasks), [filteredTasks]);

  const navItems = [
    { key: "today" as const, count: workspace.views.today.length },
    { key: "inbox" as const, count: workspace.views.inbox.length },
    { key: "upcoming" as const, count: workspace.views.upcoming.length },
    { key: "waiting" as const, count: workspace.views.waiting.length },
    { key: "completed" as const, count: workspace.views.completed.length },
    { key: "subjects" as const, count: workspace.subjects.length },
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

  return (
    <main className="min-h-screen bg-[#0b1018] text-[#e8eefc]">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav className="border-b border-[#24324b] bg-[#111827] px-4 py-4 lg:border-b-0 lg:border-r lg:px-5">
          <div className="mb-6 rounded-xl border border-[#26344d] bg-[#0d1422] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
            <p className="font-mono text-xs font-bold uppercase text-[#8ab4f8]">Epixodo</p>
            <h1 className="mt-2 text-2xl font-black text-[#eef4ff]">Tareas personales</h1>
            <p className="mt-3 text-sm leading-6 text-[#9dabc6]">
              {activeTasks.length} activas / {workspace.views.completed.length} completadas
            </p>
          </div>

          <div className="grid gap-1.5">
            {navItems.map((item) => {
              const isActive = activeView === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`grid h-11 grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-0 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30 ${
                    isActive
                      ? "border-[#2f5f9a] bg-[#142a47] text-[#eaf2ff]"
                      : "border-transparent bg-transparent text-[#a8b5ce] hover:border-[#293852] hover:bg-[#182238] hover:text-[#eef4ff]"
                  }`}
                >
                  <span
                    className={`h-7 rounded-full ${isActive ? "bg-[#8ab4f8]" : "bg-transparent"}`}
                  />
                  <span className="truncate">{viewLabels[item.key]}</span>
                  <span
                    className={`mr-3 rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-[#8ab4f8] text-[#07111f]" : "bg-[#22304a] text-[#b8c4dc]"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#24324b] bg-[#0b1018]/92 px-4 py-3 backdrop-blur md:px-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <label className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#8ab4f8]">
                  /
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar tareas, notas o asuntos"
                  aria-label="Buscar tareas"
                  className="h-12 w-full rounded-xl border border-[#30405d] bg-[#111a2b] pl-10 pr-4 text-sm font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#73809a] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#9dabc6] xl:justify-end">
                <span className="rounded-full border border-[#31415e] bg-[#111a2b] px-3 py-2 font-mono">
                  {workspace.today}
                </span>
                <span
                  className={`rounded-full border px-3 py-2 ${
                    workspace.syncError
                      ? "border-[#7a3d32] bg-[#2e1716] text-[#ff9d88]"
                      : workspace.isSaving
                        ? "border-[#315887] bg-[#132844] text-[#8ab4f8]"
                        : "border-[#2e5c44] bg-[#14291f] text-[#8fd0a8]"
                  }`}
                >
                  {workspace.syncError
                    ? "PocketBase sin sincronizar"
                    : workspace.isSaving
                      ? "Sincronizando"
                      : "PocketBase conectado"}
                </span>
              </div>
            </div>
            {workspace.syncError ? (
              <p className="mt-2 text-xs font-semibold text-[#ff9d88]">
                {workspace.syncError}
              </p>
            ) : null}
          </header>

          <div
            className="grid gap-5 p-4 md:p-6"
          >
            <section className="min-w-0 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#24324b] pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#91a0bb]">
                    {hasSearch ? `${filteredTasks.length} de ${visibleTasks.length}` : `${visibleTasks.length} tareas`}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black text-[#eef4ff] md:text-4xl">
                      {heading}
                    </h2>
                    {activeView === "subjects" ? (
                      <div className="grid grid-cols-2 rounded-lg border border-[#263852] bg-[#0d1422] p-1">
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
                                ? "rounded-md bg-[#8ab4f8] text-[#07111f]"
                                : "rounded-md text-[#b9c5dd] hover:bg-[#182238]"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasSearch ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="rounded-lg border border-[#31415e] px-3 py-2 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                    >
                      Limpiar busqueda
                    </button>
                  ) : null}
                  {activeView !== "subjects" ? (
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(true)}
                      className="rounded-lg border border-[#8ab4f8] bg-[#8ab4f8] px-4 py-2 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
                    >
                      Nueva tarea
                    </button>
                  ) : null}
                </div>
              </div>

              {activeView === "subjects" ? (
                <div
                  className={`grid gap-5 ${
                    subjectViewMode === "horizon"
                      ? "xl:grid-cols-[minmax(520px,1fr)_minmax(360px,520px)]"
                      : "xl:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]"
                  }`}
                >
                  <div className="rounded-xl border border-[#2b3a55] bg-[#111a2b] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black uppercase text-[#dce6f8]">Asuntos</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubjectParentId(null);
                          setIsSubjectModalOpen(true);
                        }}
                        className="rounded-lg border border-[#344562] px-3 py-2 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                      >
                        Nuevo asunto
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

                  <div className="min-w-0 space-y-5">
                    {selectedSubject ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#24344f] bg-[#111a2b] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase text-[#8ab4f8]">
                            Tareas del asunto
                          </p>
                          <h3 className="mt-1 truncate text-lg font-black text-[#eef4ff]">
                            {getSubjectPath(workspace.subjects, selectedSubject.id)}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setIsSubjectEditModalOpen(true)}
                            className="rounded-lg border border-[#344562] px-4 py-2 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30"
                          >
                            Editar asunto
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsTaskModalOpen(true)}
                            className="rounded-lg border border-[#8ab4f8] bg-[#8ab4f8] px-4 py-2 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40"
                          >
                            Nueva tarea
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      {filteredTaskItems.length === 0 ? (
                        <TaskEmptyState label={emptyLabel} />
                      ) : (
                        filteredTaskItems.map(({ task, depth }) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            subjects={workspace.subjects}
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
                <div className="space-y-2">
                  {filteredTaskItems.length === 0 ? (
                    <TaskEmptyState label={emptyLabel} />
                  ) : (
                    filteredTaskItems.map(({ task, depth }) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        subjects={workspace.subjects}
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
        tasks={workspace.tasks}
        onAddTask={workspace.addTask}
        onClose={() => setIsTaskModalOpen(false)}
        defaultSubjectIds={defaultTaskSubjectIds}
      />
      <TaskEditModal
        task={selectedTask}
        subjects={workspace.subjects}
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
        onClose={() => setIsSubjectEditModalOpen(false)}
      />
    </main>
  );
}
