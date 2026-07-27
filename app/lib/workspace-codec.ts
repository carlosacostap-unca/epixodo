import {
  emptyWorkspace,
  isSubjectEventKind,
  isValidDateOnly,
  normalizeTaskAiSuggestion,
  type Subject,
  type Expectation,
  type SubjectEvent,
  type SubjectPhase,
  type SubjectHorizon,
  type Task,
  type WorkspaceData,
} from "./tasks";
import { normalizePhaseOrder } from "./tasks";
import {
  isCurrencyCode,
  isFinanceAccountType,
  isFinanceDuePaymentStatus,
  isFinanceEntryKind,
  type FinanceAccount,
  type FinanceDuePayment,
  type FinanceEntry,
} from "./finance";
import {
  isMealType,
  isNutritionSourceType,
  isNutritionUnit,
  isSafeNonNegativeInteger,
  isSafePositiveInteger,
  type NutrientTotals,
  type NutritionFood,
  type NutritionHydrationEntry,
  type NutritionIntakeEntry,
  type NutritionPlanItem,
  type NutritionProfile,
  type NutritionRecipe,
  type NutritionRecipeIngredient,
  type NutritionShoppingItem,
  type NutritionShoppingList,
} from "./nutrition";
import type { LocationEntry } from "./locations";

type LegacyProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type LegacyTask = Omit<Task, "subjectIds" | "parentTaskId" | "phaseId" | "aiSuggestion"> & {
  projectId?: string | null;
  subjectIds?: string[];
  parentTaskId?: string | null;
  phaseId?: string | null;
  aiSuggestion?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSubjectHorizon(value: unknown): value is SubjectHorizon {
  return value === "short" || value === "medium" || value === "long" || value === "none";
}

function toLocationEntry(value: unknown): LocationEntry | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    typeof value.startTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.startTime) ||
    typeof value.endTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.endTime) ||
    value.startTime >= value.endTime ||
    typeof value.plannedLocation !== "string" ||
    !value.plannedLocation.trim() ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;

  return {
    id: value.id,
    date: value.date,
    startTime: value.startTime,
    endTime: value.endTime,
    plannedLocation: repairMojibake(value.plannedLocation.trim()),
    actualLocation: typeof value.actualLocation === "string" ? repairMojibake(value.actualLocation.trim()) : "",
    notes: typeof value.notes === "string" ? repairMojibake(value.notes.trim()) : "",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function repairMojibake(value: string): string {
  return value.replace(/[ÃÂ][\u0080-\u00bf]/g, (sequence) => {
    const bytes = Uint8Array.from(Array.from(sequence, (character) => character.charCodeAt(0)));

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return sequence;
    }
  });
}

function uniqueStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === "string")));
}

function toTask(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.notes !== "string" ||
    typeof value.status !== "string" ||
    typeof value.priority !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  const legacy = value as LegacyTask;
  const subjectIds = uniqueStringIds(legacy.subjectIds);
  const legacyProjectId = typeof legacy.projectId === "string" ? legacy.projectId : null;

  return {
    id: legacy.id,
    title: repairMojibake(legacy.title),
    notes: repairMojibake(legacy.notes),
    status: legacy.status as Task["status"],
    subjectIds: subjectIds.length > 0 ? subjectIds : legacyProjectId ? [legacyProjectId] : [],
    phaseId: typeof legacy.phaseId === "string" ? legacy.phaseId : null,
    parentTaskId: typeof legacy.parentTaskId === "string" ? legacy.parentTaskId : null,
    hacerEl:
      "hacerEl" in legacy
        ? typeof legacy.hacerEl === "string" || legacy.hacerEl === null
          ? legacy.hacerEl
          : null
        : null,
    venceEl:
      "venceEl" in legacy
        ? typeof legacy.venceEl === "string" || legacy.venceEl === null
          ? legacy.venceEl
          : null
        : null,
    priority: legacy.priority as Task["priority"],
    aiSuggestion: normalizeTaskAiSuggestion(legacy.aiSuggestion),
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    completedAt:
      "completedAt" in legacy
        ? typeof legacy.completedAt === "string" || legacy.completedAt === null
          ? legacy.completedAt
          : null
        : null,
  };
}

function toDateOnly(value: unknown): string | null {
  return isValidDateOnly(value) ? value : null;
}

