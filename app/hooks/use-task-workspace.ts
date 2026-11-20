"use client";

import { useCallback, useMemo, useState, type SetStateAction } from "react";
import { useWorkspaceSync } from "./use-workspace-sync";
import {
  createSubject,
  createSubjectDeliverable,
  createExpectation,
  createSubjectEvent,
  createSubjectPhase,
  emptyWorkspace,
  getAvailableParentTasks,
  getCompletedTasks,
  getInboxTasks,
  getReviewedUnassignedTasks,
  isInboxTask,
  isValidSubjectEventDraft,
  isValidSubjectDeliverableDraft,
  getPhaseDateRangeError,
  getSubjectDescendantIds,
  getSubjectTasks,
  getTodayDateOnly,
  getTodayTasks,
  getUnplannedDeadlineTasks,
  getUpcomingTasks,
  getWaitingTasks,
  patchSubjectEvent,
  patchSubjectDeliverable,
  reorderSubjectPhases,
  patchExpectation,
  removePhaseFromWorkspace,
  removeSubjectEventFromWorkspace,
  removeSubjectDeliverableFromWorkspace,
  removeSubjectFromWorkspace,
  removeTaskFromList,
  sortedSubjectPhases,
  sortedExpectations,
  setExpectationStatus,
  updateTaskStatus,
  type Subject,
  type SubjectDeliverable,
  type SubjectDeliverableDraft,
  type ExpectationDraft,
  type ExpectationStatus,
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
import { useFinanceWorkspace, type FinanceData } from "../modules/finance/workspace";
import { captureDraft, confirmCapture, type CaptureAction } from "../modules/capture/actions";
import type { CaptureResult } from "../lib/ai-capture";
import { preparePlanningTask, preparePlanningTaskPatch, taskAssignmentError, type TaskPatch } from "../modules/planning/task-operations";
import {
  createIntakeFromPlan,
  createNutritionFood,
  createNutritionHydration,
  createNutritionIntake,
  createNutritionPlanItem,
  createNutritionProfile,
  createNutritionRecipe,
  createNutritionShoppingItem,
  generateNutritionShoppingList,
  getFoodReferences,
  getNutritionDailySummary,
  getPlanItemsForWeek,
  getRecipeReferences,
  patchNutritionFood,
  patchNutritionHydration,
  patchNutritionIntake,
  patchNutritionPlanItem,
  patchNutritionRecipe,
  patchNutritionShoppingItem,
  type NutritionFoodDraft,
  type NutritionHydrationDraft,
  type NutritionIntakeDraft,
  type NutritionPlanItemDraft,
  type NutritionProfileDraft,
  type NutritionRecipeDraft,
  type NutritionShoppingItemDraft,
} from "../lib/nutrition";
import {
  createLocationEntry,
  patchLocationEntry,
  type LocationEntryDraft,
} from "../lib/locations";
import {
  copyIdealDayGoals,
  createIdealDayGoal,
  patchIdealDayGoal,
  type IdealDayGoal,
  type IdealDayGoalDraft,
} from "../lib/ideal-day";

type PhasePatch = Partial<
  Pick<
    SubjectPhase,
    "name" | "plannedStart" | "executedStart" | "plannedEnd" | "executedEnd"
  >
>;

type SubjectEventPatch = Partial<SubjectEventDraft>;

export function useTaskWorkspace(owner: string) {
  const [{ workspace, suggestionErrors }, setState] = useState(() => ({
    workspace: emptyWorkspace(),
    suggestionErrors: new Map<string, string>(),
  }));
  const setWorkspace = useCallback((update: SetStateAction<WorkspaceData>) => {
    setState((current) => {
      const nextWorkspace = typeof update === "function" ? update(current.workspace) : update;
      return nextWorkspace === current.workspace ? current : { ...current, workspace: nextWorkspace };
    });
  }, []);
  const sync = useWorkspaceSync(owner, workspace, setWorkspace);
  const today = getTodayDateOnly();
  const { financeAccounts, financeEntries, financeDuePayments, ...otherData } = workspace;
  const finance = useFinanceWorkspace({ financeAccounts, financeEntries, financeDuePayments }, today, updateFinance);

  function updateFinance(update: (current: FinanceData) => FinanceData) {
    setWorkspace((current) => {
      const currentFinance = {
        financeAccounts: current.financeAccounts,
        financeEntries: current.financeEntries,
        financeDuePayments: current.financeDuePayments,
      };
      const nextFinance = update(currentFinance);
      return nextFinance === currentFinance ? current : { ...current, ...nextFinance };
    });
  }

  const views = useMemo(
    () => ({
      today: getTodayTasks(workspace.tasks, today),
      unassigned: getReviewedUnassignedTasks(workspace.tasks),
      upcoming: getUpcomingTasks(workspace.tasks, today),
      waiting: getWaitingTasks(workspace.tasks),
      completed: getCompletedTasks(workspace.tasks),
      unplanned: getUnplannedDeadlineTasks(workspace.tasks, today),
    }),
    [today, workspace.tasks],
  );
  const inboxEntries = useMemo(() => getInboxTasks(workspace.tasks), [workspace.tasks]);

  const nutritionTodaySummary = useMemo(
    () =>
      getNutritionDailySummary(
        today,
        workspace.nutritionPlanItems,
        workspace.nutritionIntakeEntries,
        workspace.nutritionHydrationEntries,
        workspace.nutritionFoods,
        workspace.nutritionRecipes,
      ),
    [
      today,
      workspace.nutritionPlanItems,
      workspace.nutritionIntakeEntries,
      workspace.nutritionHydrationEntries,
      workspace.nutritionFoods,
      workspace.nutritionRecipes,
    ],
  );
  const nutritionCurrentWeekPlan = useMemo(
    () => getPlanItemsForWeek(workspace.nutritionPlanItems, today),
    [today, workspace.nutritionPlanItems],
  );
  const orderedExpectations = useMemo(
    () => sortedExpectations(workspace.expectations),
    [workspace.expectations],
  );

  function addTask(draft: TaskDraft, reviewed = false) {
    const now = new Date();
    setWorkspace((current) => {
      const task = preparePlanningTask(current, draft, now);
      if (!task) return current;
      return {
        ...current,
        tasks: [reviewed ? { ...task, inboxReviewed: true } : task, ...current.tasks],
      };
    });
  }

  function patchTask(taskId: string, patch: TaskPatch) {
    const now = new Date();
    setWorkspace((current) => {
      if (patch.subjectIds && taskAssignmentError(current, patch.subjectIds)) return current;
      return {
        ...current,
        tasks: current.tasks.map((task) => task.id === taskId ? preparePlanningTaskPatch(current, task, patch, now) : task),
      };
    });
  }

  function assignTaskSubjects(taskId: string, subjectIds: string[]): string | undefined {
    if (!workspace.tasks.some(({ id }) => id === taskId)) return "La tarea ya no está disponible.";
    const error = taskAssignmentError(workspace, subjectIds);
    if (error) return error;
    patchTask(taskId, { subjectIds });
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
      tasks: removeTaskFromList(current.tasks, taskId),
    }));
  }

  function acceptCapture(taskId: string, action: CaptureAction) {
    const now = new Date();
    setState((current) => {
      const result = confirmCapture(current.workspace, taskId, action, now);
      if (!result) return current;
      const errors = new Map(current.suggestionErrors);
      if ("error" in result) {
        errors.set(taskId, result.error);
        return { ...current, suggestionErrors: errors };
      }

      errors.delete(taskId);
      return { suggestionErrors: errors, workspace: result.workspace };
    });
  }

  function discardCapture(taskId: string) {
    setState((current) => {
      const capture = current.workspace.tasks.find(({ id }) => id === taskId);
      if (!capture || !isInboxTask(capture)) return current;
      const errors = new Map(current.suggestionErrors);
      errors.delete(taskId);
      return {
        suggestionErrors: errors,
        workspace: { ...current.workspace, tasks: removeTaskFromList(current.workspace.tasks, taskId) },
      };
    });
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

  function addDeliverable(subjectId: string, draft: SubjectDeliverableDraft) {
    if (!isValidSubjectDeliverableDraft(draft)) return;

    setWorkspace((current) =>
      current.subjects.some((subject) => subject.id === subjectId)
        ? {
            ...current,
            deliverables: [
              ...current.deliverables,
              createSubjectDeliverable(subjectId, draft),
            ],
          }
        : current,
    );
  }

  function updateDeliverable(
    deliverableId: string,
    patch: Partial<SubjectDeliverableDraft>,
  ) {
    setWorkspace((current) => {
      const deliverable = current.deliverables.find((item) => item.id === deliverableId);
      const updated = deliverable ? patchSubjectDeliverable(deliverable, patch) : null;
      return updated
        ? {
            ...current,
            deliverables: current.deliverables.map((item) =>
              item.id === deliverableId ? updated : item,
            ),
          }
        : current;
    });
  }

  function deleteDeliverable(deliverableId: string) {
    setWorkspace((current) =>
      removeSubjectDeliverableFromWorkspace(current, deliverableId),
    );
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

  function addExpectation(draft: ExpectationDraft) {
    const expectation = createExpectation(draft);
    if (expectation) setWorkspace((current) => ({ ...current, expectations: [expectation, ...current.expectations] }));
  }

  function updateExpectation(expectationId: string, patch: Partial<ExpectationDraft>) {
    setWorkspace((current) => {
      const expectation = current.expectations.find((item) => item.id === expectationId);
      const updated = expectation ? patchExpectation(expectation, patch) : null;
      return updated ? { ...current, expectations: current.expectations.map((item) => item.id === expectationId ? updated : item) } : current;
    });
  }

  function updateExpectationStatus(expectationId: string, status: ExpectationStatus) {
    setWorkspace((current) => ({ ...current, expectations: current.expectations.map((item) =>
      item.id === expectationId ? setExpectationStatus(item, status) : item) }));
  }

  function deleteExpectation(expectationId: string) {
    setWorkspace((current) => ({ ...current, expectations: current.expectations.filter((item) => item.id !== expectationId) }));
  }

  function addSubjectEvent(subjectId: string, draft: SubjectEventDraft) {
    if (!isValidSubjectEventDraft(draft)) {
      return;
    }

    setWorkspace((current) => {
      if (!current.subjects.some((subject) => subject.id === subjectId)) {
        return current;
      }

      if (
        draft.phaseId &&
        !current.phases.some(
          (phase) => phase.id === draft.phaseId && phase.subjectId === subjectId,
        )
      ) {
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

      const nextPhaseId = patch.phaseId === undefined ? event.phaseId : patch.phaseId;

      if (
        nextPhaseId &&
        !current.phases.some(
          (phase) => phase.id === nextPhaseId && phase.subjectId === event.subjectId,
        )
      ) {
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

  function updateNutritionProfile(draft: NutritionProfileDraft) {
    const profile = createNutritionProfile(draft);
    if (profile) setWorkspace((current) => ({ ...current, nutritionProfile: profile }));
  }

  function addNutritionFood(draft: NutritionFoodDraft) {
    const food = createNutritionFood(draft);
    if (food) setWorkspace((current) => ({ ...current, nutritionFoods: [...current.nutritionFoods, food] }));
  }

  function updateNutritionFood(foodId: string, patch: Partial<NutritionFoodDraft>) {
    setWorkspace((current) => {
      const food = current.nutritionFoods.find((item) => item.id === foodId);
      const updated = food ? patchNutritionFood(food, patch) : null;
      return updated ? { ...current, nutritionFoods: current.nutritionFoods.map((item) => item.id === foodId ? updated : item) } : current;
    });
  }

  function deleteNutritionFood(foodId: string) {
    setWorkspace((current) => {
      const references = getFoodReferences(foodId, current.nutritionRecipes, current.nutritionPlanItems);
      return references.recipes.length || references.planItems.length
        ? current
        : { ...current, nutritionFoods: current.nutritionFoods.filter((food) => food.id !== foodId) };
    });
  }

  function addNutritionRecipe(draft: NutritionRecipeDraft) {
    setWorkspace((current) => {
      const recipe = createNutritionRecipe(draft, new Set(current.nutritionFoods.map((food) => food.id)));
      return recipe ? { ...current, nutritionRecipes: [...current.nutritionRecipes, recipe] } : current;
    });
  }

  function updateNutritionRecipe(recipeId: string, patch: Partial<NutritionRecipeDraft>) {
    setWorkspace((current) => {
      const recipe = current.nutritionRecipes.find((item) => item.id === recipeId);
      const updated = recipe ? patchNutritionRecipe(recipe, patch, new Set(current.nutritionFoods.map((food) => food.id))) : null;
      return updated ? { ...current, nutritionRecipes: current.nutritionRecipes.map((item) => item.id === recipeId ? updated : item) } : current;
    });
  }

  function deleteNutritionRecipe(recipeId: string) {
    setWorkspace((current) =>
      getRecipeReferences(recipeId, current.nutritionPlanItems).length
        ? current
        : { ...current, nutritionRecipes: current.nutritionRecipes.filter((recipe) => recipe.id !== recipeId) },
    );
  }

  function addNutritionPlanItem(draft: NutritionPlanItemDraft) {
    setWorkspace((current) => {
      const item = createNutritionPlanItem(
        draft,
        new Set(current.nutritionFoods.map((food) => food.id)),
        new Set(current.nutritionRecipes.map((recipe) => recipe.id)),
      );
      return item ? { ...current, nutritionPlanItems: [...current.nutritionPlanItems, item] } : current;
    });
  }

  function updateNutritionPlanItem(itemId: string, patch: Partial<NutritionPlanItemDraft>) {
    setWorkspace((current) => {
      const item = current.nutritionPlanItems.find((candidate) => candidate.id === itemId);
      const updated = item ? patchNutritionPlanItem(item, patch, new Set(current.nutritionFoods.map((food) => food.id)), new Set(current.nutritionRecipes.map((recipe) => recipe.id))) : null;
      return updated ? { ...current, nutritionPlanItems: current.nutritionPlanItems.map((candidate) => candidate.id === itemId ? updated : candidate) } : current;
    });
  }

  function copyNutritionPlanItem(itemId: string, date: string) {
    setWorkspace((current) => {
      const source = current.nutritionPlanItems.find((item) => item.id === itemId);
      if (!source) return current;
      const copied = createNutritionPlanItem(
        { date, mealType: source.mealType, sourceType: source.sourceType, sourceId: source.sourceId, servingsMilli: source.servingsMilli },
        new Set(current.nutritionFoods.map((food) => food.id)),
        new Set(current.nutritionRecipes.map((recipe) => recipe.id)),
      );
      return copied ? { ...current, nutritionPlanItems: [...current.nutritionPlanItems, copied] } : current;
    });
  }

  function deleteNutritionPlanItem(itemId: string) {
    setWorkspace((current) => ({ ...current, nutritionPlanItems: current.nutritionPlanItems.filter((item) => item.id !== itemId) }));
  }

  function consumeNutritionPlanItem(itemId: string) {
    setWorkspace((current) => {
      const item = current.nutritionPlanItems.find((candidate) => candidate.id === itemId);
      const entry = item ? createIntakeFromPlan(item, current.nutritionFoods, current.nutritionRecipes) : null;
      return entry ? { ...current, nutritionIntakeEntries: [...current.nutritionIntakeEntries, entry] } : current;
    });
  }

  function addNutritionIntake(draft: NutritionIntakeDraft) {
    const entry = createNutritionIntake(draft);
    if (entry) setWorkspace((current) => ({ ...current, nutritionIntakeEntries: [...current.nutritionIntakeEntries, entry] }));
  }

  function updateNutritionIntake(entryId: string, patch: Partial<NutritionIntakeDraft>) {
    setWorkspace((current) => {
      const entry = current.nutritionIntakeEntries.find((candidate) => candidate.id === entryId);
      const updated = entry ? patchNutritionIntake(entry, patch) : null;
      return updated ? { ...current, nutritionIntakeEntries: current.nutritionIntakeEntries.map((candidate) => candidate.id === entryId ? updated : candidate) } : current;
    });
  }

  function deleteNutritionIntake(entryId: string) {
    setWorkspace((current) => ({ ...current, nutritionIntakeEntries: current.nutritionIntakeEntries.filter((entry) => entry.id !== entryId) }));
  }

  function addNutritionHydration(draft: NutritionHydrationDraft) {
    const entry = createNutritionHydration(draft);
    if (entry) setWorkspace((current) => ({ ...current, nutritionHydrationEntries: [...current.nutritionHydrationEntries, entry] }));
  }

  function updateNutritionHydration(entryId: string, patch: Partial<NutritionHydrationDraft>) {
    setWorkspace((current) => {
      const entry = current.nutritionHydrationEntries.find((candidate) => candidate.id === entryId);
      const updated = entry ? patchNutritionHydration(entry, patch) : null;
      return updated ? { ...current, nutritionHydrationEntries: current.nutritionHydrationEntries.map((candidate) => candidate.id === entryId ? updated : candidate) } : current;
    });
  }

  function deleteNutritionHydration(entryId: string) {
    setWorkspace((current) => ({ ...current, nutritionHydrationEntries: current.nutritionHydrationEntries.filter((entry) => entry.id !== entryId) }));
  }

  function generateNutritionShopping(startDate: string, endDate: string, replaceListId?: string) {
    setWorkspace((current) => {
      const list = generateNutritionShoppingList(startDate, endDate, current.nutritionPlanItems, current.nutritionFoods, current.nutritionRecipes);
      if (!list) return current;
      return {
        ...current,
        nutritionShoppingLists: replaceListId
          ? current.nutritionShoppingLists.map((candidate) => candidate.id === replaceListId ? { ...list, id: candidate.id, createdAt: candidate.createdAt } : candidate)
          : [list, ...current.nutritionShoppingLists],
      };
    });
  }

  function addNutritionShoppingItem(listId: string, draft: NutritionShoppingItemDraft) {
    const item = createNutritionShoppingItem(draft);
    if (!item) return;
    setWorkspace((current) => ({
      ...current,
      nutritionShoppingLists: current.nutritionShoppingLists.map((list) => list.id === listId ? { ...list, items: [...list.items, item], updatedAt: new Date().toISOString() } : list),
    }));
  }

  function updateNutritionShoppingItem(listId: string, itemId: string, patch: Partial<NutritionShoppingItemDraft>) {
    setWorkspace((current) => ({
      ...current,
      nutritionShoppingLists: current.nutritionShoppingLists.map((list) => {
        if (list.id !== listId) return list;
        const item = list.items.find((candidate) => candidate.id === itemId);
        const updated = item ? patchNutritionShoppingItem(item, patch) : null;
        return updated ? { ...list, items: list.items.map((candidate) => candidate.id === itemId ? updated : candidate), updatedAt: new Date().toISOString() } : list;
      }),
    }));
  }

  function deleteNutritionShoppingItem(listId: string, itemId: string) {
    setWorkspace((current) => ({ ...current, nutritionShoppingLists: current.nutritionShoppingLists.map((list) => list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId), updatedAt: new Date().toISOString() } : list) }));
  }

  function deleteNutritionShoppingList(listId: string) {
    setWorkspace((current) => ({ ...current, nutritionShoppingLists: current.nutritionShoppingLists.filter((list) => list.id !== listId) }));
  }

  function addIdealDayGoal(draft: IdealDayGoalDraft) {
    const goal = createIdealDayGoal(draft);
    if (!goal) return false;
    setWorkspace((current) => ({ ...current, idealDayGoals: [...current.idealDayGoals, goal] }));
    return true;
  }

  function reuseIdealDayGoals(date: string, goalIds: string[]) {
    setWorkspace((current) => {
      const copies = copyIdealDayGoals(current.idealDayGoals, goalIds, date);
      return copies.length ? { ...current, idealDayGoals: [...current.idealDayGoals, ...copies] } : current;
    });
  }

  function updateIdealDayGoal(goalId: string, patch: Partial<Pick<IdealDayGoal, "title" | "notes" | "completed">>) {
    setWorkspace((current) => {
      const goal = current.idealDayGoals.find((item) => item.id === goalId);
      const updated = goal ? patchIdealDayGoal(goal, patch) : null;
      return updated ? {
        ...current,
        idealDayGoals: current.idealDayGoals.map((item) => item.id === goalId ? updated : item),
      } : current;
    });
  }

  function deleteIdealDayGoal(goalId: string) {
    setWorkspace((current) => ({ ...current, idealDayGoals: current.idealDayGoals.filter((item) => item.id !== goalId) }));
  }

  function addLocationEntry(draft: LocationEntryDraft) {
    const entry = createLocationEntry(draft);
    if (entry) {
      setWorkspace((current) => ({
        ...current,
        locationEntries: [...current.locationEntries, entry],
      }));
    }
  }

  function updateLocationEntry(entryId: string, patch: Partial<LocationEntryDraft>) {
    setWorkspace((current) => {
      const entry = current.locationEntries.find((candidate) => candidate.id === entryId);
      const updated = entry ? patchLocationEntry(entry, patch) : null;
      return updated
        ? {
            ...current,
            locationEntries: current.locationEntries.map((candidate) =>
              candidate.id === entryId ? updated : candidate,
            ),
          }
        : current;
    });
  }

  function deleteLocationEntry(entryId: string) {
    setWorkspace((current) => ({
      ...current,
      locationEntries: current.locationEntries.filter((entry) => entry.id !== entryId),
    }));
  }

  function getNutritionSummary(date: string) {
    return getNutritionDailySummary(date, workspace.nutritionPlanItems, workspace.nutritionIntakeEntries, workspace.nutritionHydrationEntries, workspace.nutritionFoods, workspace.nutritionRecipes);
  }

  function getTasksForSubject(subjectId: string) {
    return getSubjectTasks(workspace.tasks, workspace.subjects, subjectId, true);
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
    ...otherData,
    finance,
    capture: {
      entries: inboxEntries,
      errors: suggestionErrors,
      addEntry: (result: CaptureResult) => addTask(captureDraft(result)),
      confirmEntry: acceptCapture,
      discardEntry: discardCapture,
    },
    ...sync,
    today,
    planning: {
      views,
      addTask,
      addReviewedTask: (draft: TaskDraft) => addTask(draft, true),
      patchTask,
      assignTaskSubjects,
      setTaskStatus,
      setTaskPriority,
      deleteTask,
      getAvailableParentTasksForTask,
      getTasksForSubject,
    },
    nutritionTodaySummary,
    nutritionCurrentWeekPlan,
    orderedExpectations,
    addExpectation,
    updateExpectation,
    updateExpectationStatus,
    deleteExpectation,
    addSubject,
    renameSubject,
    setSubjectHorizon,
    setSubjectParent,
    deleteSubject,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    addPhase,
    patchPhase,
    movePhase,
    deletePhase,
    addSubjectEvent,
    updateSubjectEvent,
    deleteSubjectEvent,
    updateNutritionProfile,
    addNutritionFood,
    updateNutritionFood,
    deleteNutritionFood,
    addNutritionRecipe,
    updateNutritionRecipe,
    deleteNutritionRecipe,
    addNutritionPlanItem,
    updateNutritionPlanItem,
    copyNutritionPlanItem,
    deleteNutritionPlanItem,
    consumeNutritionPlanItem,
    addNutritionIntake,
    updateNutritionIntake,
    deleteNutritionIntake,
    addNutritionHydration,
    updateNutritionHydration,
    deleteNutritionHydration,
    generateNutritionShopping,
    addNutritionShoppingItem,
    updateNutritionShoppingItem,
    deleteNutritionShoppingItem,
    deleteNutritionShoppingList,
    addLocationEntry,
    addIdealDayGoal,
    reuseIdealDayGoals,
    updateIdealDayGoal,
    deleteIdealDayGoal,
    updateLocationEntry,
    deleteLocationEntry,
    getNutritionSummary,
    getAvailableParentSubjects,
  };
}

export type TaskWorkspace = ReturnType<typeof useTaskWorkspace>;
export type { Subject, SubjectDeliverable, SubjectEvent, SubjectPhase, Task };
