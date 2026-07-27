import assert from "node:assert/strict";
import { normalizeCaptureResult } from "../app/lib/ai-capture.ts";

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

console.log("AI capture normalization tests passed.");
