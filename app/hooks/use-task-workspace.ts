"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadRemoteWorkspace,
  loadWorkspace,
  saveRemoteWorkspace,
  saveWorkspace,
} from "../lib/task-storage";
import {
  createSubject,
  createSubjectEvent,
  createSubjectPhase,
  emptyWorkspace,
  getAvailableParentTasks,
  getCompletedTasks,
  getInboxTasks,
  isValidSubjectEventDraft,
  getPhaseDateRangeError,
  getSubjectDescendantIds,
  getSubjectTasks,
  getTaskDescendantIds,
  getTodayDateOnly,
  getTodayTasks,
  getUnplannedDeadlineTasks,
  getUpcomingTasks,
  getWaitingTasks,
  normalizeTaskDraft,
  normalizeTaskPhaseAssignment,
  patchSubjectEvent,
  reorderSubjectPhases,
  removePhaseFromWorkspace,
  removeSubjectEventFromWorkspace,
  removeSubjectFromWorkspace,
  sortedSubjectPhases,
  uniqueIds,
  updateTaskStatus,
  type Subject,
  type SubjectEvent,
  type SubjectEventDraft,
  type SubjectHorizon,
  type SubjectPhase,
  type SubjectPhaseDraft,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
  type WorkspaceData,
} from "../lib/tasks";

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "notes"
    | "subjectIds"
    | "phaseId"
    | "parentTaskId"
    | "hacerEl"
    | "venceEl"
    | "priority"
    | "status"
  >
>;

type PhasePatch = Partial<
  Pick<
    SubjectPhase,
    "name" | "plannedStart" | "executedStart" | "plannedEnd" | "executedEnd"
  >
>;

type SubjectEventPatch = Partial<SubjectEventDraft>;

