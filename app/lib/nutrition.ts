import { createId, getTodayDateOnly, isValidDateOnly } from "./tasks";

export type NutritionUnit = "g" | "ml" | "unit";
export type MealType = "breakfast" | "lunch" | "snack" | "dinner" | "other";
export type NutritionSourceType = "food" | "recipe";

export type NutrientTotals = {
  energyKcalMilli: number;
  proteinGramsMilli: number;
  carbsGramsMilli: number;
  fatGramsMilli: number;
  fiberGramsMilli: number;
};

export type NutritionProfile = {
  energyGoalKcalMilli: number | null;
  proteinGoalGramsMilli: number | null;
  carbsGoalGramsMilli: number | null;
  fatGoalGramsMilli: number | null;
  fiberGoalGramsMilli: number | null;
  waterGoalMl: number | null;
  preferences: string[];
  allergies: string[];
  intolerances: string[];
  updatedAt: string;
};

export type NutritionFood = NutrientTotals & {
  id: string;
  name: string;
  referenceQuantityMilli: number;
  unit: NutritionUnit;
  createdAt: string;
  updatedAt: string;
};

export type NutritionRecipeIngredient = {
  id: string;
  foodId: string;
  quantityMilli: number;
};

export type NutritionRecipe = {
  id: string;
  name: string;
  servingsMilli: number;
  ingredients: NutritionRecipeIngredient[];
  createdAt: string;
  updatedAt: string;
};

export type NutritionPlanItem = {
  id: string;
  date: string;
  mealType: MealType;
  sourceType: NutritionSourceType;
  sourceId: string;
  servingsMilli: number;
  createdAt: string;
  updatedAt: string;
};

export type NutritionIntakeEntry = NutrientTotals & {
  id: string;
  date: string;
  mealType: MealType;
  description: string;
  quantityMilli: number;
  unitLabel: string;
  sourceType: NutritionSourceType | null;
  sourceId: string | null;
  planItemId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NutritionHydrationEntry = {
  id: string;
  date: string;
  amountMl: number;
  createdAt: string;
  updatedAt: string;
};

export type NutritionShoppingItem = {
  id: string;
  foodId: string | null;
  label: string;
  quantityMilli: number;
  unit: NutritionUnit;
  checked: boolean;
  manual: boolean;
};

export type NutritionShoppingList = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  items: NutritionShoppingItem[];
  createdAt: string;
  updatedAt: string;
};

export type NutritionProfileDraft = Omit<NutritionProfile, "updatedAt">;
export type NutritionFoodDraft = Omit<NutritionFood, "id" | "createdAt" | "updatedAt">;
export type NutritionRecipeDraft = Pick<NutritionRecipe, "name" | "servingsMilli" | "ingredients">;
export type NutritionPlanItemDraft = Omit<NutritionPlanItem, "id" | "createdAt" | "updatedAt">;
export type NutritionIntakeDraft = Pick<
  NutritionIntakeEntry,
  "date" | "mealType" | "description" | "quantityMilli" | "unitLabel"
> &
  NutrientTotals & {
    sourceType?: NutritionSourceType | null;
    sourceId?: string | null;
    planItemId?: string | null;
  };
export type NutritionHydrationDraft = Pick<NutritionHydrationEntry, "date" | "amountMl">;
export type NutritionShoppingItemDraft = Pick<
  NutritionShoppingItem,
  "label" | "quantityMilli" | "unit"
> & { foodId?: string | null; checked?: boolean; manual?: boolean };

export type NutritionDailySummary = {
  date: string;
  planned: NutrientTotals;
  consumed: NutrientTotals;
  hydrationMl: number;
};

export const nutritionUnits: { value: NutritionUnit; label: string }[] = [
  { value: "g", label: "gramos" },
  { value: "ml", label: "mililitros" },
  { value: "unit", label: "unidades" },
];

export const mealTypes: { value: MealType; label: string; shortLabel: string }[] = [
  { value: "breakfast", label: "Desayuno", shortLabel: "Des" },
  { value: "lunch", label: "Almuerzo", shortLabel: "Alm" },
  { value: "snack", label: "Merienda / snack", shortLabel: "Mer" },
  { value: "dinner", label: "Cena", shortLabel: "Cena" },
  { value: "other", label: "Otra comida", shortLabel: "Otra" },
];

export const zeroNutrients = (): NutrientTotals => ({
  energyKcalMilli: 0,
  proteinGramsMilli: 0,
  carbsGramsMilli: 0,
  fatGramsMilli: 0,
  fiberGramsMilli: 0,
});

