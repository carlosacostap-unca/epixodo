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

  if (moduleCache.has(resolved)) {
    return moduleCache.get(resolved).exports;
  }

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
    if (!specifier.startsWith(".")) {
      return nodeRequire(specifier);
    }

    const base = path.resolve(path.dirname(resolved), specifier);
    const target = path.extname(base) ? base : `${base}.ts`;
    return loadTypeScriptModule(target);
  }

  const execute = new Function("require", "module", "exports", "__filename", "__dirname", output);
  execute(localRequire, loaded, loaded.exports, resolved, path.dirname(resolved));
  return loaded.exports;
}

const tasks = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "tasks.ts"));
const codec = loadTypeScriptModule(
  path.join(__dirname, "..", "app", "lib", "workspace-codec.ts"),
);

const timestamp = "2026-07-19T12:00:00.000Z";
const subjectA = {
  id: "subject-a",
  name: "Asunto A",
  parentSubjectId: null,
  horizon: "none",
  createdAt: timestamp,
  updatedAt: timestamp,
};
const subjectB = { ...subjectA, id: "subject-b", name: "Asunto B" };

function phase(id, subjectId, order) {
  return {
    id,
    subjectId,
    name: id,
    plannedStart: null,
    executedStart: null,
    plannedEnd: null,
    executedEnd: null,
    order,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function task(id, subjectIds, phaseId) {
  return {
    id,
    title: id,
    notes: "",
    status: "pending",
    subjectIds,
    phaseId,
    parentTaskId: null,
    hacerEl: null,
    venceEl: null,
    priority: "normal",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
}

const legacy = codec.normalizeWorkspaceData({
  subjects: [subjectA],
  tasks: [{ ...task("legacy", [subjectA.id], null), phaseId: undefined }],
});
assert.deepEqual(legacy.phases, []);
assert.equal(legacy.tasks[0].phaseId, null);

const normalized = codec.normalizeWorkspaceData({
  subjects: [subjectA, subjectB],
  phases: [phase("late", subjectA.id, 9), phase("early", subjectA.id, -2)],
  tasks: [
    task("compatible", [subjectA.id], "early"),
    task("incompatible", [subjectB.id], "early"),
    task("dangling", [subjectA.id], "missing"),
  ],
});
assert.deepEqual(normalized.phases.map((item) => [item.id, item.order]), [
  ["early", 0],
  ["late", 1],
]);
assert.equal(normalized.tasks[0].phaseId, "early");
assert.equal(normalized.tasks[1].phaseId, null);
assert.equal(normalized.tasks[2].phaseId, null);

assert.equal(
  tasks.getPhaseDateRangeError({ plannedStart: "2026-07-20", plannedEnd: "2026-07-19" }),
  "planned",
);
assert.equal(
  tasks.getPhaseDateRangeError({ executedStart: "2026-07-20", executedEnd: "2026-07-19" }),
  "executed",
);
assert.equal(tasks.getPhaseDateRangeError({ plannedStart: "2026-07-20" }), null);

const reordered = tasks.reorderSubjectPhases(normalized.phases, subjectA.id, ["late", "early"]);
assert.deepEqual(tasks.sortedSubjectPhases(reordered, subjectA.id).map((item) => item.id), [
  "late",
  "early",
]);

const assignment = tasks.normalizeTaskPhaseAssignment(
  normalized.phases,
  [subjectB.id, subjectB.id],
  "early",
);
assert.deepEqual(assignment, {
  subjectIds: [subjectB.id, subjectA.id],
  phaseId: "early",
});

const removedPhase = tasks.removePhaseFromWorkspace(
  {
    subjects: [subjectA],
    phases: normalized.phases,
    tasks: [task("assigned", [subjectA.id], "early")],
  },
  "early",
  timestamp,
);
assert.equal(removedPhase.tasks[0].phaseId, null);
assert.deepEqual(removedPhase.tasks[0].subjectIds, [subjectA.id]);
assert.deepEqual(removedPhase.phases.map((item) => item.order), [0]);

const removedSubject = tasks.removeSubjectFromWorkspace(
  {
    subjects: [subjectA, subjectB],
    phases: [phase("owned", subjectA.id, 0)],
    tasks: [task("survives", [subjectA.id, subjectB.id], "owned")],
  },
  subjectA.id,
  timestamp,
);
assert.equal(removedSubject.tasks.length, 1);
assert.equal(removedSubject.tasks[0].phaseId, null);
assert.deepEqual(removedSubject.tasks[0].subjectIds, [subjectB.id]);

const roundTrip = codec.normalizeWorkspaceData(JSON.parse(JSON.stringify(normalized)));
assert.deepEqual(roundTrip, normalized);

console.log("Subject phase tests passed.");
