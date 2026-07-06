export type DateOnly = string;

export type TaskStatus = "pending" | "in_progress" | "waiting" | "completed";

export type TaskPriority = "low" | "normal" | "high";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  projectId: string | null;
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
  projectId?: string | null;
  hacerEl?: DateOnly | null;
  venceEl?: DateOnly | null;
  priority?: TaskPriority;
};

export type WorkspaceData = {
  tasks: Task[];
  projects: Project[];
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

export function emptyWorkspace(): WorkspaceData {
  return {
    tasks: [],
    projects: [],
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

export function normalizeTaskDraft(draft: TaskDraft, now = new Date()): Task {
  const timestamp = now.toISOString();

  return {
    id: createId("task"),
    title: draft.title.trim(),
    notes: draft.notes?.trim() ?? "",
    status: draft.status ?? "pending",
    projectId: draft.projectId || null,
    hacerEl: draft.hacerEl || null,
    venceEl: draft.venceEl || null,
    priority: draft.priority ?? "normal",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: draft.status === "completed" ? timestamp : null,
  };
}

export function createProject(name: string, now = new Date()): Project {
  const timestamp = now.toISOString();

  return {
    id: createId("project"),
    name: name.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
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
        isActiveTask(task) && !task.projectId && !task.hacerEl && !task.venceEl,
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

export function getProjectTasks(tasks: Task[], projectId: string): Task[] {
  return sortedTasks(
    tasks.filter((task) => isActiveTask(task) && task.projectId === projectId),
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
