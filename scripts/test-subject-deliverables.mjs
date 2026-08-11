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
  const localRequire = (specifier) => specifier.startsWith(".")
    ? loadTypeScriptModule(path.extname(path.resolve(path.dirname(resolved), specifier))
      ? path.resolve(path.dirname(resolved), specifier)
      : `${path.resolve(path.dirname(resolved), specifier)}.ts`)
    : nodeRequire(specifier);
  new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, loaded, loaded.exports, resolved, path.dirname(resolved));
  return loaded.exports;
}

const tasks = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "tasks.ts"));
const codec = loadTypeScriptModule(path.join(__dirname, "..", "app", "lib", "workspace-codec.ts"));
const timestamp = "2026-07-30T12:00:00.000Z";
const subject = { id: "subject-1", name: "Asunto", parentSubjectId: null, horizon: "none", createdAt: timestamp, updatedAt: timestamp };
const otherSubject = { ...subject, id: "subject-2", name: "Otro" };
const deliverable = { id: "deliverable-1", subjectId: subject.id, name: "Informe", description: "Informe final aprobado", createdAt: timestamp, updatedAt: timestamp };
const task = { id: "task-1", title: "Revisar", notes: "", status: "pending", subjectIds: [subject.id], phaseId: null, deliverableId: deliverable.id, parentTaskId: null, hacerEl: null, venceEl: null, priority: "normal", aiSuggestion: null, createdAt: timestamp, updatedAt: timestamp, completedAt: null };

assert.equal(tasks.isValidSubjectDeliverableDraft({ name: "Informe", description: "Final" }), true);
assert.equal(tasks.isValidSubjectDeliverableDraft({ name: "", description: "Final" }), false);
assert.equal(tasks.patchSubjectDeliverable(deliverable, { description: "  Revisado  " }, new Date(timestamp)).description, "Revisado");
assert.equal(tasks.patchSubjectDeliverable(deliverable, { description: "" }), null);
assert.equal(tasks.normalizeTaskDeliverableAssignment([deliverable], [subject.id], deliverable.id), deliverable.id);
assert.equal(tasks.normalizeTaskDeliverableAssignment([deliverable], [otherSubject.id], deliverable.id), null);

const workspace = { ...tasks.emptyWorkspace(), subjects: [subject, otherSubject], deliverables: [deliverable], tasks: [task] };
const removedDeliverable = tasks.removeSubjectDeliverableFromWorkspace(workspace, deliverable.id, timestamp);
assert.deepEqual(removedDeliverable.deliverables, []);
assert.equal(removedDeliverable.tasks[0].deliverableId, null);
assert.equal(removedDeliverable.tasks[0].id, task.id);

const removedSubject = tasks.removeSubjectFromWorkspace(workspace, subject.id, timestamp);
assert.deepEqual(removedSubject.deliverables, []);
assert.equal(removedSubject.tasks[0].deliverableId, null);
assert.equal(removedSubject.tasks[0].id, task.id);

const legacy = codec.normalizeWorkspaceData({ subjects: [subject], tasks: [{ ...task, deliverableId: undefined }] });
assert.deepEqual(legacy.deliverables, []);
assert.equal(legacy.tasks[0].deliverableId, null);

const normalized = codec.normalizeWorkspaceData({ subjects: [subject, otherSubject], deliverables: [deliverable], tasks: [task, { ...task, id: "task-2", subjectIds: [otherSubject.id] }] });
assert.equal(normalized.tasks[0].deliverableId, deliverable.id);
assert.equal(normalized.tasks[1].deliverableId, null);
assert.deepEqual(codec.normalizeWorkspaceData(JSON.parse(JSON.stringify(normalized))), normalized);

console.log("Subject deliverable tests passed.");
