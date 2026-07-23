export type DateOnly = string;

export type TaskStatus = "pending" | "in_progress" | "waiting" | "completed";

export type TaskPriority = "low" | "normal" | "high";

export type SubjectHorizon = "short" | "medium" | "long" | "none";

export type Subject = {
  id: string;
  name: string;
  parentSubjectId: string | null;
  horizon: SubjectHorizon;
  createdAt: string;
  updatedAt: string;
};

export type SubjectPhase = {
  id: string;
  subjectId: string;
  name: string;
  plannedStart: DateOnly | null;
  executedStart: DateOnly | null;
  plannedEnd: DateOnly | null;
  executedEnd: DateOnly | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type SubjectPhaseDraft = Pick<SubjectPhase, "name"> &
  Partial<
    Pick<SubjectPhase, "plannedStart" | "executedStart" | "plannedEnd" | "executedEnd">
  >;

export type SubjectEventKind = "milestone" | "deadline";

export type SubjectEvent = {
  id: string;
  subjectId: string;
  phaseId: string | null;
  kind: SubjectEventKind;
  description: string;
  date: DateOnly;
  createdAt: string;
  updatedAt: string;
};

export type SubjectEventDraft = Pick<SubjectEvent, "kind" | "description" | "date"> & {
  phaseId?: string | null;
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  subjectIds: string[];
  phaseId: string | null;
  parentTaskId: string | null;
  hacerEl: DateOnly | null;
  venceEl: DateOnly | null;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type TaskDraft = {
  title: string;
  notes?: string;
  status?: TaskStatus;
  subjectIds?: string[];
  phaseId?: string | null;
  parentTaskId?: string | null;
  hacerEl?: DateOnly | null;
  venceEl?: DateOnly | null;
  priority?: TaskPriority;
};

export type WorkspaceData = {
  tasks: Task[];
  subjects: Subject[];
  phases: SubjectPhase[];
  subjectEvents: SubjectEvent[];
};

export type TaskTreeItem = {
  task: Task;
  depth: number;
};

export const taskStatuses: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En curso" },
  { value: "waiting", label: "Esperando" },
  { value: "completed", label: "Completada" },
];

export const taskPriorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
];

export const subjectHorizons: { value: SubjectHorizon; label: string }[] = [
  { value: "short", label: "Corto plazo" },
  { value: "medium", label: "Mediano plazo" },
  { value: "long", label: "Largo plazo" },
  { value: "none", label: "Sin plazo" },
];

