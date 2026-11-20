"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTaskWorkspace, type TaskWorkspace } from "../hooks/use-task-workspace";

const WorkspaceContext = createContext<TaskWorkspace | null>(null);

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WorkspaceProvider is required.");
  return workspace;
}

export default function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useTaskWorkspace();

  return (
    <WorkspaceContext.Provider value={workspace}>
      {workspace.syncError ? (
        <p role="alert" className="border-b border-[#7a3d32] bg-[#2e1716] px-5 py-3 text-sm text-[#ffafa5]">
          {workspace.syncError}
        </p>
      ) : null}
      {children}
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
