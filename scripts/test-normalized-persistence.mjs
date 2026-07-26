import assert from "node:assert/strict";
import {
  getNormalizedWorkspace,
  saveNormalizedWorkspace,
} from "../app/lib/pocketbase-normalized.ts";

const owner = "owner-1";
const db = new Map();
let nextId = 1;
let failingCollection = null;

const request = async (path, options = {}) => {
  const url = new URL(path, "http://pocketbase.local");
  const match = url.pathname.match(/^\/api\/collections\/([^/]+)\/records(?:\/([^/]+))?$/);
  if (!match) throw new Error(`Unexpected fake request: ${path}`);
  const collection = decodeURIComponent(match[1]);
  const recordId = match[2] ? decodeURIComponent(match[2]) : null;
  const records = db.get(collection) ?? [];
  db.set(collection, records);
  if (options.method === "POST" || options.method === "PATCH") {
    if (failingCollection === collection) throw new Error(`Injected ${collection} failure`);
    const now = "2026-07-26 12:00:00.000Z";
    if (options.method === "POST") {
      const record = { id: `record-${nextId++}`, created: now, updated: now, ...options.body };
      records.push(record);
      return record;
    }
    const record = records.find((item) => item.id === recordId);
    if (!record) throw new Error(`Missing fake record ${collection}/${recordId}`);
    Object.assign(record, options.body, { updated: now });
    return record;
  }
  if (options.method === "DELETE") {
    const index = records.findIndex((item) => item.id === recordId);
    if (index >= 0) records.splice(index, 1);
    return null;
  }
  const filter = decodeURIComponent(url.searchParams.get("filter") || "");
  const ownerMatch = filter.match(/owner = "([^"]+)"/);
  const statusMatch = filter.match(/migration_status = "([^"]+)"/);
  const items = records.filter((item) =>
    (!ownerMatch || item.owner === ownerMatch[1]) &&
    (!statusMatch || item.migration_status === statusMatch[1]),
  );
  return { page: 1, totalPages: 1, totalItems: items.length, items };
};

