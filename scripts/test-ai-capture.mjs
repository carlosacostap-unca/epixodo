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
});
assert.equal(normalizeCaptureResult({ title: "   ", notes: "detalle" }, "original"), null);
assert.equal(normalizeCaptureResult(null, "original"), null);

console.log("AI capture normalization tests passed.");
