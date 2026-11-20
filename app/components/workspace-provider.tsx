"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useTaskWorkspace, type TaskWorkspace } from "../hooks/use-task-workspace";

const WorkspaceContext = createContext<TaskWorkspace | null>(null);
const WorkspaceMemory = createContext<Map<string, unknown> | null>(null);

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WorkspaceProvider is required.");
  return workspace;
}

export function useWorkspaceMemory() {
  const memory = useContext(WorkspaceMemory);
  if (!memory) throw new Error("WorkspaceProvider is required.");
  return memory;
}

export function useWorkspaceDraft<T>(key: string, initial: () => T) {
  const memory = useWorkspaceMemory();
  const [value, setValue] = useState(() => memory.has(key) ? memory.get(key) as T : initial());
  function update(next: T) {
    memory.set(key, next);
    setValue(next);
  }
  return [value, update] as const;
}

export default function WorkspaceProvider({ children, owner }: { children: ReactNode; owner: string }) {
  const workspace = useTaskWorkspace(owner);
  const [memory] = useState(() => new Map<string, unknown>());

  return (
    <WorkspaceContext.Provider value={workspace}>
      <WorkspaceMemory.Provider value={memory}>
        {workspace.syncError ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#7a3d32] bg-[#2e1716] px-5 py-2 text-sm text-[#ffafa5]">
            <p role="alert">{workspace.syncPending ? "Cambios pendientes de sincronizar. " : ""}{workspace.syncError}</p>
            <button type="button" disabled={workspace.isSaving} onClick={workspace.retrySync} className="min-h-11 px-2 font-semibold underline underline-offset-4">Reintentar sincronización</button>
          </div>
        ) : null}
        {children}
      </WorkspaceMemory.Provider>
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceLoading() {
  return (
    <div role="status" className="grid min-h-72 place-items-center px-5 text-center text-sm font-semibold text-[#b7c7df]">
      Sincronizando tu espacio…
    </div>
  );
}
