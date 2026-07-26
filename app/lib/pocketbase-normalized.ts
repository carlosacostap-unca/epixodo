import type { WorkspaceData } from "./tasks";

type RequestOptions = { method?: string; body?: unknown; auth?: boolean };
export type PocketBaseRequester = <T>(path: string, options?: RequestOptions) => Promise<T>;

type RecordData = Record<string, unknown> & {
  id: string;
  client_id: string;
  created: string;
  updated: string;
};

type RecordList = { page: number; totalPages: number; items: RecordData[] };

const collections = {
  subjects: "subjects",
  phases: "subject_phases",
  tasks: "tasks",
  taskSubjects: "task_subjects",
  events: "subject_events",
  financeAccounts: "finance_accounts",
  financeEntries: "finance_entries",
  financeDuePayments: "finance_due_payments",
  nutritionProfiles: "nutrition_profiles",
  nutritionFoods: "nutrition_foods",
  nutritionRecipes: "nutrition_recipes",
  nutritionIngredients: "nutrition_recipe_ingredients",
  nutritionPlanItems: "nutrition_plan_items",
  nutritionIntakeEntries: "nutrition_intake_entries",
  nutritionHydrationEntries: "nutrition_hydration_entries",
  nutritionShoppingLists: "nutrition_shopping_lists",
  nutritionShoppingItems: "nutrition_shopping_items",
  locations: "location_entries",
} as const;

