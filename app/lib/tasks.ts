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

export type Task = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  subjectIds: string[];
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
  parentTaskId?: string | null;
  hacerEl?: DateOnly | null;
  venceEl?: DateOnly | null;
  priority?: TaskPriority;
};

export type WorkspaceData = {
  tasks: Task[];
  subjects: Subject[];
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
    parentTaskId: draft.parentTaskId || null,
    hacerEl: draft.hacerEl || null,
    venceEl: draft.venceEl || null,
    priority: draft.priority ?? "normal",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: draft.status === "completed" ? timestamp : null,
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