export function emptyWorkspace(): WorkspaceData {
  return {
    tasks: [],
    subjects: [],
    phases: [],
    subjectEvents: [],
  };
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}-${random}`;
}

export function getTodayDateOnly(date = new Date()): DateOnly {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function compareDateOnly(a: DateOnly, b: DateOnly): number {
  return a.localeCompare(b);
}

export function isValidDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isSubjectEventKind(value: unknown): value is SubjectEventKind {
  return value === "milestone" || value === "deadline";
}

export function isValidSubjectEventDraft(draft: SubjectEventDraft): boolean {
  return (
    isSubjectEventKind(draft.kind) &&
    Boolean(draft.description.trim()) &&
    isValidDateOnly(draft.date) &&
    (draft.phaseId === undefined || draft.phaseId === null || typeof draft.phaseId === "string")
  );
}

export function isFutureDate(date: DateOnly | null, today = getTodayDateOnly()) {
  return Boolean(date && compareDateOnly(date, today) > 0);
}

export function isTodayDate(date: DateOnly | null, today = getTodayDateOnly()) {
  return date === today;
}

export function isActiveTask(task: Task): boolean {
  return task.status !== "completed";
}

export function uniqueIds(ids: string[] | undefined): string[] {
  return Array.from(new Set((ids ?? []).filter(Boolean)));
}

export function normalizeTaskDraft(draft: TaskDraft, now = new Date()): Task {
  const timestamp = now.toISOString();

  return {
    id: createId("task"),
    title: draft.title.trim(),
    notes: draft.notes?.trim() ?? "",
    status: draft.status ?? "pending",
    subjectIds: uniqueIds(draft.subjectIds),
    phaseId: draft.phaseId || null,
    parentTaskId: draft.parentTaskId || null,
    hacerEl: draft.hacerEl || null,
    venceEl: draft.venceEl || null,
    priority: draft.priority ?? "normal",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: draft.status === "completed" ? timestamp : null,
  };
}

export function createSubjectPhase(
  subjectId: string,
  draft: SubjectPhaseDraft,
  order: number,
  now = new Date(),
): SubjectPhase {
  const timestamp = now.toISOString();

  return {
    id: createId("phase"),
    subjectId,
    name: draft.name.trim(),
    plannedStart: draft.plannedStart || null,
    executedStart: draft.executedStart || null,
    plannedEnd: draft.plannedEnd || null,
    executedEnd: draft.executedEnd || null,
    order,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createSubjectEvent(
  subjectId: string,
  draft: SubjectEventDraft,
  now = new Date(),
): SubjectEvent {
  const timestamp = now.toISOString();

  return {
    id: createId("event"),
    subjectId,
    phaseId: draft.phaseId || null,
    kind: draft.kind,
    description: draft.description.trim(),
    date: draft.date,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchSubjectEvent(
  event: SubjectEvent,
  patch: Partial<SubjectEventDraft>,
  now = new Date(),
): SubjectEvent | null {
  const updated: SubjectEvent = {
    ...event,
    ...patch,
    phaseId: patch.phaseId === undefined ? event.phaseId : patch.phaseId,
    description: patch.description?.trim() ?? event.description,
    updatedAt: now.toISOString(),
  };

  return isValidSubjectEventDraft(updated) ? updated : null;
}

export function sortedSubjectEvents(
  events: SubjectEvent[],
  subjectId?: string,
): SubjectEvent[] {
  return events
    .filter((event) => !subjectId || event.subjectId === subjectId)
    .sort(
      (a, b) =>
        compareDateOnly(a.date, b.date) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
}

export function removeSubjectEventFromWorkspace(
  workspace: WorkspaceData,
  eventId: string,
): WorkspaceData {
  return {
    ...workspace,
    subjectEvents: (workspace.subjectEvents ?? []).filter((event) => event.id !== eventId),
  };
}

export type PhaseDateRangeError = "planned" | "executed" | null;

export function getPhaseDateRangeError(
  phase: Pick<
    SubjectPhaseDraft,
    "plannedStart" | "plannedEnd" | "executedStart" | "executedEnd"
  >,
): PhaseDateRangeError {
  if (
    phase.plannedStart &&
    phase.plannedEnd &&
    compareDateOnly(phase.plannedEnd, phase.plannedStart) < 0
  ) {
    return "planned";
  }

  if (
    phase.executedStart &&
    phase.executedEnd &&
    compareDateOnly(phase.executedEnd, phase.executedStart) < 0
  ) {
    return "executed";
  }

  return null;
}

export function sortedSubjectPhases(
  phases: SubjectPhase[],
  subjectId?: string,
): SubjectPhase[] {
  return phases
    .filter((phase) => !subjectId || phase.subjectId === subjectId)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function normalizePhaseOrder(phases: SubjectPhase[]): SubjectPhase[] {
  const subjectIds = Array.from(new Set(phases.map((phase) => phase.subjectId)));

  return subjectIds.flatMap((subjectId) =>
    sortedSubjectPhases(phases, subjectId).map((phase, order) => ({ ...phase, order })),
  );
}

export function reorderSubjectPhases(
  phases: SubjectPhase[],
  subjectId: string,
  orderedPhaseIds: string[],
): SubjectPhase[] {
  const current = sortedSubjectPhases(phases, subjectId);
  const byId = new Map(current.map((phase) => [phase.id, phase]));
  const requested = uniqueIds(orderedPhaseIds)
    .map((id) => byId.get(id))
    .filter((phase): phase is SubjectPhase => Boolean(phase));
  const requestedIds = new Set(requested.map((phase) => phase.id));
  const ordered = [...requested, ...current.filter((phase) => !requestedIds.has(phase.id))];
  const orderById = new Map(ordered.map((phase, order) => [phase.id, order]));

  return phases.map((phase) =>
    phase.subjectId === subjectId
      ? { ...phase, order: orderById.get(phase.id) ?? phase.order }
      : phase,
  );
}

export function getTaskAvailablePhases(
  phases: SubjectPhase[],
  subjectIds: string[],
): SubjectPhase[] {
  const selectedSubjectIds = new Set(subjectIds);
  return sortedSubjectPhases(phases).filter((phase) => selectedSubjectIds.has(phase.subjectId));
}

export function isTaskPhaseCompatible(
  phases: SubjectPhase[],
  subjectIds: string[],
  phaseId: string | null | undefined,
): boolean {
  if (!phaseId) {
    return true;
  }

  const phase = phases.find((item) => item.id === phaseId);
  return Boolean(phase && subjectIds.includes(phase.subjectId));
}

export function normalizeTaskPhaseAssignment(
  phases: SubjectPhase[],
  subjectIds: string[] | undefined,
  phaseId: string | null | undefined,
): { subjectIds: string[]; phaseId: string | null } {
  const nextSubjectIds = uniqueIds(subjectIds);

  if (!phaseId) {
    return { subjectIds: nextSubjectIds, phaseId: null };
  }

  const phase = phases.find((item) => item.id === phaseId);

  if (!phase) {
    return { subjectIds: nextSubjectIds, phaseId: null };
  }

  return {
    subjectIds: uniqueIds([...nextSubjectIds, phase.subjectId]),
    phaseId: phase.id,
  };
}

export function removePhaseFromWorkspace(
  workspace: WorkspaceData,
  phaseId: string,
  updatedAt = new Date().toISOString(),
): WorkspaceData {
  const deleted = workspace.phases.find((phase) => phase.id === phaseId);
  const remaining = workspace.phases.filter((phase) => phase.id !== phaseId);
  const phases = deleted
    ? reorderSubjectPhases(
        remaining,
        deleted.subjectId,
        sortedSubjectPhases(remaining, deleted.subjectId).map((phase) => phase.id),
      )
    : remaining;

  return {
    ...workspace,
    phases,
    tasks: workspace.tasks.map((task) =>
      task.phaseId === phaseId ? { ...task, phaseId: null, updatedAt } : task,
    ),
    subjectEvents: (workspace.subjectEvents ?? []).map((event) =>
      event.phaseId === phaseId ? { ...event, phaseId: null, updatedAt } : event,
    ),
  };
}

export function removeSubjectFromWorkspace(
  workspace: WorkspaceData,
  subjectId: string,
  updatedAt = new Date().toISOString(),
): WorkspaceData {
  const deletedSubjectIds = new Set([
    subjectId,
    ...getSubjectDescendantIds(workspace.subjects, subjectId),
  ]);
  const deletedPhaseIds = new Set(
    workspace.phases
      .filter((phase) => deletedSubjectIds.has(phase.subjectId))
      .map((phase) => phase.id),
  );

  return {
    ...workspace,
    subjects: workspace.subjects.filter((subject) => !deletedSubjectIds.has(subject.id)),
    phases: workspace.phases.filter((phase) => !deletedPhaseIds.has(phase.id)),
    subjectEvents: (workspace.subjectEvents ?? []).filter(
      (event) => !deletedSubjectIds.has(event.subjectId),
    ),
    tasks: workspace.tasks.map((task) => ({
      ...task,
      subjectIds: task.subjectIds.filter((id) => !deletedSubjectIds.has(id)),
      phaseId: task.phaseId && deletedPhaseIds.has(task.phaseId) ? null : task.phaseId,
      updatedAt,
    })),
  };
}

export function createSubject(
  name: string,
  horizon: SubjectHorizon = "none",
  parentSubjectId: string | null = null,
  now = new Date(),
): Subject {
  const timestamp = now.toISOString();

  return {
    id: createId("subject"),
    name: name.trim(),
    parentSubjectId: parentSubjectId || null,
    horizon,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getHorizonLabel(horizon: SubjectHorizon) {
  return subjectHorizons.find((item) => item.value === horizon)?.label ?? "Sin plazo";
}

export function getSubjectDescendantIds(subjects: Subject[], subjectId: string): string[] {
  const descendants: string[] = [];
  const queue = [subjectId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = subjects.filter((subject) => subject.parentSubjectId === currentId);

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

export function getSubjectAndDescendantIds(subjects: Subject[], subjectId: string): string[] {
  return [subjectId, ...getSubjectDescendantIds(subjects, subjectId)];
}

export function getSubjectPath(subjects: Subject[], subjectId: string | null): string {
  if (!subjectId) {
    return "Sin asunto";
  }

  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  const path: string[] = [];
  let current = byId.get(subjectId);

  while (current) {
    path.unshift(current.name);
    current = current.parentSubjectId ? byId.get(current.parentSubjectId) : undefined;
  }

  return path.length > 0 ? path.join(" / ") : "Asunto";
}

export function getTaskDescendantIds(tasks: Task[], taskId: string): string[] {
  const descendants: string[] = [];
  const queue = [taskId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = tasks.filter((task) => task.parentTaskId === currentId);

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

export function getAvailableParentTasks(tasks: Task[], taskId: string): Task[] {
  const excludedIds = new Set([taskId, ...getTaskDescendantIds(tasks, taskId)]);

  return sortedTasks(tasks.filter((task) => !excludedIds.has(task.id)));
}

export function sortedTasks(tasks: Task[]): Task[] {
  const priorityWeight: Record<TaskPriority, number> = {
    high: 0,
    normal: 1,
    low: 2,
  };

  return [...tasks].sort((a, b) => {
    const dateA = a.hacerEl ?? a.venceEl ?? "9999-12-31";
    const dateB = b.hacerEl ?? b.venceEl ?? "9999-12-31";
    const dateCompare = compareDateOnly(dateA, dateB);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const priorityCompare = priorityWeight[a.priority] - priorityWeight[b.priority];

    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function taskTreeItems(tasks: Task[]): TaskTreeItem[] {
  const visibleIds = new Set(tasks.map((task) => task.id));
  const childrenByParent = new Map<string, Task[]>();

  for (const task of tasks) {
    if (task.parentTaskId && visibleIds.has(task.parentTaskId)) {
      const siblings = childrenByParent.get(task.parentTaskId) ?? [];
      siblings.push(task);
      childrenByParent.set(task.parentTaskId, siblings);
    }
  }

  const roots = sortedTasks(
    tasks.filter((task) => !task.parentTaskId || !visibleIds.has(task.parentTaskId)),
  );
  const items: TaskTreeItem[] = [];

  function walk(task: Task, depth: number) {
    items.push({ task, depth });

    for (const child of sortedTasks(childrenByParent.get(task.id) ?? [])) {
      walk(child, depth + 1);
    }
  }

  for (const root of roots) {
    walk(root, 0);
  }

  return items;
}

export function getTodayTasks(tasks: Task[], today = getTodayDateOnly()): Task[] {
  return sortedTasks(
    tasks.filter(
      (task) =>
        isActiveTask(task) &&
        (isTodayDate(task.hacerEl, today) || isTodayDate(task.venceEl, today)),
    ),
  );
}

export function getInboxTasks(tasks: Task[]): Task[] {
  return sortedTasks(
    tasks.filter(
      (task) =>
        isActiveTask(task) &&
        task.subjectIds.length === 0 &&
        !task.parentTaskId &&
        !task.hacerEl &&
        !task.venceEl,
    ),
  );
}

export function getUpcomingTasks(
  tasks: Task[],
  today = getTodayDateOnly(),
): Task[] {
  return sortedTasks(
    tasks.filter(
      (task) =>
        isActiveTask(task) &&
        (isFutureDate(task.hacerEl, today) || isFutureDate(task.venceEl, today)),
    ),
  );
}

export function getWaitingTasks(tasks: Task[]): Task[] {
  return sortedTasks(tasks.filter((task) => task.status === "waiting"));
}

export function getCompletedTasks(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((task) => task.status === "completed")
    .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt));
}

export function getSubjectTasks(
  tasks: Task[],
  subjects: Subject[],
  subjectId: string,
): Task[] {
  const subjectIds = new Set(getSubjectAndDescendantIds(subjects, subjectId));

  return sortedTasks(
    tasks.filter(
      (task) => isActiveTask(task) && task.subjectIds.some((id) => subjectIds.has(id)),
    ),
  );
}

export function getUnplannedDeadlineTasks(
  tasks: Task[],
  today = getTodayDateOnly(),
): Task[] {
  return sortedTasks(
    tasks.filter(
      (task) =>
        isActiveTask(task) &&
        !task.hacerEl &&
        Boolean(task.venceEl) &&
        compareDateOnly(task.venceEl as DateOnly, today) >= 0,
    ),
  );
}

export function updateTaskStatus(task: Task, status: TaskStatus): Task {
  const timestamp = new Date().toISOString();

  return {
    ...task,
    status,
    updatedAt: timestamp,
    completedAt: status === "completed" ? timestamp : null,
  };
}