function toExpectation(value: unknown): Expectation | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string" ||
      !value.title.trim() || !isValidDateOnly(value.expectedDate) ||
      !(value.quantity === null || (Number.isSafeInteger(value.quantity) && (value.quantity as number) > 0)) ||
      !["pending", "occurred", "not_occurred"].includes(String(value.status)) ||
      typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null;
  return { id: value.id, title: repairMojibake(value.title.trim()),
    notes: typeof value.notes === "string" ? repairMojibake(value.notes.trim()) : "",
    expectedDate: value.expectedDate, quantity: value.quantity as number | null,
    source: typeof value.source === "string" ? repairMojibake(value.source.trim()) : "",
    status: value.status as Expectation["status"],
    resolvedAt: typeof value.resolvedAt === "string" ? value.resolvedAt : null,
    createdAt: value.createdAt, updatedAt: value.updatedAt };
}

function toSubjectEvent(value: unknown): SubjectEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.subjectId !== "string" ||
    !isSubjectEventKind(value.kind) ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !isValidDateOnly(value.date) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    phaseId: typeof value.phaseId === "string" ? value.phaseId : null,
    kind: value.kind,
    description: repairMojibake(value.description.trim()),
    date: value.date,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toSubjectPhase(value: unknown): SubjectPhase | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.subjectId !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    name: repairMojibake(value.name.trim()),
    plannedStart: toDateOnly(value.plannedStart),
    executedStart: toDateOnly(value.executedStart),
    plannedEnd: toDateOnly(value.plannedEnd),
    executedEnd: toDateOnly(value.executedEnd),
    order: typeof value.order === "number" && Number.isFinite(value.order) ? value.order : 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toSubject(value: unknown): Subject | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: repairMojibake(value.name),
    parentSubjectId: typeof value.parentSubjectId === "string" ? value.parentSubjectId : null,
    horizon: isSubjectHorizon(value.horizon) ? value.horizon : "none",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function legacyProjectToSubject(value: unknown): Subject | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  const project = value as LegacyProject;

  return {
    id: project.id,
    name: repairMojibake(project.name),
    parentSubjectId: null,
    horizon: "none",
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function normalizeWorkspaceData(value: unknown): WorkspaceData {
  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    return emptyWorkspace();
  }

  const subjects = Array.isArray(value.subjects)
    ? value.subjects.map(toSubject).filter((subject): subject is Subject => Boolean(subject))
    : Array.isArray(value.projects)
      ? value.projects
          .map(legacyProjectToSubject)
          .filter((subject): subject is Subject => Boolean(subject))
      : [];
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const phases = normalizePhaseOrder(
    (Array.isArray(value.phases) ? value.phases : [])
      .map(toSubjectPhase)
      .filter((phase): phase is SubjectPhase => Boolean(phase))
      .filter((phase) => subjectIds.has(phase.subjectId)),
  );
  const phasesById = new Map(phases.map((phase) => [phase.id, phase]));
  const subjectEvents = (Array.isArray(value.subjectEvents) ? value.subjectEvents : [])
    .map(toSubjectEvent)
    .filter((event): event is SubjectEvent => Boolean(event))
    .filter((event) => subjectIds.has(event.subjectId))
    .map((event) => {
      const phase = event.phaseId ? phasesById.get(event.phaseId) : null;

      return {
        ...event,
        phaseId: phase?.subjectId === event.subjectId ? phase.id : null,
      };
    });
  const taskIds = new Set<string>();
  const tasks = value.tasks
    .map(toTask)
    .filter((task): task is Task => Boolean(task))
    .map((task) => {
      taskIds.add(task.id);
      return {
        ...task,
        subjectIds: task.subjectIds.filter((id) => subjectIds.has(id)),
      };
    })
    .map((task) => ({
      ...task,
      parentTaskId: task.parentTaskId && taskIds.has(task.parentTaskId) ? task.parentTaskId : null,
    }))
    .map((task) => {
      const phase = task.phaseId ? phasesById.get(task.phaseId) : null;

      return {
        ...task,
        phaseId: phase && task.subjectIds.includes(phase.subjectId) ? phase.id : null,
      };
    });
  const expectations = (Array.isArray(value.expectations) ? value.expectations : [])
    .map(toExpectation)
    .filter((item): item is Expectation => Boolean(item));

  const financeAccounts = (Array.isArray(value.financeAccounts) ? value.financeAccounts : [])
    .map(toFinanceAccount)
    .filter((account): account is FinanceAccount => Boolean(account));
  const financeAccountIds = new Set(financeAccounts.map((account) => account.id));
  const financeEntries = (Array.isArray(value.financeEntries) ? value.financeEntries : [])
    .map(toFinanceEntry)
    .filter((entry): entry is FinanceEntry => Boolean(entry))
    .filter((entry) => financeAccountIds.has(entry.accountId));
  const financeDuePayments = (
    Array.isArray(value.financeDuePayments) ? value.financeDuePayments : []
  )
    .map(toFinanceDuePayment)
    .filter((payment): payment is FinanceDuePayment => Boolean(payment))
    .filter((payment) => financeAccountIds.has(payment.accountId));

  const nutritionProfile = toNutritionProfile(value.nutritionProfile);
  const nutritionFoods = (Array.isArray(value.nutritionFoods) ? value.nutritionFoods : [])
    .map(toNutritionFood)
    .filter((food): food is NutritionFood => Boolean(food));
  const nutritionFoodIds = new Set(nutritionFoods.map((food) => food.id));
  const nutritionRecipes = (Array.isArray(value.nutritionRecipes) ? value.nutritionRecipes : [])
    .map(toNutritionRecipe)
    .filter((recipe): recipe is NutritionRecipe => Boolean(recipe))
    .filter((recipe) => recipe.ingredients.every((ingredient) => nutritionFoodIds.has(ingredient.foodId)));
  const nutritionRecipeIds = new Set(nutritionRecipes.map((recipe) => recipe.id));
  const nutritionPlanItems = (Array.isArray(value.nutritionPlanItems) ? value.nutritionPlanItems : [])
    .map(toNutritionPlanItem)
    .filter((item): item is NutritionPlanItem => Boolean(item))
    .filter((item) =>
      item.sourceType === "food"
        ? nutritionFoodIds.has(item.sourceId)
        : nutritionRecipeIds.has(item.sourceId),
    );
  const nutritionIntakeEntries = (Array.isArray(value.nutritionIntakeEntries) ? value.nutritionIntakeEntries : [])
    .map(toNutritionIntakeEntry)
    .filter((entry): entry is NutritionIntakeEntry => Boolean(entry));
  const nutritionHydrationEntries = (Array.isArray(value.nutritionHydrationEntries) ? value.nutritionHydrationEntries : [])
    .map(toNutritionHydrationEntry)
    .filter((entry): entry is NutritionHydrationEntry => Boolean(entry));
  const nutritionShoppingLists = (Array.isArray(value.nutritionShoppingLists) ? value.nutritionShoppingLists : [])
    .map(toNutritionShoppingList)
    .filter((list): list is NutritionShoppingList => Boolean(list));
  const locationEntries = (Array.isArray(value.locationEntries) ? value.locationEntries : [])
    .map(toLocationEntry)
    .filter((entry): entry is LocationEntry => Boolean(entry));

  return {
    tasks,
    expectations,
    subjects,
    phases,
    subjectEvents,
    financeAccounts,
    financeEntries,
    financeDuePayments,
    nutritionProfile,
    nutritionFoods,
    nutritionRecipes,
    nutritionPlanItems,
    nutritionIntakeEntries,
    nutritionHydrationEntries,
    nutritionShoppingLists,
    locationEntries,
  };
}

