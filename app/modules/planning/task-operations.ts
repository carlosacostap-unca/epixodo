import {
  getTaskDescendantIds,
  normalizeTaskDraft,
  normalizeTaskDeliverableAssignment,
  normalizeTaskPhaseAssignment,
  uniqueIds,
  updateTaskStatus,
  type Task,
  type TaskDraft,
  type WorkspaceData,
} from "../../lib/tasks";

export type TaskPatch = Partial<Pick<Task,
  "title" | "notes" | "subjectIds" | "phaseId" | "deliverableId" | "parentTaskId" |
  "hacerEl" | "venceEl" | "priority" | "status" | "aiSuggestion"
>>;

type PlanningData = Pick<WorkspaceData, "tasks" | "subjects" | "phases" | "deliverables">;

export function taskAssignmentError({ subjects }: PlanningData, subjectIds: readonly string[]): string | undefined {
  if (subjectIds.some((id) => !subjects.some((subject) => subject.id === id))) {
    return "Uno de los asuntos elegidos ya no está disponible. Revisá la selección.";
  }
}

export function preparePlanningTask(data: PlanningData, draft: TaskDraft, now = new Date()): Task | null {
  if (!draft.title.trim()) return null;
  const assignment = normalizeTaskPhaseAssignment(data.phases, draft.subjectIds, draft.phaseId);
  const deliverableId = normalizeTaskDeliverableAssignment(data.deliverables, assignment.subjectIds, draft.deliverableId);
  return normalizeTaskDraft({ ...draft, ...assignment, deliverableId }, now);
}

export function preparePlanningTaskPatch(data: PlanningData, task: Task, patch: TaskPatch, now = new Date()): Task {
  const requestedParent = "parentTaskId" in patch ? patch.parentTaskId || null : task.parentTaskId;
  const parentTaskId = requestedParent && requestedParent !== task.id &&
    !getTaskDescendantIds(data.tasks, task.id).includes(requestedParent)
    ? requestedParent
    : null;
  const subjectIds = "subjectIds" in patch ? uniqueIds(patch.subjectIds) : task.subjectIds;
  const requestedPhase = "phaseId" in patch ? patch.phaseId || null : task.phaseId;
  const phase = data.phases.find(({ id }) => id === requestedPhase);
  const assignment = "phaseId" in patch && phase
    ? normalizeTaskPhaseAssignment(data.phases, subjectIds, phase.id)
    : { subjectIds, phaseId: phase && subjectIds.includes(phase.subjectId) ? phase.id : null };
  const deliverable = "deliverableId" in patch ? patch.deliverableId || null : task.deliverableId;
  const updated: Task = {
    ...task,
    ...patch,
    title: patch.title?.trim() ?? task.title,
    notes: patch.notes ?? task.notes,
    ...assignment,
    deliverableId: normalizeTaskDeliverableAssignment(data.deliverables, assignment.subjectIds, deliverable),
    parentTaskId,
    hacerEl: "hacerEl" in patch ? patch.hacerEl || null : task.hacerEl,
    venceEl: "venceEl" in patch ? patch.venceEl || null : task.venceEl,
    updatedAt: now.toISOString(),
  };
  return patch.status && patch.status !== task.status ? updateTaskStatus(updated, patch.status) : updated;
}
