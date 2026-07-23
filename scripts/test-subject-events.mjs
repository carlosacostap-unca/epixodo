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

  const source = fs.readFileSync(resolved, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: resolved,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(resolved, loaded);

  function localRequire(specifier) {
    if (!specifier.startsWith(".")) return nodeRequire(specifier);
    const base = path.resolve(path.dirname(resolved), specifier);
    return loadTypeScriptModule(path.extname(base) ? base : `${base}.ts`);
  }

  const execute = new Function("require", "module", "exports", "__filename", "__dirname", output);
  execute(localRequire, loaded, loaded.exports, resolved, path.dirname(resolved));
  return loaded.exports;
}

const tasks = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "tasks.ts"));
const codec = loadTypeScriptModule(
  path.join(__dirname, "..", "app", "lib", "workspace-codec.ts"),
);

const timestamp = "2026-07-21T12:00:00.000Z";
assert.equal(codec.repairMojibake("Nodo TecnolÃ³gico"), "Nodo Tecnológico");
assert.equal(codec.repairMojibake("DiseÃ±o y ModernizaciÃ³n"), "Diseño y Modernización");
assert.equal(codec.repairMojibake("São Paulo"), "São Paulo");

const subject = {
  id: "subject-a",
  name: "Asunto A",
  parentSubjectId: null,
  horizon: "none",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const phase = {
  id: "phase-a",
  subjectId: subject.id,
  name: "Preparacion",
  plannedStart: null,
  executedStart: null,
  plannedEnd: null,
  executedEnd: null,
  order: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const otherSubject = { ...subject, id: "subject-b", name: "Asunto B" };
const otherPhase = { ...phase, id: "phase-b", subjectId: otherSubject.id };

function event(id, kind, date, description = id, subjectId = subject.id, phaseId = null) {
  return {
    id,
    subjectId,
    phaseId,
    kind,
    description,
    date,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const legacy = codec.normalizeWorkspaceData({ subjects: [subject], tasks: [], phases: [] });
assert.deepEqual(legacy.subjectEvents, []);

const normalized = codec.normalizeWorkspaceData({
  subjects: [subject],
  tasks: [],
  phases: [phase],
  subjectEvents: [
    event("deadline", "deadline", "2026-08-10", "  Entrega final  ", subject.id, phase.id),
    event("milestone", "milestone", "2026-07-30", "Aprobación"),
    event("empty", "milestone", "2026-07-31", "   "),
    event("invalid-date", "deadline", "2026-02-30"),
    event("invalid-kind", "note", "2026-07-31"),
    event("orphan", "milestone", "2026-07-31", "Huérfano", "missing"),
  ],
});
assert.deepEqual(normalized.subjectEvents.map((item) => item.id), ["deadline", "milestone"]);
assert.equal(normalized.subjectEvents[0].description, "Entrega final");
assert.equal(normalized.subjectEvents[0].phaseId, phase.id);
assert.equal(normalized.subjectEvents[1].phaseId, null);
assert.deepEqual(
  tasks.sortedSubjectEvents(normalized.subjectEvents, subject.id).map((item) => item.id),
  ["milestone", "deadline"],
);

const invalidPhaseReference = codec.normalizeWorkspaceData({
  subjects: [subject, otherSubject],
  tasks: [],
  phases: [phase, otherPhase],
  subjectEvents: [
    event("invalid-phase", "deadline", "2026-08-11", "Invalid phase", subject.id, otherPhase.id),
  ],
});
assert.equal(invalidPhaseReference.subjectEvents[0].phaseId, null);

assert.equal(tasks.isValidDateOnly("2026-02-29"), false);
assert.equal(tasks.isValidDateOnly("2028-02-29"), true);
assert.equal(
  tasks.isValidSubjectEventDraft({ kind: "milestone", description: " ", date: "2026-08-01" }),
  false,
);

const created = tasks.createSubjectEvent(
  subject.id,
  { kind: "milestone", description: "  Firma del acuerdo  ", date: "2026-08-01", phaseId: phase.id },
  new Date(timestamp),
);
assert.equal(created.description, "Firma del acuerdo");
assert.equal(created.phaseId, phase.id);
assert.equal(
  tasks.patchSubjectEvent(created, { date: "2026-02-30" }, new Date(timestamp)),
  null,
);
assert.equal(
  tasks.patchSubjectEvent(created, { kind: "deadline", description: "  Cierre  " }, new Date(timestamp))
    .description,
  "Cierre",
);
assert.equal(tasks.patchSubjectEvent(created, { phaseId: null }, new Date(timestamp)).phaseId, null);

const workspace = {
  subjects: [subject],
  phases: [phase],
  tasks: [],
  subjectEvents: [created],
};
assert.deepEqual(tasks.removeSubjectEventFromWorkspace(workspace, created.id).subjectEvents, []);
assert.equal(tasks.removePhaseFromWorkspace(workspace, phase.id, timestamp).subjectEvents[0].phaseId, null);
assert.deepEqual(tasks.removeSubjectFromWorkspace(workspace, subject.id, timestamp).subjectEvents, []);

console.log("Subject milestone and deadline tests passed.");
