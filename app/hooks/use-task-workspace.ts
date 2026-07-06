"use client";

import { useEffect, useMemo, useState } from "react";
import { loadWorkspace, saveWorkspace } from "../lib/task-storage";
import {
  createProject,
  emptyWorkspace,
  getCompletedTasks,
  getInboxTasks,
  getProjectTasks,
  getTodayDateOnly,
  getTodayTasks,
  getUnplannedDeadlineTasks,
  getUpcomingTasks,
  getWaitingTasks,
  normalizeTaskDraft,
  updateTaskStatus,
  type Project,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
  type WorkspaceData,
} from "../lib/tasks";

type TaskPatch = Partial<
  Pick<Task, "title" | "notes" | "projectId" | "hacerEl" | "venceEl" | "priority" | "status">
>;

export function useTaskWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => emptyWorkspace());
  const [isLoaded, setIsLoaded] = useState(false);
  const today = getTodayDateOnly();

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      setWorkspace(loadWorkspace());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveWorkspace(workspace);
    }
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

    setWorkspace((current) => ({
      ...current,
      tasks: [normalizeTaskDraft(draft), ...current.tasks],
    }));
  }

  function patchTask(taskId: string, patch: TaskPatch) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextStatus = patch.status ?? task.status;
        const updated = {
          ...task,
          ...patch,
          title: patch.title?.trim() ?? task.title,
          notes: patch.notes ?? task.notes,
          projectId:
            "projectId" in patch ? patch.projectId || null : task.projectId,
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
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }));
  }

  function addProject(name: string) {
    if (!name.trim()) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      projects: [...current.projects, createProject(name)],
    }));
  }

  function renameProject(projectId: string, name: string) {
    if (!name.trim()) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, name: name.trim(), updatedAt: new Date().toISOString() }
          : project,
      ),
    }));
  }

  function getTasksForProject(projectId: string) {
    return getProjectTasks(workspace.tasks, projectId);
  }

  return {
    ...workspace,
    isLoaded,
    today,
    views,
    addTask,
    patchTask,
    setTaskStatus,
    setTaskPriority,
    deleteTask,
    addProject,
    renameProject,
    getTasksForProject,
  };
}

export type TaskWorkspace = ReturnType<typeof useTaskWorkspace>;
export type { Project, Task };
