import assert from "node:assert/strict";
import { normalizeCaptureResult } from "../app/lib/ai-capture.ts";
import { captureDraft, capturedText, confirmCapture } from "../app/modules/capture/actions.ts";
import { emptyWorkspace, getInboxTasks, getReviewedUnassignedTasks, normalizeTaskDraft } from "../app/lib/tasks.ts";
import { createFinanceAccount } from "../app/lib/finance.ts";

const normalized = normalizeCaptureResult(
  {
    title: "  Llamar   a Martina  ",
    notes: "Confirmar el presupuesto del viaje.",
  },
  "El martes llamar a Martina por el presupuesto.",
);

assert.deepEqual(normalized, {
  title: "Llamar a Martina",
  notes: "Confirmar el presupuesto del viaje.",
  sourceText: "El martes llamar a Martina por el presupuesto.",
  suggestion: null,
});
assert.equal(normalizeCaptureResult({ title: "   ", notes: "detalle" }, "original"), null);
assert.equal(normalizeCaptureResult(null, "original"), null);

const expense = normalizeCaptureResult(
  {
    title: "Registrar viaje en Uber",
    notes: "Viaje desde casa hasta el Nodo.",
    suggestion: {
      type: "finance_entry",
      kind: "expense",
      description: "Viaje en Uber de casa al Nodo",
      amount: 3100,
      currency: "ARS",
      category: "Transporte",
      date: "2026-07-26",
      origin: "Casa",
      destination: "Nodo",
    },
  },
  "Acabo de gastar 3100 pesos en un Uber desde mi casa hasta el Nodo.",
);

assert.equal(expense?.suggestion?.amountMinor, 310000);
assert.equal(expense?.suggestion?.currency, "ARS");
assert.equal(expense?.suggestion?.destination, "Nodo");

const task = normalizeCaptureResult({ title: "Llamar a Martina", notes: "", suggestion: {
  type: "task", title: "Llamar a Martina", notes: "Confirmar presupuesto", priority: "high",
  hacerEl: "2026-07-27", venceEl: null, subjectName: "Viaje",
} }, "Mañana llamar a Martina por el viaje");
assert.equal(task?.suggestion?.type, "task");
assert.equal(task?.suggestion?.hacerEl, "2026-07-27");

const hydration = normalizeCaptureResult({ title: "Agua", notes: "", suggestion: {
  type: "nutrition_hydration", date: "2026-07-26", amountMl: 500,
} }, "Tomé medio litro de agua");
assert.equal(hydration?.suggestion?.type, "nutrition_hydration");
assert.equal(hydration?.suggestion?.amountMl, 500);

const location = normalizeCaptureResult({ title: "Oficina", notes: "", suggestion: {
  type: "location", date: "2026-07-26", startTime: "09:00", endTime: "18:00",
  plannedLocation: "", actualLocation: "Oficina", notes: "Jornada presencial",
} }, "Hoy estuve en la oficina de 9 a 18");
assert.equal(location?.suggestion?.type, "location");
assert.equal(location?.suggestion?.plannedLocation, "Oficina");

const expectation = normalizeCaptureResult({ title: "Esperar compras", notes: "", suggestion: {
  type: "expectation", title: "Llegan dos compras de Mercado Libre", notes: "Verificar la entrega",
  expectedDate: "2026-07-28", quantity: 2, source: "Mercado Libre",
} }, "Dentro de dos días me llegan dos compras de Mercado Libre");
assert.equal(expectation?.suggestion?.type, "expectation");
assert.equal(expectation?.suggestion?.quantity, 2);
assert.equal(expectation?.suggestion?.expectedDate, "2026-07-28");

const captureDate = new Date("2026-07-28T12:00:00Z");
const original = normalizeTaskDraft(captureDraft({
  title: "Hacer una llamada",
  notes: "Resumen generado",
  sourceText: "llamar para consultar horarios",
  suggestion: null,
}), captureDate);
assert.equal(capturedText(original), "llamar para consultar horarios");
const account = createFinanceAccount({ name: "Banco", type: "bank", currency: "ARS", openingBalanceMinor: 0 }, captureDate);
const financial = normalizeTaskDraft({ title: "Gasto pendiente", aiSuggestion: expense.suggestion }, captureDate);
const water = normalizeTaskDraft({ title: "Agua", aiSuggestion: hydration.suggestion }, captureDate);
const workspace = { ...emptyWorkspace(), tasks: [original, financial, water], financeAccounts: [account] };
const review = {
  type: "task",
  draft: { title: "Consultar horarios", notes: "Conservar el contacto", priority: "normal", hacerEl: null, venceEl: null, subjectIds: [] },
};
assert.match(confirmCapture(workspace, original.id, { ...review, draft: { ...review.draft, subjectIds: ["ausente"] } }).error, /asunto/);
const reviewed = confirmCapture(workspace, original.id, review, captureDate).workspace;
assert.deepEqual(getInboxTasks(reviewed.tasks).map(({ id }) => id), [financial.id, water.id]);
assert.equal(getReviewedUnassignedTasks(reviewed.tasks)[0].id, original.id);
assert.equal(reviewed.tasks[0].title, "Consultar horarios");
assert.equal(confirmCapture(reviewed, original.id, review), null);

const financeAction = {
  type: "finance_entry", currency: "ARS",
  draft: { accountId: account.id, description: "Viaje", amountMinor: 310000, date: "2026-07-28", category: "", kind: "expense" },
};
assert.match(confirmCapture(reviewed, financial.id, { ...financeAction, currency: "USD" }).error, /cuenta/);
assert.equal(reviewed.financeEntries.length, 0);
assert.equal(reviewed.tasks.some(({ id }) => id === financial.id), true);
const recorded = confirmCapture(reviewed, financial.id, financeAction, captureDate).workspace;
assert.equal(recorded.financeEntries.length, 1);
assert.equal(confirmCapture(recorded, financial.id, financeAction), null);

const waterAction = { type: "nutrition_hydration", draft: { date: "2026-07-28", amountMl: 500 } };
assert.match(confirmCapture(recorded, water.id, { ...waterAction, draft: { ...waterAction.draft, amountMl: 0 } }).error, /cantidad/);
const finalWorkspace = confirmCapture(recorded, water.id, waterAction, captureDate).workspace;
assert.equal(finalWorkspace.nutritionHydrationEntries[0].amountMl, 500);
assert.equal(getInboxTasks(finalWorkspace.tasks).length, 0);

console.log("Capture normalization and inbox confirmation tests passed.");