const timestamp = "2026-07-26T12:00:00.000Z";
const workspace = {
  subjects: [{ id: "subject-1", name: "Trabajo", parentSubjectId: null, horizon: "short", createdAt: timestamp, updatedAt: timestamp }],
  phases: [{ id: "phase-1", subjectId: "subject-1", name: "Inicio", plannedStart: "2026-07-26", executedStart: null, plannedEnd: null, executedEnd: null, order: 0, createdAt: timestamp, updatedAt: timestamp }],
  subjectEvents: [{ id: "event-1", subjectId: "subject-1", phaseId: "phase-1", kind: "deadline", description: "Entrega", date: "2026-07-31", createdAt: timestamp, updatedAt: timestamp }],
  tasks: [{ id: "task-1", title: "Preparar", notes: "", status: "pending", subjectIds: ["subject-1"], phaseId: "phase-1", parentTaskId: null, hacerEl: "2026-07-26", venceEl: "2026-07-31", priority: "high", completedAt: null, createdAt: timestamp, updatedAt: timestamp }],
  financeAccounts: [{ id: "account-1", name: "Banco", type: "bank", currency: "ARS", openingBalanceMinor: 10000, createdAt: timestamp, updatedAt: timestamp }],
  financeEntries: [{ id: "entry-1", accountId: "account-1", kind: "expense", date: "2026-07-26", description: "Compra", amountMinor: 1500, category: "Casa", createdAt: timestamp, updatedAt: timestamp }],
  financeDuePayments: [{ id: "due-1", accountId: "account-1", description: "Internet", amountMinor: 2000, dueDate: "2026-07-30", category: "Servicios", status: "pending", paidAt: null, createdAt: timestamp, updatedAt: timestamp }],
  nutritionProfile: { energyGoalKcalMilli: null, proteinGoalGramsMilli: 100000, carbsGoalGramsMilli: null, fatGoalGramsMilli: null, fiberGoalGramsMilli: null, waterGoalMl: 2000, preferences: ["simple"], allergies: [], intolerances: [], updatedAt: timestamp },
  nutritionFoods: [{ id: "food-1", name: "Manzana", referenceQuantityMilli: 100000, unit: "g", energyKcalMilli: 52000, proteinGramsMilli: 300, carbsGramsMilli: 14000, fatGramsMilli: 200, fiberGramsMilli: 2400, createdAt: timestamp, updatedAt: timestamp }],
  nutritionRecipes: [{ id: "recipe-1", name: "Ensalada", servingsMilli: 1000, ingredients: [{ id: "ingredient-1", foodId: "food-1", quantityMilli: 100000 }], createdAt: timestamp, updatedAt: timestamp }],
  nutritionPlanItems: [{ id: "plan-1", date: "2026-07-26", mealType: "lunch", sourceType: "recipe", sourceId: "recipe-1", servingsMilli: 1000, createdAt: timestamp, updatedAt: timestamp }],
  nutritionIntakeEntries: [{ id: "intake-1", date: "2026-07-26", mealType: "lunch", description: "Ensalada", quantityMilli: 1000, unitLabel: "porción", energyKcalMilli: 52000, proteinGramsMilli: 300, carbsGramsMilli: 14000, fatGramsMilli: 200, fiberGramsMilli: 2400, sourceType: "recipe", sourceId: "recipe-1", planItemId: "plan-1", createdAt: timestamp, updatedAt: timestamp }],
  nutritionHydrationEntries: [{ id: "water-1", date: "2026-07-26", amountMl: 500, createdAt: timestamp, updatedAt: timestamp }],
  nutritionShoppingLists: [{ id: "shopping-1", name: "Semana", startDate: "2026-07-26", endDate: "2026-08-01", items: [{ id: "item-1", foodId: "food-1", label: "Manzana", quantityMilli: 100000, unit: "g", checked: false, manual: false }], createdAt: timestamp, updatedAt: timestamp }],
  locationEntries: [{ id: "location-1", date: "2026-07-26", startTime: "08:00", endTime: "09:00", plannedLocation: "Oficina", actualLocation: "", notes: "", createdAt: timestamp, updatedAt: timestamp }],
};

await saveNormalizedWorkspace(request, owner, workspace);
const loaded = await getNormalizedWorkspace(request, owner);
assert.deepEqual(loaded, workspace);
assert.equal(loaded.phases[0].order, 0, "zero-based phase order must survive");
assert.equal(loaded.nutritionProfile.energyGoalKcalMilli, null, "nullable goals must survive");

const countsAfterFirstSave = Object.fromEntries([...db].map(([name, records]) => [name, records.length]));
await saveNormalizedWorkspace(request, owner, workspace);
assert.deepEqual(Object.fromEntries([...db].map(([name, records]) => [name, records.length])), countsAfterFirstSave, "idempotent save must not duplicate records");

db.get("subjects").push({ id: "foreign-record", owner: "owner-2", client_id: "foreign-subject", name: "Foreign", horizon: "none", created: timestamp, updated: timestamp });
assert.equal((await getNormalizedWorkspace(request, owner)).subjects.some((item) => item.id === "foreign-subject"), false, "owner filter must exclude foreign records");

const nextWorkspace = structuredClone(workspace);
nextWorkspace.locationEntries = [];
nextWorkspace.tasks.push({ ...nextWorkspace.tasks[0], id: "task-2", title: "Nueva", subjectIds: [] });
failingCollection = "tasks";
await assert.rejects(() => saveNormalizedWorkspace(request, owner, nextWorkspace), /Injected tasks failure/);
assert.equal(db.get("location_entries").some((item) => item.client_id === "location-1"), true, "a failed upsert must not delete stale records");

failingCollection = null;
await saveNormalizedWorkspace(request, owner, nextWorkspace);
assert.equal(db.get("location_entries").some((item) => item.client_id === "location-1"), false, "successful retry must delete stale records");
assert.equal((await getNormalizedWorkspace(request, owner)).tasks.length, 2);

console.log("Normalized persistence tests passed");
