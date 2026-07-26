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
import {
  createFinanceAccount,
  createFinanceDuePayment,
  createFinanceEntry,
  getAccountBalanceMinor,
  getFinanceDuePaymentUrgency,
  getFinanceCurrencySummaries,
  patchFinanceAccount,
  patchFinanceDuePayment,
  patchFinanceEntry,
  removeFinanceAccount,
  setFinanceDuePaymentStatus,
  sortedFinanceDuePayments,
  sortedFinanceEntries,
  type FinanceAccountDraft,
  type FinanceDuePaymentDraft,
  type FinanceDuePaymentStatus,
  type FinanceEntryDraft,
} from "../lib/finance";
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
        localWorkspace.subjectEvents.length > 0 ||
        localWorkspace.financeAccounts.length > 0 ||
        localWorkspace.financeEntries.length > 0 ||
        localWorkspace.financeDuePayments.length > 0 ||
        Boolean(localWorkspace.nutritionProfile) ||
        localWorkspace.nutritionFoods.length > 0 ||
        localWorkspace.nutritionRecipes.length > 0 ||
        localWorkspace.nutritionPlanItems.length > 0 ||
        localWorkspace.nutritionIntakeEntries.length > 0 ||
        localWorkspace.nutritionHydrationEntries.length > 0 ||
        localWorkspace.nutritionShoppingLists.length > 0 ||
        localWorkspace.locationEntries.length > 0
      ) {
        setWorkspace(localWorkspace);
      }

      try {
        const remoteWorkspace = await loadRemoteWorkspace();
        const hasRemoteData =
          remoteWorkspace.tasks.length > 0 ||
          remoteWorkspace.subjects.length > 0 ||
          remoteWorkspace.phases.length > 0 ||
          remoteWorkspace.subjectEvents.length > 0 ||
          remoteWorkspace.financeAccounts.length > 0 ||
          remoteWorkspace.financeEntries.length > 0 ||
          remoteWorkspace.financeDuePayments.length > 0 ||
          Boolean(remoteWorkspace.nutritionProfile) ||
          remoteWorkspace.nutritionFoods.length > 0 ||
          remoteWorkspace.nutritionRecipes.length > 0 ||
          remoteWorkspace.nutritionPlanItems.length > 0 ||
          remoteWorkspace.nutritionIntakeEntries.length > 0 ||
          remoteWorkspace.nutritionHydrationEntries.length > 0 ||
          remoteWorkspace.nutritionShoppingLists.length > 0 ||
          remoteWorkspace.locationEntries.length > 0;
        const hasLocalData =
          localWorkspace.tasks.length > 0 ||
          localWorkspace.subjects.length > 0 ||
          localWorkspace.phases.length > 0 ||
          localWorkspace.subjectEvents.length > 0 ||
          localWorkspace.financeAccounts.length > 0 ||
          localWorkspace.financeEntries.length > 0 ||
          localWorkspace.financeDuePayments.length > 0 ||
          Boolean(localWorkspace.nutritionProfile) ||
          localWorkspace.nutritionFoods.length > 0 ||
          localWorkspace.nutritionRecipes.length > 0 ||
          localWorkspace.nutritionPlanItems.length > 0 ||
          localWorkspace.nutritionIntakeEntries.length > 0 ||
          localWorkspace.nutritionHydrationEntries.length > 0 ||
          localWorkspace.nutritionShoppingLists.length > 0 ||
          localWorkspace.locationEntries.length > 0;
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

  const financeBalances = useMemo(
    () =>
      new Map(
        workspace.financeAccounts.map((account) => [
          account.id,
          getAccountBalanceMinor(account, workspace.financeEntries),
        ]),
      ),
    [workspace.financeAccounts, workspace.financeEntries],
  );
  const financeSummaries = useMemo(
    () =>
      getFinanceCurrencySummaries(
        workspace.financeAccounts,
        workspace.financeEntries,
        today.slice(0, 7),
      ),
    [today, workspace.financeAccounts, workspace.financeEntries],
  );
  const recentFinanceEntries = useMemo(
    () => sortedFinanceEntries(workspace.financeEntries),
    [workspace.financeEntries],
  );
  const orderedFinanceDuePayments = useMemo(
    () => sortedFinanceDuePayments(workspace.financeDuePayments),
    [workspace.financeDuePayments],
  );
  const financeDuePaymentCounts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    for (const payment of workspace.financeDuePayments) {
      if (payment.status !== "pending") continue;
      pending += 1;
      if (getFinanceDuePaymentUrgency(payment, today) === "overdue") overdue += 1;
    }
    return { pending, overdue };
  }, [today, workspace.financeDuePayments]);
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

  function addFinanceAccount(draft: FinanceAccountDraft) {
    const account = createFinanceAccount(draft);
    if (!account) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      financeAccounts: [...current.financeAccounts, account],
    }));
  }

  function updateFinanceAccount(accountId: string, patch: Partial<FinanceAccountDraft>) {
    setWorkspace((current) => {
      const account = current.financeAccounts.find((item) => item.id === accountId);
      if (!account) {
        return current;
      }

      const updated = patchFinanceAccount(
        account,
        patch,
        current.financeEntries.some((entry) => entry.accountId === accountId),
      );
      if (!updated) {
        return current;
      }

      return {
        ...current,
        financeAccounts: current.financeAccounts.map((item) =>
          item.id === accountId ? updated : item,
        ),
      };
    });
  }

  function deleteFinanceAccount(accountId: string) {
    setWorkspace((current) => {
      const removed = removeFinanceAccount(
        current.financeAccounts,
        current.financeEntries,
        accountId,
        current.financeDuePayments,
      );
      return {
        ...current,
        financeAccounts: removed.accounts,
        financeEntries: removed.entries,
        financeDuePayments: removed.duePayments,
      };
    });
  }

  function addFinanceEntry(draft: FinanceEntryDraft) {
    setWorkspace((current) => {
      const entry = createFinanceEntry(
        draft,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return entry
        ? { ...current, financeEntries: [...current.financeEntries, entry] }
        : current;
    });
  }

  function updateFinanceEntry(entryId: string, patch: Partial<FinanceEntryDraft>) {
    setWorkspace((current) => {
      const entry = current.financeEntries.find((item) => item.id === entryId);
      if (!entry) {
        return current;
      }

      const updated = patchFinanceEntry(
        entry,
        patch,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return updated
        ? {
            ...current,
            financeEntries: current.financeEntries.map((item) =>
              item.id === entryId ? updated : item,
            ),
          }
        : current;
    });
  }

  function deleteFinanceEntry(entryId: string) {
    setWorkspace((current) => ({
      ...current,
      financeEntries: current.financeEntries.filter((entry) => entry.id !== entryId),
    }));
  }

  function addFinanceDuePayment(draft: FinanceDuePaymentDraft) {
    setWorkspace((current) => {
      const payment = createFinanceDuePayment(
        draft,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return payment
        ? { ...current, financeDuePayments: [...current.financeDuePayments, payment] }
        : current;
    });
  }

  function updateFinanceDuePayment(
    paymentId: string,
    patch: Partial<FinanceDuePaymentDraft>,
  ) {
    setWorkspace((current) => {
      const payment = current.financeDuePayments.find((item) => item.id === paymentId);
      if (!payment) return current;
      const updated = patchFinanceDuePayment(
        payment,
        patch,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return updated
        ? {
            ...current,
            financeDuePayments: current.financeDuePayments.map((item) =>
              item.id === paymentId ? updated : item,
            ),
          }
        : current;
    });
  }

  function setFinanceDuePaymentState(paymentId: string, status: FinanceDuePaymentStatus) {
    setWorkspace((current) => ({
      ...current,
      financeDuePayments: current.financeDuePayments.map((payment) =>
        payment.id === paymentId ? setFinanceDuePaymentStatus(payment, status) : payment,
      ),
    }));
  }

  function deleteFinanceDuePayment(paymentId: string) {
    setWorkspace((current) => ({
      ...current,
      financeDuePayments: current.financeDuePayments.filter(
        (payment) => payment.id !== paymentId,
      ),
    }));
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
    financeBalances,
    financeSummaries,
    recentFinanceEntries,
    orderedFinanceDuePayments,
    financeDuePaymentCounts,
    nutritionTodaySummary,
    nutritionCurrentWeekPlan,
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
    addFinanceAccount,
    updateFinanceAccount,
    deleteFinanceAccount,
    addFinanceEntry,
    updateFinanceEntry,
    deleteFinanceEntry,
    addFinanceDuePayment,
    updateFinanceDuePayment,
    setFinanceDuePaymentState,
    deleteFinanceDuePayment,
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
    updateLocationEntry,
    deleteLocationEntry,
    getNutritionSummary,
    getTasksForSubject,
    getAvailableParentTasksForTask,
    getAvailableParentSubjects,
  };
}

export type TaskWorkspace = ReturnType<typeof useTaskWorkspace>;
export type { Subject, SubjectEvent, SubjectPhase, Task };
