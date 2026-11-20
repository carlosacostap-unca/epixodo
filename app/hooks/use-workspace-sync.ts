"use client";

import { useEffect, useLayoutEffect, useRef, useState, type SetStateAction } from "react";
import { emptyWorkspace, type WorkspaceData } from "../lib/tasks";
import { loadRemoteWorkspace, loadWorkspaceCheckpoint, saveRemoteWorkspace, saveWorkspaceCheckpoint } from "../lib/task-storage";
import { reconcileWorkspace } from "../lib/workspace-reconciliation";

export function useWorkspaceSync(owner: string, workspace: WorkspaceData, setWorkspace: (update: SetStateAction<WorkspaceData>) => void) {
  const [confirmed, setConfirmed] = useState<WorkspaceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const session = useRef<AbortController | null>(null);
  const latest = useRef(workspace);
  const acknowledged = useRef<WorkspaceData | null>(null);
  const queue = useRef(Promise.resolve());
  const handledRetry = useRef(0);
  const pending = confirmed !== null && workspace !== confirmed;

  useEffect(() => {
    const controller = new AbortController();
    session.current = controller;
    const { signal } = controller;
    const cached = loadWorkspaceCheckpoint(owner);

    async function hydrate() {
      let base: WorkspaceData;
      let next: WorkspaceData;
      try {
        base = await loadRemoteWorkspace(owner, signal);
        next = cached?.pending ? reconcileWorkspace(cached.confirmed, cached.pending, base) : base;
      } catch (error) {
        if (signal.aborted) return;
        base = cached?.confirmed ?? emptyWorkspace();
        next = cached?.pending ?? base;
        setSyncError(error instanceof Error ? error.message : "No se pudo cargar tu espacio.");
      }
      if (signal.aborted) return;
      acknowledged.current = base;
      setConfirmed(base);
      setWorkspace(next);
    }

    void hydrate();
    return () => controller.abort();
  }, [owner, setWorkspace]);

  useLayoutEffect(() => {
    latest.current = workspace;
    if (confirmed) saveWorkspaceCheckpoint(owner, { confirmed, pending: pending ? workspace : null });
  }, [confirmed, owner, pending, workspace]);

  useEffect(() => {
    if (!pending && retry === handledRetry.current) return;
    const signal = session.current?.signal;
    if (!signal) return;

    const timer = window.setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const base = acknowledged.current;
        if (!base || signal.aborted) return;
        handledRetry.current = retry;
        const snapshot = latest.current;
        setIsSaving(true);
        try {
          const remote = await loadRemoteWorkspace(owner, signal);
          const merged = reconcileWorkspace(base, snapshot, remote);
          const saved = merged === remote ? remote : await saveRemoteWorkspace(merged, owner, signal);
          if (signal.aborted) return;
          acknowledged.current = saved;
          setConfirmed(saved);
          setWorkspace((current) => current === snapshot ? saved : reconcileWorkspace(snapshot, current, saved));
          setSyncError(null);
        } catch (error) {
          if (!signal.aborted) setSyncError(error instanceof Error ? error.message : "No se pudo sincronizar tu espacio.");
        } finally {
          if (!signal.aborted) setIsSaving(false);
        }
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [confirmed, owner, pending, retry, setWorkspace, workspace]);

  return {
    isLoaded: confirmed !== null,
    isSaving,
    syncPending: pending,
    syncError,
    retrySync: () => setRetry((value) => value + 1),
  };
}