export function useTaskWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => emptyWorkspace());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const today = getTodayDateOnly();

  useEffect(() => {
    let isCancelled = false;

    async function hydrateWorkspace() {
      const localWorkspace = loadWorkspace();

      if (
        localWorkspace.tasks.length > 0 ||
        localWorkspace.subjects.length > 0 ||
        localWorkspace.phases.length > 0 ||
        localWorkspace.subjectEvents.length > 0
      ) {
        setWorkspace(localWorkspace);
      }

      try {
        const remoteWorkspace = await loadRemoteWorkspace();
        const hasRemoteData =
          remoteWorkspace.tasks.length > 0 ||
          remoteWorkspace.subjects.length > 0 ||
          remoteWorkspace.phases.length > 0 ||
          remoteWorkspace.subjectEvents.length > 0;
        const hasLocalData =
          localWorkspace.tasks.length > 0 ||
          localWorkspace.subjects.length > 0 ||
          localWorkspace.phases.length > 0 ||
          localWorkspace.subjectEvents.length > 0;
        const nextWorkspace = hasRemoteData ? remoteWorkspace : localWorkspace;

        if (isCancelled) {
          return;
        }

        setWorkspace(nextWorkspace);
        setSyncError(null);
        setIsLoaded(true);

        if (!hasRemoteData && hasLocalData) {
          await saveRemoteWorkspace(localWorkspace);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setSyncError(
          error instanceof Error ? error.message : "No se pudo conectar con PocketBase.",
        );
        setIsLoaded(true);
      }
    }

    hydrateWorkspace();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveWorkspace(workspace);

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      setIsSaving(true);

      try {
        await saveRemoteWorkspace(workspace);
        setSyncError(null);
      } catch (error) {
        setSyncError(
          error instanceof Error ? error.message : "No se pudo sincronizar con PocketBase.",
        );
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [isLoaded, workspace]);

  const views = useMemo(
    () => ({
      today: getTodayTasks(workspace.tasks, today),
      inbox: getInboxTasks(workspace.tasks),
      upcoming: getUpcomingTasks(workspace.tasks, today),
      waiting: getWaitingTasks(workspace.tasks),
      completed: getCompletedTasks(workspace.tasks),
      unplanned: getUnplannedDeadlineTasks(workspace.tasks, today),
    }),
    [today, workspace.tasks],
  );

  function addTask(draft: TaskDraft) {
    if (!draft.title.trim()) {
      return;
    }

    setWorkspace((current) => {
      const assignment = normalizeTaskPhaseAssignment(
        current.phases,
        draft.subjectIds,
        draft.phaseId,
      );

      return {
        ...current,
        tasks: [normalizeTaskDraft({ ...draft, ...assignment }), ...current.tasks],
      };
    });
  }

  function patchTask(taskId: string, patch: TaskPatch) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextStatus = patch.status ?? task.status;
        const descendantTaskIds = new Set(getTaskDescendantIds(current.tasks, task.id));
        const requestedParentTaskId =
          "parentTaskId" in patch ? patch.parentTaskId || null : task.parentTaskId;
        const safeParentTaskId =
          requestedParentTaskId &&
          requestedParentTaskId !== task.id &&
          !descendantTaskIds.has(requestedParentTaskId)
            ? requestedParentTaskId
            : null;
        const requestedSubjectIds =
          "subjectIds" in patch ? uniqueIds(patch.subjectIds) : task.subjectIds;
        const requestedPhaseId = "phaseId" in patch ? patch.phaseId || null : task.phaseId;
        const phase = requestedPhaseId
          ? current.phases.find((item) => item.id === requestedPhaseId)
          : null;
        const assignment =
          "phaseId" in patch && phase
            ? normalizeTaskPhaseAssignment(current.phases, requestedSubjectIds, phase.id)
            : {
                subjectIds: requestedSubjectIds,
                phaseId:
                  phase && requestedSubjectIds.includes(phase.subjectId) ? phase.id : null,
              };
        const updated = {
          ...task,
          ...patch,
          title: patch.title?.trim() ?? task.title,
          notes: patch.notes ?? task.notes,
          subjectIds: assignment.subjectIds,
          phaseId: assignment.phaseId,
          parentTaskId: safeParentTaskId,
          hacerEl: "hacerEl" in patch ? patch.hacerEl || null : task.hacerEl,
          venceEl: "venceEl" in patch ? patch.venceEl || null : task.venceEl,
          updatedAt: new Date().toISOString(),
        };

        if (nextStatus !== task.status) {
          return updateTaskStatus(updated, nextStatus);
        }

        return updated;
      }),
    }));
  }

  function setTaskStatus(taskId: string, status: TaskStatus) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? updateTaskStatus(task, status) : task,
      ),
    }));
  }

  function setTaskPriority(taskId: string, priority: TaskPriority) {
    patchTask(taskId, { priority });
  }

  function deleteTask(taskId: string) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks
        .filter((task) => task.id !== taskId)
        .map((task) =>
          task.parentTaskId === taskId ? { ...task, parentTaskId: null } : task,
        ),
    }));
  }

  function addSubject(
    name: string,
    horizon: SubjectHorizon = "none",
    parentSubjectId: string | null = null,
  ) {
    if (!name.trim()) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      subjects: [...current.subjects, createSubject(name, horizon, parentSubjectId)],
    }));
  }

  function renameSubject(subjectId: string, name: string) {
    if (!name.trim()) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === subjectId
          ? { ...subject, name: name.trim(), updatedAt: new Date().toISOString() }
          : subject,
      ),
    }));
  }

  function setSubjectHorizon(subjectId: string, horizon: SubjectHorizon) {
    setWorkspace((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === subjectId
          ? { ...subject, horizon, updatedAt: new Date().toISOString() }
          : subject,
      ),
    }));
  }

  function setSubjectParent(subjectId: string, parentSubjectId: string | null) {
    setWorkspace((current) => {
      const blockedIds = new Set([
        subjectId,
        ...getSubjectDescendantIds(current.subjects, subjectId),
      ]);
      const safeParentId =
        parentSubjectId && !blockedIds.has(parentSubjectId) ? parentSubjectId : null;

      return {
        ...current,
        subjects: current.subjects.map((subject) =>
          subject.id === subjectId
            ? { ...subject, parentSubjectId: safeParentId, updatedAt: new Date().toISOString() }
            : subject,
        ),
      };
    });
  }

  function deleteSubject(subjectId: string) {
    setWorkspace((current) => removeSubjectFromWorkspace(current, subjectId));
  }

  function addPhase(subjectId: string, draft: SubjectPhaseDraft) {
    if (!draft.name.trim() || getPhaseDateRangeError(draft)) {
      return;
    }

    setWorkspace((current) => {
      if (!current.subjects.some((subject) => subject.id === subjectId)) {
        return current;
      }

      const nextOrder = sortedSubjectPhases(current.phases, subjectId).length;
      return {
        ...current,
        phases: [...current.phases, createSubjectPhase(subjectId, draft, nextOrder)],
      };
    });
  }

  function patchPhase(phaseId: string, patch: PhasePatch) {
    setWorkspace((current) => {
      const phase = current.phases.find((item) => item.id === phaseId);

      if (!phase) {
        return current;
      }

      const updated = {
        ...phase,
        ...patch,
        name: patch.name?.trim() ?? phase.name,
        plannedStart: "plannedStart" in patch ? patch.plannedStart || null : phase.plannedStart,
        executedStart:
          "executedStart" in patch ? patch.executedStart || null : phase.executedStart,
        plannedEnd: "plannedEnd" in patch ? patch.plannedEnd || null : phase.plannedEnd,
        executedEnd: "executedEnd" in patch ? patch.executedEnd || null : phase.executedEnd,
        updatedAt: new Date().toISOString(),
      };

      if (!updated.name || getPhaseDateRangeError(updated)) {
        return current;
      }

      return {
        ...current,
        phases: current.phases.map((item) => (item.id === phaseId ? updated : item)),
      };
    });
  }

  function movePhase(phaseId: string, direction: "up" | "down") {
    setWorkspace((current) => {
      const phase = current.phases.find((item) => item.id === phaseId);

      if (!phase) {
        return current;
      }

      const ordered = sortedSubjectPhases(current.phases, phase.subjectId);
      const index = ordered.findIndex((item) => item.id === phaseId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const nextIds = ordered.map((item) => item.id);
      [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];

      return {
        ...current,
        phases: reorderSubjectPhases(current.phases, phase.subjectId, nextIds),
      };
    });
  }

  function deletePhase(phaseId: string) {
    setWorkspace((current) => removePhaseFromWorkspace(current, phaseId));
  }

  function addSubjectEvent(subjectId: string, draft: SubjectEventDraft) {
    if (!isValidSubjectEventDraft(draft)) {
      return;
    }

    setWorkspace((current) => {
      if (!current.subjects.some((subject) => subject.id === subjectId)) {
        return current;
      }

      return {
        ...current,
        subjectEvents: [...current.subjectEvents, createSubjectEvent(subjectId, draft)],
      };
    });
  }

  function updateSubjectEvent(eventId: string, patch: SubjectEventPatch) {
    setWorkspace((current) => {
      const event = current.subjectEvents.find((item) => item.id === eventId);

      if (!event) {
        return current;
      }

      const updated = patchSubjectEvent(event, patch);

      if (!updated) {
        return current;
      }

      return {
        ...current,
        subjectEvents: current.subjectEvents.map((item) =>
          item.id === eventId ? updated : item,
        ),
      };
    });
  }

  function deleteSubjectEvent(eventId: string) {
    setWorkspace((current) => removeSubjectEventFromWorkspace(current, eventId));
  }

  function getTasksForSubject(subjectId: string) {
    return getSubjectTasks(workspace.tasks, workspace.subjects, subjectId);
  }

  function getAvailableParentTasksForTask(taskId: string) {
    return getAvailableParentTasks(workspace.tasks, taskId);
  }

  function getAvailableParentSubjects(subjectId: string | null = null) {
    if (!subjectId) {
      return workspace.subjects;
    }

    const blockedIds = new Set([subjectId, ...getSubjectDescendantIds(workspace.subjects, subjectId)]);
    return workspace.subjects.filter((subject) => !blockedIds.has(subject.id));
  }

  return {
    ...workspace,
    isLoaded,
    isSaving,
    syncError,
    today,
    views,
    addTask,
    patchTask,
    setTaskStatus,
    setTaskPriority,
    deleteTask,
    addSubject,
    renameSubject,
    setSubjectHorizon,
    setSubjectParent,
    deleteSubject,
    addPhase,
    patchPhase,
    movePhase,
    deletePhase,
    addSubjectEvent,
    updateSubjectEvent,
    deleteSubjectEvent,
    getTasksForSubject,
    getAvailableParentTasksForTask,
    getAvailableParentSubjects,
  };
}

export type TaskWorkspace = ReturnType<typeof useTaskWorkspace>;
export type { Subject, SubjectEvent, SubjectPhase, Task };