function quoteFilter(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

function text(record: RecordData, field: string) {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function optionalText(record: RecordData, field: string) {
  return text(record, field) || null;
}

function integer(record: RecordData, field: string) {
  const value = record[field];
  return typeof value === "number" && Number.isSafeInteger(value) ? value : 0;
}

function boolean(record: RecordData, field: string) {
  return record[field] === true;
}

function relation(record: RecordData, field: string) {
  return text(record, field);
}

function clientCreatedAt(record: RecordData) {
  return toIso(text(record, "client_created_at") || record.created);
}

function clientUpdatedAt(record: RecordData) {
  return toIso(text(record, "client_updated_at") || record.updated);
}

function toIso(value: string) {
  if (!value) return "";
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString();
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function listOwnedRecords(
  request: PocketBaseRequester,
  collection: string,
  ownerId: string,
) {
  if (!ownerId) throw new Error("An authenticated owner id is required.");
  const items: RecordData[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const filter = encodeURIComponent(`owner = "${quoteFilter(ownerId)}"`);
    const result = await request<RecordList>(
      `/api/collections/${encodeURIComponent(collection)}/records?page=${page}&perPage=200&filter=${filter}`,
    );
    items.push(...result.items);
    totalPages = result.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

async function loadAll(request: PocketBaseRequester, ownerId: string) {
  const entries = await Promise.all(
    Object.entries(collections).map(async ([key, collection]) => [
      key,
      await listOwnedRecords(request, collection, ownerId),
    ] as const),
  );
  return Object.fromEntries(entries) as Record<keyof typeof collections, RecordData[]>;
}

export async function hasVerifiedMigration(request: PocketBaseRequester, ownerId: string) {
  const filter = encodeURIComponent(
    `owner = "${quoteFilter(ownerId)}" && migration_status = "verified"`,
  );
  const result = await request<{ items?: RecordData[] }>(
    `/api/collections/workspace_migrations/records?perPage=1&filter=${filter}`,
  );
  return Boolean(result.items?.length);
}

export async function getNormalizedWorkspace(
  request: PocketBaseRequester,
  ownerId: string,
): Promise<WorkspaceData> {
  const data = await loadAll(request, ownerId);
  const clientIdByRecordId = new Map<string, string>();
  for (const records of Object.values(data)) {
    for (const record of records) clientIdByRecordId.set(record.id, record.client_id);
  }

  const taskSubjects = new Map<string, string[]>();
  for (const join of data.taskSubjects) {
    const taskId = relation(join, "task");
    const subjectClientId = clientIdByRecordId.get(relation(join, "subject"));
    if (!taskId || !subjectClientId) continue;
    const current = taskSubjects.get(taskId) ?? [];
    current.push(subjectClientId);
    taskSubjects.set(taskId, current);
  }

  const ingredientsByRecipe = new Map<string, RecordData[]>();
  for (const ingredient of data.nutritionIngredients) {
    const recipeId = relation(ingredient, "recipe");
    const current = ingredientsByRecipe.get(recipeId) ?? [];
    current.push(ingredient);
    ingredientsByRecipe.set(recipeId, current);
  }

  const shoppingItemsByList = new Map<string, RecordData[]>();
  for (const item of data.nutritionShoppingItems) {
    const listId = relation(item, "shopping_list");
    const current = shoppingItemsByList.get(listId) ?? [];
    current.push(item);
    shoppingItemsByList.set(listId, current);
  }

  const profileRecord = data.nutritionProfiles[0];
  const nutritionProfile = profileRecord
    ? {
        energyGoalKcalMilli: optionalInteger(profileRecord, "energy_goal_kcal_milli"),
        proteinGoalGramsMilli: optionalInteger(profileRecord, "protein_goal_grams_milli"),
        carbsGoalGramsMilli: optionalInteger(profileRecord, "carbs_goal_grams_milli"),
        fatGoalGramsMilli: optionalInteger(profileRecord, "fat_goal_grams_milli"),
        fiberGoalGramsMilli: optionalInteger(profileRecord, "fiber_goal_grams_milli"),
        waterGoalMl: optionalInteger(profileRecord, "water_goal_ml"),
        preferences: asStringArray(profileRecord.preferences),
        allergies: asStringArray(profileRecord.allergies),
        intolerances: asStringArray(profileRecord.intolerances),
        updatedAt: clientUpdatedAt(profileRecord),
      }
    : null;

  return {
    subjects: data.subjects.map((record) => ({
      id: record.client_id,
      name: text(record, "name"),
      parentSubjectId: clientIdByRecordId.get(relation(record, "parent")) ?? null,
      horizon: text(record, "horizon") as WorkspaceData["subjects"][number]["horizon"],
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    phases: data.phases.map((record) => ({
      id: record.client_id,
      subjectId: clientIdByRecordId.get(relation(record, "subject")) ?? "",
      name: text(record, "name"),
      plannedStart: optionalText(record, "planned_start"),
      executedStart: optionalText(record, "executed_start"),
      plannedEnd: optionalText(record, "planned_end"),
      executedEnd: optionalText(record, "executed_end"),
      order: integer(record, "position"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    subjectEvents: data.events.map((record) => ({
      id: record.client_id,
      subjectId: clientIdByRecordId.get(relation(record, "subject")) ?? "",
      phaseId: clientIdByRecordId.get(relation(record, "phase")) ?? null,
      kind: text(record, "kind") as WorkspaceData["subjectEvents"][number]["kind"],
      description: text(record, "description"),
      date: text(record, "event_date"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    tasks: data.tasks.map((record) => ({
      id: record.client_id,
      title: text(record, "title"),
      notes: text(record, "notes"),
      status: text(record, "status") as WorkspaceData["tasks"][number]["status"],
      subjectIds: (taskSubjects.get(record.id) ?? []).sort(),
      phaseId: clientIdByRecordId.get(relation(record, "phase")) ?? null,
      parentTaskId: clientIdByRecordId.get(relation(record, "parent")) ?? null,
      hacerEl: optionalText(record, "do_on"),
      venceEl: optionalText(record, "due_on"),
      priority: text(record, "priority") as WorkspaceData["tasks"][number]["priority"],
      completedAt: optionalText(record, "completed_at")
        ? toIso(text(record, "completed_at"))
        : null,
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    financeAccounts: data.financeAccounts.map((record) => ({
      id: record.client_id,
      name: text(record, "name"),
      type: text(record, "account_type") as WorkspaceData["financeAccounts"][number]["type"],
      currency: text(record, "currency"),
      openingBalanceMinor: integer(record, "opening_balance_minor"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    financeEntries: data.financeEntries.map((record) => ({
      id: record.client_id,
      accountId: clientIdByRecordId.get(relation(record, "account")) ?? "",
      kind: text(record, "entry_kind") as WorkspaceData["financeEntries"][number]["kind"],
      date: text(record, "entry_date"),
      description: text(record, "description"),
      amountMinor: integer(record, "amount_minor"),
      category: text(record, "category"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    financeDuePayments: data.financeDuePayments.map((record) => ({
      id: record.client_id,
      accountId: clientIdByRecordId.get(relation(record, "account")) ?? "",
      description: text(record, "description"),
      amountMinor: integer(record, "amount_minor"),
      dueDate: text(record, "due_date"),
      category: text(record, "category"),
      status: text(record, "payment_status") as WorkspaceData["financeDuePayments"][number]["status"],
      paidAt: optionalText(record, "paid_at") ? toIso(text(record, "paid_at")) : null,
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    nutritionProfile,
    nutritionFoods: data.nutritionFoods.map((record) => ({
      id: record.client_id,
      name: text(record, "name"),
      referenceQuantityMilli: integer(record, "reference_quantity_milli"),
      unit: text(record, "unit") as WorkspaceData["nutritionFoods"][number]["unit"],
      ...nutrientsFromRecord(record),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    nutritionRecipes: data.nutritionRecipes.map((record) => ({
      id: record.client_id,
      name: text(record, "name"),
      servingsMilli: integer(record, "servings_milli"),
      ingredients: (ingredientsByRecipe.get(record.id) ?? [])
        .sort((a, b) => integer(a, "position") - integer(b, "position"))
        .map((ingredient) => ({
          id: ingredient.client_id,
          foodId: clientIdByRecordId.get(relation(ingredient, "food")) ?? "",
          quantityMilli: integer(ingredient, "quantity_milli"),
        })),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    nutritionPlanItems: data.nutritionPlanItems.map((record) => {
      const foodId = clientIdByRecordId.get(relation(record, "food"));
      return {
        id: record.client_id,
        date: text(record, "plan_date"),
        mealType: text(record, "meal_type") as WorkspaceData["nutritionPlanItems"][number]["mealType"],
        sourceType: foodId ? "food" as const : "recipe" as const,
        sourceId: foodId ?? clientIdByRecordId.get(relation(record, "recipe")) ?? "",
        servingsMilli: integer(record, "servings_milli"),
        createdAt: clientCreatedAt(record),
        updatedAt: clientUpdatedAt(record),
      };
    }),
    nutritionIntakeEntries: data.nutritionIntakeEntries.map((record) => {
      const foodId = clientIdByRecordId.get(relation(record, "food"));
      const recipeId = clientIdByRecordId.get(relation(record, "recipe"));
      return {
        id: record.client_id,
        date: text(record, "intake_date"),
        mealType: text(record, "meal_type") as WorkspaceData["nutritionIntakeEntries"][number]["mealType"],
        description: text(record, "description"),
        quantityMilli: integer(record, "quantity_milli"),
        unitLabel: text(record, "unit_label"),
        ...nutrientsFromRecord(record),
        sourceType: foodId ? "food" as const : recipeId ? "recipe" as const : null,
        sourceId: foodId ?? recipeId ?? null,
        planItemId: clientIdByRecordId.get(relation(record, "plan_item")) ?? null,
        createdAt: clientCreatedAt(record),
        updatedAt: clientUpdatedAt(record),
      };
    }),
    nutritionHydrationEntries: data.nutritionHydrationEntries.map((record) => ({
      id: record.client_id,
      date: text(record, "entry_date"),
      amountMl: integer(record, "amount_ml"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    nutritionShoppingLists: data.nutritionShoppingLists.map((record) => ({
      id: record.client_id,
      name: text(record, "name"),
      startDate: text(record, "start_date"),
      endDate: text(record, "end_date"),
      items: (shoppingItemsByList.get(record.id) ?? [])
        .sort((a, b) => integer(a, "position") - integer(b, "position"))
        .map((item) => ({
          id: item.client_id.slice(record.client_id.length + 2),
          foodId: clientIdByRecordId.get(relation(item, "food")) ?? null,
          label: text(item, "label"),
          quantityMilli: integer(item, "quantity_milli"),
          unit: text(item, "unit") as WorkspaceData["nutritionShoppingLists"][number]["items"][number]["unit"],
          checked: boolean(item, "checked"),
          manual: boolean(item, "manual"),
        })),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
    locationEntries: data.locations.map((record) => ({
      id: record.client_id,
      date: text(record, "entry_date"),
      startTime: text(record, "start_time"),
      endTime: text(record, "end_time"),
      plannedLocation: text(record, "planned_location"),
      actualLocation: text(record, "actual_location"),
      notes: text(record, "notes"),
      createdAt: clientCreatedAt(record),
      updatedAt: clientUpdatedAt(record),
    })),
  };
}

function optionalInteger(record: RecordData, field: string) {
  const value = record[field];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function nutrientsFromRecord(record: RecordData) {
  return {
    energyKcalMilli: integer(record, "energy_kcal_milli"),
    proteinGramsMilli: integer(record, "protein_grams_milli"),
    carbsGramsMilli: integer(record, "carbs_grams_milli"),
    fatGramsMilli: integer(record, "fat_grams_milli"),
    fiberGramsMilli: integer(record, "fiber_grams_milli"),
  };
}

type DesiredRow = { client_id: string; [key: string]: unknown };

async function upsertRows(
  request: PocketBaseRequester,
  collection: string,
  ownerId: string,
  rows: DesiredRow[],
) {
  const existing = await listOwnedRecords(request, collection, ownerId);
  const existingByClientId = new Map(existing.map((record) => [record.client_id, record]));
  const records: RecordData[] = [];
  for (const row of rows) {
    const current = existingByClientId.get(row.client_id);
    const body = { owner: ownerId, ...row };
    const record = current
      ? await request<RecordData>(
          `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(current.id)}`,
          { method: "PATCH", body },
        )
      : await request<RecordData>(`/api/collections/${encodeURIComponent(collection)}/records`, {
          method: "POST",
          body,
        });
    records.push(record);
  }
  return { records, stale: existing.filter((record) => !rows.some((row) => row.client_id === record.client_id)) };
}

function recordMap(records: RecordData[]) {
  return new Map(records.map((record) => [record.client_id, record.id]));
}

function stamps(value: { createdAt?: string; updatedAt: string }) {
  return {
    client_created_at: value.createdAt,
    client_updated_at: value.updatedAt,
  };
}

function nutrientRow(value: {
  energyKcalMilli: number;
  proteinGramsMilli: number;
  carbsGramsMilli: number;
  fatGramsMilli: number;
  fiberGramsMilli: number;
}) {
  return {
    energy_kcal_milli: value.energyKcalMilli,
    protein_grams_milli: value.proteinGramsMilli,
    carbs_grams_milli: value.carbsGramsMilli,
    fat_grams_milli: value.fatGramsMilli,
    fiber_grams_milli: value.fiberGramsMilli,
  };
}

export async function saveNormalizedWorkspace(
  request: PocketBaseRequester,
  ownerId: string,
  workspace: WorkspaceData,
) {
  if (!ownerId) throw new Error("An authenticated owner id is required.");
  const staleByCollection = new Map<string, RecordData[]>();
  const remember = (collection: string, stale: RecordData[]) => staleByCollection.set(collection, stale);

  let result = await upsertRows(
    request,
    collections.subjects,
    ownerId,
    workspace.subjects.map((subject) => ({
      client_id: subject.id,
      name: subject.name,
      horizon: subject.horizon,
      ...stamps(subject),
    })),
  );
  remember(collections.subjects, result.stale);
  let subjects = recordMap(result.records);
  result = await upsertRows(
    request,
    collections.subjects,
    ownerId,
    workspace.subjects.map((subject) => ({
      client_id: subject.id,
      name: subject.name,
      horizon: subject.horizon,
      parent: subject.parentSubjectId ? requireRelation(subjects, subject.parentSubjectId) : "",
      ...stamps(subject),
    })),
  );
  subjects = recordMap(result.records);

  result = await upsertRows(request, collections.phases, ownerId, workspace.phases.map((phase) => ({
    client_id: phase.id,
    subject: requireRelation(subjects, phase.subjectId),
    name: phase.name,
    planned_start: phase.plannedStart ?? "",
    executed_start: phase.executedStart ?? "",
    planned_end: phase.plannedEnd ?? "",
    executed_end: phase.executedEnd ?? "",
    position: phase.order,
    ...stamps(phase),
  })));
  remember(collections.phases, result.stale);
  const phases = recordMap(result.records);

  result = await upsertRows(request, collections.tasks, ownerId, workspace.tasks.map((task) => ({
    client_id: task.id,
    title: task.title,
    notes: task.notes,
    status: task.status,
    phase: task.phaseId ? requireRelation(phases, task.phaseId) : "",
    do_on: task.hacerEl ?? "",
    due_on: task.venceEl ?? "",
    priority: task.priority,
    completed_at: task.completedAt ?? "",
    ...stamps(task),
  })));
  remember(collections.tasks, result.stale);
  let tasks = recordMap(result.records);
  result = await upsertRows(request, collections.tasks, ownerId, workspace.tasks.map((task) => ({
    client_id: task.id,
    title: task.title,
    notes: task.notes,
    status: task.status,
    phase: task.phaseId ? requireRelation(phases, task.phaseId) : "",
    parent: task.parentTaskId ? requireRelation(tasks, task.parentTaskId) : "",
    do_on: task.hacerEl ?? "",
    due_on: task.venceEl ?? "",
    priority: task.priority,
    completed_at: task.completedAt ?? "",
    ...stamps(task),
  })));
  tasks = recordMap(result.records);

  result = await upsertRows(request, collections.taskSubjects, ownerId, workspace.tasks.flatMap((task) =>
    task.subjectIds.map((subjectId) => ({
      client_id: `${task.id}::${subjectId}`,
      task: requireRelation(tasks, task.id),
      subject: requireRelation(subjects, subjectId),
      ...stamps(task),
    })),
  ));
  remember(collections.taskSubjects, result.stale);

  result = await upsertRows(request, collections.events, ownerId, workspace.subjectEvents.map((event) => ({
    client_id: event.id,
    subject: requireRelation(subjects, event.subjectId),
    phase: event.phaseId ? requireRelation(phases, event.phaseId) : "",
    kind: event.kind,
    description: event.description,
    event_date: event.date,
    ...stamps(event),
  })));
  remember(collections.events, result.stale);

  result = await upsertRows(request, collections.financeAccounts, ownerId, workspace.financeAccounts.map((account) => ({
    client_id: account.id,
    name: account.name,
    account_type: account.type,
    currency: account.currency,
    opening_balance_minor: account.openingBalanceMinor,
    ...stamps(account),
  })));
  remember(collections.financeAccounts, result.stale);
  const accounts = recordMap(result.records);

  result = await upsertRows(request, collections.financeEntries, ownerId, workspace.financeEntries.map((entry) => ({
    client_id: entry.id,
    account: requireRelation(accounts, entry.accountId),
    entry_kind: entry.kind,
    entry_date: entry.date,
    description: entry.description,
    amount_minor: entry.amountMinor,
    category: entry.category,
    ...stamps(entry),
  })));
  remember(collections.financeEntries, result.stale);

  result = await upsertRows(request, collections.financeDuePayments, ownerId, workspace.financeDuePayments.map((payment) => ({
    client_id: payment.id,
    account: requireRelation(accounts, payment.accountId),
    description: payment.description,
    amount_minor: payment.amountMinor,
    due_date: payment.dueDate,
    category: payment.category,
    payment_status: payment.status,
    paid_at: payment.paidAt ?? "",
    ...stamps(payment),
  })));
  remember(collections.financeDuePayments, result.stale);

  result = await upsertRows(request, collections.nutritionProfiles, ownerId, workspace.nutritionProfile ? [{
    client_id: "profile",
    energy_goal_kcal_milli: workspace.nutritionProfile.energyGoalKcalMilli ?? -1,
    protein_goal_grams_milli: workspace.nutritionProfile.proteinGoalGramsMilli ?? -1,
    carbs_goal_grams_milli: workspace.nutritionProfile.carbsGoalGramsMilli ?? -1,
    fat_goal_grams_milli: workspace.nutritionProfile.fatGoalGramsMilli ?? -1,
    fiber_goal_grams_milli: workspace.nutritionProfile.fiberGoalGramsMilli ?? -1,
    water_goal_ml: workspace.nutritionProfile.waterGoalMl ?? -1,
    preferences: workspace.nutritionProfile.preferences,
    allergies: workspace.nutritionProfile.allergies,
    intolerances: workspace.nutritionProfile.intolerances,
    client_updated_at: workspace.nutritionProfile.updatedAt,
  }] : []);
  remember(collections.nutritionProfiles, result.stale);

  result = await upsertRows(request, collections.nutritionFoods, ownerId, workspace.nutritionFoods.map((food) => ({
    client_id: food.id,
    name: food.name,
    reference_quantity_milli: food.referenceQuantityMilli,
    unit: food.unit,
    ...nutrientRow(food),
    ...stamps(food),
  })));
  remember(collections.nutritionFoods, result.stale);
  const foods = recordMap(result.records);

  result = await upsertRows(request, collections.nutritionRecipes, ownerId, workspace.nutritionRecipes.map((recipe) => ({
    client_id: recipe.id,
    name: recipe.name,
    servings_milli: recipe.servingsMilli,
    ...stamps(recipe),
  })));
  remember(collections.nutritionRecipes, result.stale);
  const recipes = recordMap(result.records);

  result = await upsertRows(request, collections.nutritionIngredients, ownerId, workspace.nutritionRecipes.flatMap((recipe) =>
    recipe.ingredients.map((ingredient, position) => ({
      client_id: ingredient.id,
      recipe: requireRelation(recipes, recipe.id),
      food: requireRelation(foods, ingredient.foodId),
      quantity_milli: ingredient.quantityMilli,
      position,
    })),
  ));
  remember(collections.nutritionIngredients, result.stale);

  result = await upsertRows(request, collections.nutritionPlanItems, ownerId, workspace.nutritionPlanItems.map((item) => ({
    client_id: item.id,
    plan_date: item.date,
    meal_type: item.mealType,
    food: item.sourceType === "food" ? requireRelation(foods, item.sourceId) : "",
    recipe: item.sourceType === "recipe" ? requireRelation(recipes, item.sourceId) : "",
    servings_milli: item.servingsMilli,
    ...stamps(item),
  })));
  remember(collections.nutritionPlanItems, result.stale);
  const planItems = recordMap(result.records);

  result = await upsertRows(request, collections.nutritionIntakeEntries, ownerId, workspace.nutritionIntakeEntries.map((entry) => ({
    client_id: entry.id,
    intake_date: entry.date,
    meal_type: entry.mealType,
    description: entry.description,
    quantity_milli: entry.quantityMilli,
    unit_label: entry.unitLabel,
    ...nutrientRow(entry),
    food: entry.sourceType === "food" && entry.sourceId ? requireRelation(foods, entry.sourceId) : "",
    recipe: entry.sourceType === "recipe" && entry.sourceId ? requireRelation(recipes, entry.sourceId) : "",
    plan_item: entry.planItemId ? requireRelation(planItems, entry.planItemId) : "",
    ...stamps(entry),
  })));
  remember(collections.nutritionIntakeEntries, result.stale);

  result = await upsertRows(request, collections.nutritionHydrationEntries, ownerId, workspace.nutritionHydrationEntries.map((entry) => ({
    client_id: entry.id,
    entry_date: entry.date,
    amount_ml: entry.amountMl,
    ...stamps(entry),
  })));
  remember(collections.nutritionHydrationEntries, result.stale);

  result = await upsertRows(request, collections.nutritionShoppingLists, ownerId, workspace.nutritionShoppingLists.map((list) => ({
    client_id: list.id,
    name: list.name,
    start_date: list.startDate,
    end_date: list.endDate,
    ...stamps(list),
  })));
  remember(collections.nutritionShoppingLists, result.stale);
  const shoppingLists = recordMap(result.records);

  result = await upsertRows(request, collections.nutritionShoppingItems, ownerId, workspace.nutritionShoppingLists.flatMap((list) =>
    list.items.map((item, position) => ({
      client_id: `${list.id}::${item.id}`,
      shopping_list: requireRelation(shoppingLists, list.id),
      food: item.foodId ? requireRelation(foods, item.foodId) : "",
      label: item.label,
      quantity_milli: item.quantityMilli,
      unit: item.unit,
      checked: item.checked,
      manual: item.manual,
      position,
    })),
  ));
  remember(collections.nutritionShoppingItems, result.stale);

  result = await upsertRows(request, collections.locations, ownerId, workspace.locationEntries.map((entry) => ({
    client_id: entry.id,
    entry_date: entry.date,
    start_time: entry.startTime,
    end_time: entry.endTime,
    planned_location: entry.plannedLocation,
    actual_location: entry.actualLocation,
    notes: entry.notes,
    ...stamps(entry),
  })));
  remember(collections.locations, result.stale);

  await verifyDesiredIdentities(request, ownerId, workspace);
  await deleteStaleRecords(request, staleByCollection);
  const saved = await getNormalizedWorkspace(request, ownerId);
  if (workspaceSignature(saved) !== workspaceSignature(workspace)) {
    throw new Error("Normalized workspace verification failed after synchronization.");
  }
  return saved;
}

function requireRelation(map: Map<string, string>, clientId: string) {
  const recordId = map.get(clientId);
  if (!recordId) throw new Error(`Missing related record: ${clientId}`);
  return recordId;
}

async function verifyDesiredIdentities(
  request: PocketBaseRequester,
  ownerId: string,
  workspace: WorkspaceData,
) {
  const expectations: [string, string[]][] = [
    [collections.subjects, workspace.subjects.map((item) => item.id)],
    [collections.phases, workspace.phases.map((item) => item.id)],
    [collections.tasks, workspace.tasks.map((item) => item.id)],
    [collections.taskSubjects, workspace.tasks.flatMap((task) => task.subjectIds.map((subjectId) => `${task.id}::${subjectId}`))],
    [collections.events, workspace.subjectEvents.map((item) => item.id)],
    [collections.locations, workspace.locationEntries.map((item) => item.id)],
  ];
  for (const [collection, desiredIds] of expectations) {
    const current = new Set((await listOwnedRecords(request, collection, ownerId)).map((item) => item.client_id));
    for (const clientId of desiredIds) {
      if (!current.has(clientId)) throw new Error(`Verification failed for ${collection}/${clientId}`);
    }
  }
}

async function deleteStaleRecords(
  request: PocketBaseRequester,
  staleByCollection: Map<string, RecordData[]>,
) {
  const order = [
    collections.nutritionShoppingItems,
    collections.nutritionIngredients,
    collections.nutritionIntakeEntries,
    collections.nutritionPlanItems,
    collections.nutritionHydrationEntries,
    collections.nutritionShoppingLists,
    collections.nutritionRecipes,
    collections.nutritionFoods,
    collections.nutritionProfiles,
    collections.financeDuePayments,
    collections.financeEntries,
    collections.financeAccounts,
    collections.taskSubjects,
    collections.events,
    collections.tasks,
    collections.phases,
    collections.subjects,
    collections.locations,
  ];
  for (const collection of order) {
    for (const record of staleByCollection.get(collection) ?? []) {
      await request(
        `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
    }
  }
}

function workspaceSignature(workspace: WorkspaceData) {
  const normalized = {
    ...workspace,
    subjects: [...workspace.subjects].sort(byId),
    phases: [...workspace.phases].sort(byId),
    subjectEvents: [...workspace.subjectEvents].sort(byId),
    tasks: workspace.tasks.map((task) => ({ ...task, subjectIds: [...task.subjectIds].sort() })).sort(byId),
    financeAccounts: [...workspace.financeAccounts].sort(byId),
    financeEntries: [...workspace.financeEntries].sort(byId),
    financeDuePayments: [...workspace.financeDuePayments].sort(byId),
    nutritionFoods: [...workspace.nutritionFoods].sort(byId),
    nutritionRecipes: workspace.nutritionRecipes.map((recipe) => ({ ...recipe, ingredients: [...recipe.ingredients].sort(byId) })).sort(byId),
    nutritionPlanItems: [...workspace.nutritionPlanItems].sort(byId),
    nutritionIntakeEntries: [...workspace.nutritionIntakeEntries].sort(byId),
    nutritionHydrationEntries: [...workspace.nutritionHydrationEntries].sort(byId),
    nutritionShoppingLists: workspace.nutritionShoppingLists.map((list) => ({ ...list, items: [...list.items].sort(byId) })).sort(byId),
    locationEntries: [...workspace.locationEntries].sort(byId),
  };
  return JSON.stringify(canonicalize(normalized));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record).sort().map((key) => [key, canonicalize(record[key])]),
  );
}

function byId(a: { id: string }, b: { id: string }) {
  return a.id.localeCompare(b.id);
}