const nutrientKeys: (keyof NutrientTotals)[] = [
  "energyKcalMilli",
  "proteinGramsMilli",
  "carbsGramsMilli",
  "fatGramsMilli",
  "fiberGramsMilli",
];

export function isSafeNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function isSafePositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

export function isNutritionUnit(value: unknown): value is NutritionUnit {
  return value === "g" || value === "ml" || value === "unit";
}

export function isMealType(value: unknown): value is MealType {
  return mealTypes.some((meal) => meal.value === value);
}

export function isNutritionSourceType(value: unknown): value is NutritionSourceType {
  return value === "food" || value === "recipe";
}

export function parseMilliValue(value: string, options: { allowZero?: boolean } = {}): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const result = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  if (!Number.isSafeInteger(result) || result < 0 || (!options.allowZero && result === 0)) {
    return null;
  }
  return result;
}

export function milliValueToInput(value: number | null): string {
  if (value === null) return "";
  const whole = Math.floor(value / 1000);
  const fraction = `${value % 1000}`.padStart(3, "0").replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : `${whole}`;
}

export function formatMilliValue(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits }).format(value / 1000);
}

export function formatNutritionQuantity(quantityMilli: number, unit: NutritionUnit): string {
  const suffix = unit === "unit" ? (quantityMilli === 1000 ? "unidad" : "unidades") : unit;
  return `${formatMilliValue(quantityMilli, 2)} ${suffix}`;
}

export function addNutrients(...values: NutrientTotals[]): NutrientTotals {
  return values.reduce((total, value) => {
    for (const key of nutrientKeys) total[key] += value[key];
    return total;
  }, zeroNutrients());
}

export function scaleNutrients(value: NutrientTotals, numerator: number, denominator = 1000): NutrientTotals {
  if (!isSafeNonNegativeInteger(numerator) || !isSafePositiveInteger(denominator)) {
    return zeroNutrients();
  }
  return Object.fromEntries(
    nutrientKeys.map((key) => [key, Math.round((value[key] * numerator) / denominator)]),
  ) as NutrientTotals;
}

export function hasValidNutrients(value: NutrientTotals): boolean {
  return nutrientKeys.every((key) => isSafeNonNegativeInteger(value[key]));
}

function normalizeTextList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function validOptionalGoal(value: number | null): boolean {
  return value === null || isSafePositiveInteger(value);
}

export function isValidNutritionProfileDraft(draft: NutritionProfileDraft): boolean {
  return (
    validOptionalGoal(draft.energyGoalKcalMilli) &&
    validOptionalGoal(draft.proteinGoalGramsMilli) &&
    validOptionalGoal(draft.carbsGoalGramsMilli) &&
    validOptionalGoal(draft.fatGoalGramsMilli) &&
    validOptionalGoal(draft.fiberGoalGramsMilli) &&
    validOptionalGoal(draft.waterGoalMl) &&
    [draft.preferences, draft.allergies, draft.intolerances].every((list) =>
      Array.isArray(list) && list.every((value) => typeof value === "string"),
    )
  );
}

export function createNutritionProfile(
  draft: NutritionProfileDraft,
  now = new Date(),
): NutritionProfile | null {
  if (!isValidNutritionProfileDraft(draft)) return null;
  return {
    ...draft,
    preferences: normalizeTextList(draft.preferences),
    allergies: normalizeTextList(draft.allergies),
    intolerances: normalizeTextList(draft.intolerances),
    updatedAt: now.toISOString(),
  };
}

export function isValidNutritionFoodDraft(draft: NutritionFoodDraft): boolean {
  return (
    Boolean(draft.name.trim()) &&
    isSafePositiveInteger(draft.referenceQuantityMilli) &&
    isNutritionUnit(draft.unit) &&
    hasValidNutrients(draft)
  );
}

export function createNutritionFood(draft: NutritionFoodDraft, now = new Date()): NutritionFood | null {
  if (!isValidNutritionFoodDraft(draft)) return null;
  const timestamp = now.toISOString();
  return { id: createId("food"), ...draft, name: draft.name.trim(), createdAt: timestamp, updatedAt: timestamp };
}

export function patchNutritionFood(
  food: NutritionFood,
  patch: Partial<NutritionFoodDraft>,
  now = new Date(),
): NutritionFood | null {
  const updated = { ...food, ...patch, name: patch.name?.trim() ?? food.name, updatedAt: now.toISOString() };
  return isValidNutritionFoodDraft(updated) ? updated : null;
}

