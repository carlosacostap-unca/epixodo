import type { WorkspaceData } from "./tasks";
import { normalizeWorkspaceData, parseWorkspaceJson } from "./workspace-codec";

const STORAGE_KEY = "epixodo.personal-task-manager.v1";

export type WorkspaceCheckpoint = {
  confirmed: WorkspaceData;
  pending: WorkspaceData | null;
};

function checkpointKey(owner: string) {
  return `epixodo.workspace.v2.${encodeURIComponent(owner)}`;
}

export function loadWorkspaceCheckpoint(owner: string): WorkspaceCheckpoint | null {
  try {
    const raw = window.localStorage.getItem(checkpointKey(owner));
    if (!raw) return null;
    const value = JSON.parse(raw) as WorkspaceCheckpoint;
    return {
      confirmed: normalizeWorkspaceData(value.confirmed),
      pending: value.pending ? normalizeWorkspaceData(value.pending) : null,
    };
  } catch {
    return null;
  }
}

export function saveWorkspaceCheckpoint(owner: string, checkpoint: WorkspaceCheckpoint): boolean {
  try {
    window.localStorage.setItem(checkpointKey(owner), JSON.stringify(checkpoint));
    return true;
  } catch {
    return false;
  }
}

export function loadWorkspace(): WorkspaceData {
  if (typeof window === "undefined") {
    return {
      tasks: [],
      idealDayGoals: [],
      expectations: [],
      subjects: [],
      deliverables: [],
      phases: [],
      subjectEvents: [],
      financeAccounts: [],
      financeEntries: [],
      financeDuePayments: [],
      nutritionProfile: null,
      nutritionFoods: [],
      nutritionRecipes: [],
      nutritionPlanItems: [],
      nutritionIntakeEntries: [],
      nutritionHydrationEntries: [],
      nutritionShoppingLists: [],
      locationEntries: [],
    };
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
      idealDayGoals: workspace.idealDayGoals,
      expectations: workspace.expectations,
      subjects: workspace.subjects,
      deliverables: workspace.deliverables,
      phases: workspace.phases,
      subjectEvents: workspace.subjectEvents,
      financeAccounts: workspace.financeAccounts,
      financeEntries: workspace.financeEntries,
      financeDuePayments: workspace.financeDuePayments,
      nutritionProfile: workspace.nutritionProfile,
      nutritionFoods: workspace.nutritionFoods,
      nutritionRecipes: workspace.nutritionRecipes,
      nutritionPlanItems: workspace.nutritionPlanItems,
      nutritionIntakeEntries: workspace.nutritionIntakeEntries,
      nutritionHydrationEntries: workspace.nutritionHydrationEntries,
      nutritionShoppingLists: workspace.nutritionShoppingLists,
      locationEntries: workspace.locationEntries,
    }),
  );
}

async function requestWorkspace(method: "GET" | "PUT", workspace?: WorkspaceData, owner?: string, signal?: AbortSignal) {
  const response = await fetch("/api/workspace", {
    method,
    headers: {
      ...(workspace ? { "Content-Type": "application/json" } : {}),
      ...(owner ? { "X-Workspace-Owner": owner } : {}),
    },
    body: workspace ? JSON.stringify(workspace) : undefined,
    signal,
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

export function loadRemoteWorkspace(owner?: string, signal?: AbortSignal) {
  return requestWorkspace("GET", undefined, owner, signal);
}

export function saveRemoteWorkspace(workspace: WorkspaceData, owner?: string, signal?: AbortSignal) {
  return requestWorkspace("PUT", workspace, owner, signal);
}
