import type { WorkspaceData } from "./tasks";
import { parseWorkspaceJson } from "./workspace-codec";

const STORAGE_KEY = "epixodo.personal-task-manager.v1";

export function loadWorkspace(): WorkspaceData {
  if (typeof window === "undefined") {
    return { tasks: [], subjects: [], phases: [], subjectEvents: [] };
  }

  return parseWorkspaceJson(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorkspace(workspace: WorkspaceData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tasks: workspace.tasks,
      subjects: workspace.subjects,
      phases: workspace.phases,
      subjectEvents: workspace.subjectEvents,
    }),
  );
}

async function requestWorkspace(method: "GET" | "PUT", workspace?: WorkspaceData) {
  const response = await fetch("/api/workspace", {
    method,
    headers: workspace ? { "Content-Type": "application/json" } : undefined,
    body: workspace ? JSON.stringify(workspace) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : "No se pudo sincronizar con PocketBase.",
    );
  }

  return (await response.json()) as WorkspaceData;
}

export function loadRemoteWorkspace() {
  return requestWorkspace("GET");
}

export function saveRemoteWorkspace(workspace: WorkspaceData) {
  return requestWorkspace("PUT", workspace);
}
