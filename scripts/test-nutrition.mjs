import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleCache = new Map();

function loadTypeScriptModule(filename) {
  const resolved = path.resolve(filename);
  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;
  const output = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: resolved,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(resolved, loaded);
  function localRequire(specifier) {
    if (!specifier.startsWith(".")) return nodeRequire(specifier);
    const base = path.resolve(path.dirname(resolved), specifier);
    return loadTypeScriptModule(path.extname(base) ? base : `${base}.ts`);
  }
  new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, loaded, loaded.exports, resolved, path.dirname(resolved));
  return loaded.exports;
}

const nutrition = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "nutrition.ts"));
const codec = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "workspace-codec.ts"));
const storage = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "task-storage.ts"));
const timestamp = "2026-07-26T12:00:00.000Z";

assert.equal(nutrition.parseMilliValue("1,25"), 1250);
assert.equal(nutrition.parseMilliValue("0", { allowZero: true }), 0);
assert.equal(nutrition.parseMilliValue("0"), null);
assert.equal(nutrition.parseMilliValue("1,2345"), null);
assert.equal(nutrition.milliValueToInput(1250), "1,25");

const oats = {
  id: "food-oats",
  name: "Avena",
  referenceQuantityMilli: 100000,
  unit: "g",
  energyKcalMilli: 389000,
  proteinGramsMilli: 16900,
  carbsGramsMilli: 66300,
  fatGramsMilli: 6900,
  fiberGramsMilli: 10600,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const milk = {
  ...oats,
  id: "food-milk",
  name: "Leche",
  referenceQuantityMilli: 100000,
  unit: "ml",
  energyKcalMilli: 61000,
  proteinGramsMilli: 3200,
  carbsGramsMilli: 4800,
  fatGramsMilli: 3300,
  fiberGramsMilli: 0,
};
assert.deepEqual(nutrition.getFoodNutrients(oats, 50000), {
  energyKcalMilli: 194500,
  proteinGramsMilli: 8450,
  carbsGramsMilli: 33150,
  fatGramsMilli: 3450,
  fiberGramsMilli: 5300,
});

const recipe = {
  id: "recipe-porridge",
  name: "Porridge",
  servingsMilli: 2000,
  ingredients: [
    { id: "ingredient-oats", foodId: oats.id, quantityMilli: 100000 },
    { id: "ingredient-milk", foodId: milk.id, quantityMilli: 300000 },
  ],
  createdAt: timestamp,
  updatedAt: timestamp,
};
assert.equal(nutrition.getRecipeNutrients(recipe, [oats, milk]).energyKcalMilli, 572000);
assert.equal(nutrition.getRecipeNutrientsPerServing(recipe, [oats, milk]).energyKcalMilli, 286000);

const plan = {
  id: "meal-1",
  date: "2026-07-27",
  mealType: "breakfast",
  sourceType: "recipe",
  sourceId: recipe.id,
  servingsMilli: 1000,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const intake = nutrition.createIntakeFromPlan(plan, [oats, milk], [recipe], new Date(timestamp));
assert.equal(intake.description, "Porridge");
assert.equal(intake.energyKcalMilli, 286000);
const changedOats = { ...oats, energyKcalMilli: 500000 };
assert.equal(nutrition.getPlanItemNutrients(plan, [changedOats, milk], [recipe]).energyKcalMilli, 341500);
assert.equal(intake.energyKcalMilli, 286000, "historical snapshot must not change");

const summary = nutrition.getNutritionDailySummary(
  plan.date,
  [plan],
  [intake],
  [{ id: "water-1", date: plan.date, amountMl: 500, createdAt: timestamp, updatedAt: timestamp }],
  [oats, milk],
  [recipe],
);
assert.equal(summary.planned.energyKcalMilli, 286000);
assert.equal(summary.consumed.energyKcalMilli, 286000);
assert.equal(summary.hydrationMl, 500);
assert.deepEqual(nutrition.getWeekDates("2026-07-29"), ["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"]);

const directFoodPlan = { ...plan, id: "meal-2", sourceType: "food", sourceId: oats.id, servingsMilli: 500 };
const shopping = nutrition.generateNutritionShoppingList("2026-07-27", "2026-08-02", [plan, directFoodPlan], [oats, milk], [recipe], new Date(timestamp));
assert.deepEqual(shopping.items.map(({ label, quantityMilli, unit }) => ({ label, quantityMilli, unit })), [
  { label: "Avena", quantityMilli: 100000, unit: "g" },
  { label: "Leche", quantityMilli: 150000, unit: "ml" },
]);
const manualItem = nutrition.createNutritionShoppingItem({ label: "Servilletas", quantityMilli: 1000, unit: "unit" });
assert.equal(manualItem.manual, true);
assert.equal(nutrition.patchNutritionShoppingItem(manualItem, { checked: true }).checked, true);
assert.equal(nutrition.getFoodReferences(oats.id, [recipe], [directFoodPlan]).recipes.length, 1);
assert.equal(nutrition.getRecipeReferences(recipe.id, [plan]).length, 1);

const task = {
  id: "task-a", title: "Conservar", notes: "", status: "pending", subjectIds: [], phaseId: null,
  parentTaskId: null, hacerEl: null, venceEl: null, priority: "normal", createdAt: timestamp,
  updatedAt: timestamp, completedAt: null,
};
const profile = {
  energyGoalKcalMilli: 2000000,
  proteinGoalGramsMilli: 100000,
  carbsGoalGramsMilli: null,
  fatGoalGramsMilli: null,
  fiberGoalGramsMilli: 25000,
  waterGoalMl: 2000,
  preferences: ["Vegetariano"], allergies: [], intolerances: [], updatedAt: timestamp,
};
const normalized = codec.normalizeWorkspaceData({
  tasks: [task], subjects: [], phases: [], nutritionProfile: profile,
  nutritionFoods: [oats, milk], nutritionRecipes: [recipe], nutritionPlanItems: [plan],
  nutritionIntakeEntries: [intake],
  nutritionHydrationEntries: [{ id: "water-1", date: plan.date, amountMl: 500, createdAt: timestamp, updatedAt: timestamp }],
  nutritionShoppingLists: [shopping],
});
assert.equal(normalized.nutritionFoods.length, 2);
assert.equal(normalized.nutritionRecipes.length, 1);
assert.equal(normalized.nutritionPlanItems.length, 1);
assert.equal(normalized.nutritionIntakeEntries[0].energyKcalMilli, 286000);
assert.equal(codec.hasWorkspaceContent(normalized), true);

const legacy = codec.normalizeWorkspaceData({ tasks: [task], subjects: [], phases: [] });
assert.equal(legacy.nutritionProfile, null);
assert.deepEqual(legacy.nutritionFoods, []);
const malformed = codec.normalizeWorkspaceData({
  tasks: [], subjects: [], phases: [], nutritionFoods: [oats],
  nutritionRecipes: [{ ...recipe, ingredients: [{ id: "bad", foodId: "missing", quantityMilli: 1000 }] }],
  nutritionPlanItems: [{ ...plan, sourceId: "missing" }], nutritionIntakeEntries: [intake],
});
assert.deepEqual(malformed.nutritionRecipes, []);
assert.deepEqual(malformed.nutritionPlanItems, []);
assert.equal(malformed.nutritionIntakeEntries.length, 1, "valid historical snapshots survive missing sources");

const memory = new Map();
global.window = { localStorage: { getItem(key) { return memory.get(key) ?? null; }, setItem(key, value) { memory.set(key, value); } } };
storage.saveWorkspace(normalized);
assert.equal(storage.loadWorkspace().nutritionRecipes[0].name, "Porridge");
delete global.window;

const hookSource = fs.readFileSync(path.join(__dirname, "..", "app", "hooks", "use-task-workspace.ts"), "utf8");
for (const operation of ["addNutritionFood", "addNutritionRecipe", "copyNutritionPlanItem", "consumeNutritionPlanItem", "addNutritionHydration", "generateNutritionShopping"]) {
  assert.match(hookSource, new RegExp(operation));
}

const nutritionViewSource = fs.readFileSync(path.join(__dirname, "..", "app", "components", "nutrition-view.tsx"), "utf8");
for (const contract of ["role=\"dialog\"", "aria-modal=\"true\"", "window.confirm", "Plan semanal", "Biblioteca", "Compras", "consumeNutritionPlanItem", "generateNutritionShopping", "Artículo manual"]) {
  assert.match(nutritionViewSource, new RegExp(contract));
}
assert.doesNotMatch(nutritionViewSource, /<button[^>]*>[^<]*<button/);

console.log("Nutrition domain, persistence, history, shopping, and workspace operation tests passed.");
