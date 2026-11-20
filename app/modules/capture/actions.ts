import {
  createExpectation,
  createSubjectEvent,
  isInboxTask,
  isValidDateOnly,
  isValidSubjectEventDraft,
  removeTaskFromList,
  taskPriorities,
  uniqueIds,
  type ExpectationDraft,
  type SubjectEventDraft,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type WorkspaceData,
} from "../../lib/tasks";
import { createLocationEntry, type LocationEntryDraft } from "../../lib/locations";
import {
  createNutritionHydration,
  createNutritionIntake,
  type NutritionHydrationDraft,
  type NutritionIntakeDraft,
} from "../../lib/nutrition";
import { prepareFinanceSuggestion, type FinanceSuggestionAction } from "../finance/suggestions";
import { preparePlanningTaskPatch, taskAssignmentError } from "../planning/task-operations";
import type { CaptureResult } from "../../lib/ai-capture";

const sourceSeparator = "\n\n— Captura original —\n";

export function capturedText(entry: Task): string {
  const offset = entry.notes.indexOf(sourceSeparator);
  return offset === -1 ? entry.notes || entry.title : entry.notes.slice(offset + sourceSeparator.length);
}

export function captureDraft(result: CaptureResult): TaskDraft {
  const notes = result.notes.trim();
  const source = result.sourceText.trim();
  return {
    title: result.title,
    notes: notes ? notes + sourceSeparator + source : source,
    aiSuggestion: result.suggestion,
  };
}

type TaskReviewDraft = {
  title: string;
  notes: string;
  priority: TaskPriority;
  hacerEl: string | null;
  venceEl: string | null;
  subjectIds: string[];
};

export type CaptureAction =
  | { type: "task"; draft: TaskReviewDraft }
  | FinanceSuggestionAction
  | { type: "subject_event"; subjectId: string; draft: SubjectEventDraft }
  | { type: "location"; draft: LocationEntryDraft }
  | { type: "nutrition_hydration"; draft: NutritionHydrationDraft }
  | { type: "nutrition_intake"; draft: NutritionIntakeDraft }
  | { type: "expectation"; draft: ExpectationDraft };

type DestinationUpdate = { patch: Partial<WorkspaceData> } | { error: string };

function convertToPlanningTask(
  workspace: WorkspaceData,
  capture: Task,
  draft: TaskReviewDraft,
  now: Date,
): DestinationUpdate {
  const title = draft.title.trim();
  if (!title || !taskPriorities.some(({ value }) => value === draft.priority)) {
    return { error: "Revisá el título y la prioridad de la tarea." };
  }
  if ((draft.hacerEl && !isValidDateOnly(draft.hacerEl)) || (draft.venceEl && !isValidDateOnly(draft.venceEl))) {
    return { error: "Revisá las fechas de la tarea." };
  }
  const subjectIds = uniqueIds(draft.subjectIds);
  if (taskAssignmentError(workspace, subjectIds)) {
    return { error: "El asunto elegido ya no está disponible. Elegí otro o dejá la tarea sin asunto." };
  }

  const reviewed: Task = {
    ...preparePlanningTaskPatch(workspace, capture, { ...draft, title, subjectIds, aiSuggestion: null }, now),
    inboxReviewed: true,
  };
  return { patch: { tasks: workspace.tasks.map((task) => task.id === capture.id ? reviewed : task) } };
}

function prepareDestinationUpdate(workspace: WorkspaceData, capture: Task, action: CaptureAction, now: Date): DestinationUpdate {
  switch (action.type) {
    case "task":
      return convertToPlanningTask(workspace, capture, action.draft, now);
    case "finance_entry":
    case "finance_due_payment": {
      const result = prepareFinanceSuggestion(action, workspace.financeAccounts, now);
      if ("error" in result) return result;
      return "entry" in result
        ? { patch: { financeEntries: [...workspace.financeEntries, result.entry] } }
        : { patch: { financeDuePayments: [...workspace.financeDuePayments, result.payment] } };
    }
    case "subject_event": {
      const { subjectId, draft } = action;
      if (!workspace.subjects.some(({ id }) => id === subjectId)) {
        return { error: "Elegí un asunto disponible para registrar el evento." };
      }
      if (!isValidSubjectEventDraft(draft) || (draft.phaseId &&
        !workspace.phases.some(({ id, subjectId: owner }) => id === draft.phaseId && owner === subjectId))) {
        return { error: "Revisá la fecha, el tipo y la configuración del evento." };
      }
      return { patch: { subjectEvents: [...workspace.subjectEvents, createSubjectEvent(subjectId, draft, now)] } };
    }
    case "location": {
      const entry = createLocationEntry(action.draft);
      return entry
        ? { patch: { locationEntries: [...workspace.locationEntries, entry] } }
        : { error: "Revisá la fecha, los horarios y el lugar." };
    }
    case "nutrition_hydration": {
      const entry = createNutritionHydration(action.draft, now);
      return entry
        ? { patch: { nutritionHydrationEntries: [...workspace.nutritionHydrationEntries, entry] } }
        : { error: "Revisá la fecha y la cantidad de agua en mililitros." };
    }
    case "nutrition_intake": {
      const entry = createNutritionIntake(action.draft, now);
      return entry
        ? { patch: { nutritionIntakeEntries: [...workspace.nutritionIntakeEntries, entry] } }
        : { error: "Revisá la fecha, la comida y las cantidades nutricionales." };
    }
    case "expectation": {
      const entry = createExpectation(action.draft, now);
      return entry
        ? { patch: { expectations: [entry, ...workspace.expectations] } }
        : { error: "Revisá el título, la fecha y la cantidad de la espera." };
    }
  }
}

export function confirmCapture(
  workspace: WorkspaceData,
  captureId: string,
  action: CaptureAction,
  now = new Date(),
): { workspace: WorkspaceData } | { error: string } | null {
  const capture = workspace.tasks.find(({ id }) => id === captureId);
  if (!capture || !isInboxTask(capture)) return null;

  if ((capture.aiSuggestion?.type ?? "task") !== action.type) {
    return { error: "La sugerencia cambió. Revisá la entrada antes de confirmar." };
  }

  const result = prepareDestinationUpdate(workspace, capture, action, now);
  if ("error" in result) return result;
  return {
    workspace: {
      ...workspace,
      tasks: result.patch.tasks ?? removeTaskFromList(workspace.tasks, captureId),
      ...result.patch,
    },
  };
}