export function parseWorkspaceJson(raw: string | null): WorkspaceData {
  if (!raw) {
    return emptyWorkspace();
  }

  try {
    return normalizeWorkspaceData(JSON.parse(raw));
  } catch {
    return emptyWorkspace();
  }
}

export function hasWorkspaceContent(workspace: WorkspaceData): boolean {
  return (
    workspace.tasks.length > 0 ||
    workspace.expectations.length > 0 ||
    workspace.subjects.length > 0 ||
    workspace.phases.length > 0 ||
    workspace.subjectEvents.length > 0 ||
    workspace.financeAccounts.length > 0 ||
    workspace.financeEntries.length > 0 ||
    workspace.financeDuePayments.length > 0 ||
    Boolean(workspace.nutritionProfile) ||
    workspace.nutritionFoods.length > 0 ||
    workspace.nutritionRecipes.length > 0 ||
    workspace.nutritionPlanItems.length > 0 ||
    workspace.nutritionIntakeEntries.length > 0 ||
    workspace.nutritionHydrationEntries.length > 0 ||
    workspace.nutritionShoppingLists.length > 0 ||
    workspace.locationEntries.length > 0
  );
}

function toFinanceAccount(value: unknown): FinanceAccount | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !isFinanceAccountType(value.type) ||
    !isCurrencyCode(value.currency) ||
    !Number.isSafeInteger(value.openingBalanceMinor) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: repairMojibake(value.name.trim()),
    type: value.type,
    currency: value.currency,
    openingBalanceMinor: value.openingBalanceMinor as number,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toFinanceEntry(value: unknown): FinanceEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.accountId !== "string" ||
    !isFinanceEntryKind(value.kind) ||
    !isValidDateOnly(value.date) ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !Number.isSafeInteger(value.amountMinor) ||
    (value.amountMinor as number) <= 0 ||
    (value.category !== undefined && typeof value.category !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    accountId: value.accountId,
    kind: value.kind,
    date: value.date,
    description: repairMojibake(value.description.trim()),
    amountMinor: value.amountMinor as number,
    category: typeof value.category === "string" ? repairMojibake(value.category.trim()) : "",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toFinanceDuePayment(value: unknown): FinanceDuePayment | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.accountId !== "string" ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !Number.isSafeInteger(value.amountMinor) ||
    (value.amountMinor as number) <= 0 ||
    !isValidDateOnly(value.dueDate) ||
    (value.category !== undefined && typeof value.category !== "string") ||
    !isFinanceDuePaymentStatus(value.status) ||
    (value.paidAt !== null && typeof value.paidAt !== "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;

  if ((value.status === "paid") !== (typeof value.paidAt === "string")) return null;

  return {
    id: value.id,
    accountId: value.accountId,
    description: repairMojibake(value.description.trim()),
    amountMinor: value.amountMinor as number,
    dueDate: value.dueDate,
    category: typeof value.category === "string" ? repairMojibake(value.category.trim()) : "",
    status: value.status,
    paidAt: value.paidAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toOptionalPositiveInteger(value: unknown): number | null | undefined {
  return value === null ? null : isSafePositiveInteger(value) ? value : undefined;
}

function toNutritionProfile(value: unknown): NutritionProfile | null {
  if (!isRecord(value)) return null;
  const energyGoalKcalMilli = toOptionalPositiveInteger(value.energyGoalKcalMilli);
  const proteinGoalGramsMilli = toOptionalPositiveInteger(value.proteinGoalGramsMilli);
  const carbsGoalGramsMilli = toOptionalPositiveInteger(value.carbsGoalGramsMilli);
  const fatGoalGramsMilli = toOptionalPositiveInteger(value.fatGoalGramsMilli);
  const fiberGoalGramsMilli = toOptionalPositiveInteger(value.fiberGoalGramsMilli);
  const waterGoalMl = toOptionalPositiveInteger(value.waterGoalMl);
  if (
    [energyGoalKcalMilli, proteinGoalGramsMilli, carbsGoalGramsMilli, fatGoalGramsMilli, fiberGoalGramsMilli, waterGoalMl].some(
      (goal) => goal === undefined,
    ) ||
    !Array.isArray(value.preferences) ||
    !Array.isArray(value.allergies) ||
    !Array.isArray(value.intolerances) ||
    typeof value.updatedAt !== "string"
  ) return null;
  return {
    energyGoalKcalMilli: energyGoalKcalMilli as number | null,
    proteinGoalGramsMilli: proteinGoalGramsMilli as number | null,
    carbsGoalGramsMilli: carbsGoalGramsMilli as number | null,
    fatGoalGramsMilli: fatGoalGramsMilli as number | null,
    fiberGoalGramsMilli: fiberGoalGramsMilli as number | null,
    waterGoalMl: waterGoalMl as number | null,
    preferences: uniqueStringIds(value.preferences).map(repairMojibake),
    allergies: uniqueStringIds(value.allergies).map(repairMojibake),
    intolerances: uniqueStringIds(value.intolerances).map(repairMojibake),
    updatedAt: value.updatedAt,
  };
}

function toNutrients(value: Record<string, unknown>): NutrientTotals | null {
  const result = {
    energyKcalMilli: value.energyKcalMilli,
    proteinGramsMilli: value.proteinGramsMilli,
    carbsGramsMilli: value.carbsGramsMilli,
    fatGramsMilli: value.fatGramsMilli,
    fiberGramsMilli: value.fiberGramsMilli,
  };
  if (!Object.values(result).every(isSafeNonNegativeInteger)) return null;
  return result as NutrientTotals;
}

function toNutritionFood(value: unknown): NutritionFood | null {
  if (!isRecord(value)) return null;
  const nutrients = toNutrients(value);
  if (
    !nutrients ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !isSafePositiveInteger(value.referenceQuantityMilli) ||
    !isNutritionUnit(value.unit) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  return {
    id: value.id,
    name: repairMojibake(value.name.trim()),
    referenceQuantityMilli: value.referenceQuantityMilli,
    unit: value.unit,
    ...nutrients,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toNutritionRecipeIngredient(value: unknown): NutritionRecipeIngredient | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.foodId !== "string" || !isSafePositiveInteger(value.quantityMilli)) return null;
  return { id: value.id, foodId: value.foodId, quantityMilli: value.quantityMilli };
}

function toNutritionRecipe(value: unknown): NutritionRecipe | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !isSafePositiveInteger(value.servingsMilli) ||
    !Array.isArray(value.ingredients) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  const ingredients = value.ingredients.map(toNutritionRecipeIngredient).filter((item): item is NutritionRecipeIngredient => Boolean(item));
  if (ingredients.length === 0 || ingredients.length !== value.ingredients.length) return null;
  return { id: value.id, name: repairMojibake(value.name.trim()), servingsMilli: value.servingsMilli, ingredients, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

function toNutritionPlanItem(value: unknown): NutritionPlanItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !isValidDateOnly(value.date) ||
    !isMealType(value.mealType) ||
    !isNutritionSourceType(value.sourceType) ||
    typeof value.sourceId !== "string" ||
    !isSafePositiveInteger(value.servingsMilli) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  return { id: value.id, date: value.date, mealType: value.mealType, sourceType: value.sourceType, sourceId: value.sourceId, servingsMilli: value.servingsMilli, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

function toNutritionIntakeEntry(value: unknown): NutritionIntakeEntry | null {
  if (!isRecord(value)) return null;
  const nutrients = toNutrients(value);
  if (
    !nutrients ||
    typeof value.id !== "string" ||
    !isValidDateOnly(value.date) ||
    !isMealType(value.mealType) ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !isSafePositiveInteger(value.quantityMilli) ||
    typeof value.unitLabel !== "string" ||
    !value.unitLabel.trim() ||
    !(value.sourceType === null || isNutritionSourceType(value.sourceType)) ||
    !(value.sourceId === null || typeof value.sourceId === "string") ||
    !(value.planItemId === null || typeof value.planItemId === "string") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  return {
    id: value.id,
    date: value.date,
    mealType: value.mealType,
    description: repairMojibake(value.description.trim()),
    quantityMilli: value.quantityMilli,
    unitLabel: repairMojibake(value.unitLabel.trim()),
    sourceType: value.sourceType,
    sourceId: value.sourceId,
    planItemId: value.planItemId,
    ...nutrients,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toNutritionHydrationEntry(value: unknown): NutritionHydrationEntry | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isValidDateOnly(value.date) || !isSafePositiveInteger(value.amountMl) || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null;
  return { id: value.id, date: value.date, amountMl: value.amountMl, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

function toNutritionShoppingItem(value: unknown): NutritionShoppingItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !(value.foodId === null || typeof value.foodId === "string") ||
    typeof value.label !== "string" ||
    !value.label.trim() ||
    !isSafePositiveInteger(value.quantityMilli) ||
    !isNutritionUnit(value.unit) ||
    typeof value.checked !== "boolean" ||
    typeof value.manual !== "boolean"
  ) return null;
  return { id: value.id, foodId: value.foodId, label: repairMojibake(value.label.trim()), quantityMilli: value.quantityMilli, unit: value.unit, checked: value.checked, manual: value.manual };
}

function toNutritionShoppingList(value: unknown): NutritionShoppingList | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !isValidDateOnly(value.startDate) ||
    !isValidDateOnly(value.endDate) ||
    value.endDate < value.startDate ||
    !Array.isArray(value.items) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) return null;
  const items = value.items.map(toNutritionShoppingItem).filter((item): item is NutritionShoppingItem => Boolean(item));
  return { id: value.id, name: repairMojibake(value.name.trim()), startDate: value.startDate, endDate: value.endDate, items, createdAt: value.createdAt, updatedAt: value.updatedAt };
}