export function getFoodNutrients(food: NutritionFood, quantityMilli: number): NutrientTotals {
  return scaleNutrients(food, quantityMilli, food.referenceQuantityMilli);
}

export function isValidNutritionRecipeDraft(
  draft: NutritionRecipeDraft,
  foodIds?: Set<string>,
): boolean {
  return (
    Boolean(draft.name.trim()) &&
    isSafePositiveInteger(draft.servingsMilli) &&
    draft.ingredients.length > 0 &&
    draft.ingredients.every(
      (ingredient) =>
        Boolean(ingredient.id) &&
        Boolean(ingredient.foodId) &&
        isSafePositiveInteger(ingredient.quantityMilli) &&
        (!foodIds || foodIds.has(ingredient.foodId)),
    )
  );
}

export function createNutritionRecipe(
  draft: NutritionRecipeDraft,
  foodIds: Set<string>,
  now = new Date(),
): NutritionRecipe | null {
  if (!isValidNutritionRecipeDraft(draft, foodIds)) return null;
  const timestamp = now.toISOString();
  return {
    id: createId("recipe"),
    ...draft,
    name: draft.name.trim(),
    ingredients: draft.ingredients.map((ingredient) => ({ ...ingredient })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchNutritionRecipe(
  recipe: NutritionRecipe,
  patch: Partial<NutritionRecipeDraft>,
  foodIds: Set<string>,
  now = new Date(),
): NutritionRecipe | null {
  const updated = {
    ...recipe,
    ...patch,
    name: patch.name?.trim() ?? recipe.name,
    ingredients: patch.ingredients?.map((ingredient) => ({ ...ingredient })) ?? recipe.ingredients,
    updatedAt: now.toISOString(),
  };
  return isValidNutritionRecipeDraft(updated, foodIds) ? updated : null;
}

export function getRecipeNutrients(recipe: NutritionRecipe, foods: NutritionFood[]): NutrientTotals {
  const byId = new Map(foods.map((food) => [food.id, food]));
  return addNutrients(
    ...recipe.ingredients.map((ingredient) => {
      const food = byId.get(ingredient.foodId);
      return food ? getFoodNutrients(food, ingredient.quantityMilli) : zeroNutrients();
    }),
  );
}

export function getRecipeNutrientsPerServing(
  recipe: NutritionRecipe,
  foods: NutritionFood[],
): NutrientTotals {
  return scaleNutrients(getRecipeNutrients(recipe, foods), 1000, recipe.servingsMilli);
}

export function isValidNutritionPlanItemDraft(
  draft: NutritionPlanItemDraft,
  foodIds?: Set<string>,
  recipeIds?: Set<string>,
): boolean {
  const sourceExists =
    draft.sourceType === "food" ? !foodIds || foodIds.has(draft.sourceId) : !recipeIds || recipeIds.has(draft.sourceId);
  return (
    isValidDateOnly(draft.date) &&
    isMealType(draft.mealType) &&
    isNutritionSourceType(draft.sourceType) &&
    Boolean(draft.sourceId) &&
    sourceExists &&
    isSafePositiveInteger(draft.servingsMilli)
  );
}

export function createNutritionPlanItem(
  draft: NutritionPlanItemDraft,
  foodIds: Set<string>,
  recipeIds: Set<string>,
  now = new Date(),
): NutritionPlanItem | null {
  if (!isValidNutritionPlanItemDraft(draft, foodIds, recipeIds)) return null;
  const timestamp = now.toISOString();
  return { id: createId("meal"), ...draft, createdAt: timestamp, updatedAt: timestamp };
}

export function patchNutritionPlanItem(
  item: NutritionPlanItem,
  patch: Partial<NutritionPlanItemDraft>,
  foodIds: Set<string>,
  recipeIds: Set<string>,
  now = new Date(),
): NutritionPlanItem | null {
  const updated = { ...item, ...patch, updatedAt: now.toISOString() };
  return isValidNutritionPlanItemDraft(updated, foodIds, recipeIds) ? updated : null;
}

export function getPlanItemLabel(
  item: NutritionPlanItem,
  foods: NutritionFood[],
  recipes: NutritionRecipe[],
): string {
  return item.sourceType === "food"
    ? foods.find((food) => food.id === item.sourceId)?.name ?? "Alimento no disponible"
    : recipes.find((recipe) => recipe.id === item.sourceId)?.name ?? "Preparación no disponible";
}

export function getPlanItemNutrients(
  item: NutritionPlanItem,
  foods: NutritionFood[],
  recipes: NutritionRecipe[],
): NutrientTotals {
  if (item.sourceType === "food") {
    const food = foods.find((candidate) => candidate.id === item.sourceId);
    return food ? scaleNutrients(food, item.servingsMilli) : zeroNutrients();
  }
  const recipe = recipes.find((candidate) => candidate.id === item.sourceId);
  return recipe
    ? scaleNutrients(getRecipeNutrientsPerServing(recipe, foods), item.servingsMilli)
    : zeroNutrients();
}

export function isValidNutritionIntakeDraft(draft: NutritionIntakeDraft): boolean {
  return (
    isValidDateOnly(draft.date) &&
    isMealType(draft.mealType) &&
    Boolean(draft.description.trim()) &&
    isSafePositiveInteger(draft.quantityMilli) &&
    Boolean(draft.unitLabel.trim()) &&
    hasValidNutrients(draft) &&
    (draft.sourceType === undefined || draft.sourceType === null || isNutritionSourceType(draft.sourceType))
  );
}

export function createNutritionIntake(
  draft: NutritionIntakeDraft,
  now = new Date(),
): NutritionIntakeEntry | null {
  if (!isValidNutritionIntakeDraft(draft)) return null;
  const timestamp = now.toISOString();
  return {
    id: createId("intake"),
    ...draft,
    description: draft.description.trim(),
    unitLabel: draft.unitLabel.trim(),
    sourceType: draft.sourceType ?? null,
    sourceId: draft.sourceId ?? null,
    planItemId: draft.planItemId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchNutritionIntake(
  entry: NutritionIntakeEntry,
  patch: Partial<NutritionIntakeDraft>,
  now = new Date(),
): NutritionIntakeEntry | null {
  const updated = {
    ...entry,
    ...patch,
    description: patch.description?.trim() ?? entry.description,
    unitLabel: patch.unitLabel?.trim() ?? entry.unitLabel,
    updatedAt: now.toISOString(),
  };
  return isValidNutritionIntakeDraft(updated) ? updated : null;
}

export function createIntakeFromPlan(
  item: NutritionPlanItem,
  foods: NutritionFood[],
  recipes: NutritionRecipe[],
  now = new Date(),
): NutritionIntakeEntry | null {
  const source =
    item.sourceType === "food"
      ? foods.find((food) => food.id === item.sourceId)
      : recipes.find((recipe) => recipe.id === item.sourceId);
  if (!source) return null;
  return createNutritionIntake(
    {
      date: item.date,
      mealType: item.mealType,
      description: source.name,
      quantityMilli: item.servingsMilli,
      unitLabel: item.sourceType === "food" ? "porciones" : "porciones",
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      planItemId: item.id,
      ...getPlanItemNutrients(item, foods, recipes),
    },
    now,
  );
}

export function createNutritionHydration(
  draft: NutritionHydrationDraft,
  now = new Date(),
): NutritionHydrationEntry | null {
  if (!isValidDateOnly(draft.date) || !isSafePositiveInteger(draft.amountMl)) return null;
  const timestamp = now.toISOString();
  return { id: createId("water"), ...draft, createdAt: timestamp, updatedAt: timestamp };
}

export function patchNutritionHydration(
  entry: NutritionHydrationEntry,
  patch: Partial<NutritionHydrationDraft>,
  now = new Date(),
): NutritionHydrationEntry | null {
  const updated = { ...entry, ...patch, updatedAt: now.toISOString() };
  return isValidDateOnly(updated.date) && isSafePositiveInteger(updated.amountMl) ? updated : null;
}

export function getNutritionDailySummary(
  date: string,
  planItems: NutritionPlanItem[],
  intakeEntries: NutritionIntakeEntry[],
  hydrationEntries: NutritionHydrationEntry[],
  foods: NutritionFood[],
  recipes: NutritionRecipe[],
): NutritionDailySummary {
  return {
    date,
    planned: addNutrients(
      ...planItems.filter((item) => item.date === date).map((item) => getPlanItemNutrients(item, foods, recipes)),
    ),
    consumed: addNutrients(...intakeEntries.filter((entry) => entry.date === date)),
    hydrationMl: hydrationEntries
      .filter((entry) => entry.date === date)
      .reduce((total, entry) => total + entry.amountMl, 0),
  };
}

export function getMondayDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return getTodayDateOnly(date);
}

export function addDaysDateOnly(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getTodayDateOnly(date);
}

export function getWeekDates(dateOnly: string): string[] {
  const monday = getMondayDateOnly(dateOnly);
  return Array.from({ length: 7 }, (_, index) => addDaysDateOnly(monday, index));
}

export function getPlanItemsForWeek(items: NutritionPlanItem[], dateOnly: string): NutritionPlanItem[] {
  const dates = new Set(getWeekDates(dateOnly));
  return items
    .filter((item) => dates.has(item.date))
    .sort((a, b) => a.date.localeCompare(b.date) || mealTypes.findIndex((m) => m.value === a.mealType) - mealTypes.findIndex((m) => m.value === b.mealType) || a.createdAt.localeCompare(b.createdAt));
}

export function getFoodReferences(
  foodId: string,
  recipes: NutritionRecipe[],
  planItems: NutritionPlanItem[],
): { recipes: NutritionRecipe[]; planItems: NutritionPlanItem[] } {
  return {
    recipes: recipes.filter((recipe) => recipe.ingredients.some((ingredient) => ingredient.foodId === foodId)),
    planItems: planItems.filter((item) => item.sourceType === "food" && item.sourceId === foodId),
  };
}

export function getRecipeReferences(
  recipeId: string,
  planItems: NutritionPlanItem[],
): NutritionPlanItem[] {
  return planItems.filter((item) => item.sourceType === "recipe" && item.sourceId === recipeId);
}

function recipeShoppingIngredients(
  recipe: NutritionRecipe,
  servingsMilli: number,
): NutritionRecipeIngredient[] {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    quantityMilli: Math.round((ingredient.quantityMilli * servingsMilli) / recipe.servingsMilli),
  }));
}

export function generateNutritionShoppingList(
  startDate: string,
  endDate: string,
  planItems: NutritionPlanItem[],
  foods: NutritionFood[],
  recipes: NutritionRecipe[],
  now = new Date(),
): NutritionShoppingList | null {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate) || endDate < startDate) return null;
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const amounts = new Map<string, number>();
  for (const item of planItems.filter((candidate) => candidate.date >= startDate && candidate.date <= endDate)) {
    if (item.sourceType === "food") {
      const food = foodById.get(item.sourceId);
      if (food) amounts.set(food.id, (amounts.get(food.id) ?? 0) + Math.round((food.referenceQuantityMilli * item.servingsMilli) / 1000));
      continue;
    }
    const recipe = recipeById.get(item.sourceId);
    if (!recipe) continue;
    for (const ingredient of recipeShoppingIngredients(recipe, item.servingsMilli)) {
      amounts.set(ingredient.foodId, (amounts.get(ingredient.foodId) ?? 0) + ingredient.quantityMilli);
    }
  }
  const timestamp = now.toISOString();
  return {
    id: createId("shopping"),
    name: `Compras ${startDate.split("-").reverse().join("/")}–${endDate.split("-").reverse().join("/")}`,
    startDate,
    endDate,
    items: [...amounts.entries()]
      .flatMap(([foodId, quantityMilli]): NutritionShoppingItem[] => {
        const food = foodById.get(foodId);
        return food
          ? [{ id: createId("shop-item"), foodId, label: food.name, quantityMilli, unit: food.unit, checked: false, manual: false }]
          : [];
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createNutritionShoppingItem(draft: NutritionShoppingItemDraft): NutritionShoppingItem | null {
  if (!draft.label.trim() || !isSafePositiveInteger(draft.quantityMilli) || !isNutritionUnit(draft.unit)) return null;
  return {
    id: createId("shop-item"),
    foodId: draft.foodId ?? null,
    label: draft.label.trim(),
    quantityMilli: draft.quantityMilli,
    unit: draft.unit,
    checked: draft.checked ?? false,
    manual: draft.manual ?? true,
  };
}

export function patchNutritionShoppingItem(
  item: NutritionShoppingItem,
  patch: Partial<NutritionShoppingItemDraft>,
): NutritionShoppingItem | null {
  const updated = { ...item, ...patch, label: patch.label?.trim() ?? item.label };
  return updated.label && isSafePositiveInteger(updated.quantityMilli) && isNutritionUnit(updated.unit) ? updated : null;
}

export function getMealTypeLabel(value: MealType): string {
  return mealTypes.find((meal) => meal.value === value)?.label ?? "Otra comida";
}
