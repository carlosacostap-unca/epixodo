import { emptyWorkspace, type Project, type Task, type WorkspaceData } from "./tasks";

const STORAGE_KEY = "epixodo.personal-task-manager.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.notes === "string" &&
    typeof value.status === "string" &&
    ("projectId" in value ? typeof value.projectId === "string" || value.projectId === null : true) &&
    ("hacerEl" in value ? typeof value.hacerEl === "string" || value.hacerEl === null : true) &&
    ("venceEl" in value ? typeof value.venceEl === "string" || value.venceEl === null : true) &&
    typeof value.priority === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isProject(value: unknown): value is Project {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function parseWorkspace(raw: string | null): WorkspaceData {
  if (!raw) {
    return emptyWorkspace();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) {
      return emptyWorkspace();
    }

    const tasks = parsed.tasks.filter(isTask);
    const projects = parsed.projects.filter(isProject);

    return { tasks, projects };
  } catch {
    return emptyWorkspace();
  }
}

export function loadWorkspace(): WorkspaceData {
  if (typeof window === "undefined") {
    return emptyWorkspace();
  }

  return parseWorkspace(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorkspace(workspace: WorkspaceData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
