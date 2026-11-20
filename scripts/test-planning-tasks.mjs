import assert from "node:assert/strict";
import {
  createSubject,
  createSubjectDeliverable,
  createSubjectPhase,
  getReviewedUnassignedTasks,
  getSubjectTasks,
} from "../app/lib/tasks.ts";
import {
  preparePlanningTask,
  preparePlanningTaskPatch,
  taskAssignmentError,
} from "../app/modules/planning/task-operations.ts";

const area = createSubject("Trabajo");
const branch = createSubject("Informes", "none", area.id);
const other = createSubject("Operaciones");
const phase = createSubjectPhase(area.id, { name: "Borrador" }, 0);
const deliverable = createSubjectDeliverable(area.id, { name: "Informe", description: "Versión inicial" });
const planning = { tasks: [], subjects: [area, branch, other], phases: [phase], deliverables: [deliverable] };
const original = preparePlanningTask(planning, {
  title: "Preparar informe", subjectIds: [area.id], phaseId: phase.id, deliverableId: deliverable.id,
});
const reviewed = { ...original, subjectIds: [], phaseId: null, deliverableId: null, inboxReviewed: true };
assert.equal(getReviewedUnassignedTasks([reviewed])[0].id, reviewed.id);
assert.match(taskAssignmentError(planning, ["asunto-eliminado"]), /ya no está disponible/);
assert.equal(taskAssignmentError(planning, [branch.id, other.id]), undefined);

const assigned = preparePlanningTaskPatch(planning, reviewed, { subjectIds: [branch.id, other.id, branch.id] });
assert.equal(assigned.id, reviewed.id);
assert.deepEqual(assigned.subjectIds, [branch.id, other.id]);
assert.equal(assigned.inboxReviewed, true);
assert.deepEqual(getReviewedUnassignedTasks([assigned]), []);
assert.deepEqual(getSubjectTasks([assigned], planning.subjects, area.id), [assigned]);
assert.deepEqual(getSubjectTasks([assigned], planning.subjects, other.id), [assigned]);

const joint = preparePlanningTaskPatch(planning, original, { subjectIds: [area.id, other.id] });
assert.equal(joint.phaseId, phase.id);
assert.equal(joint.deliverableId, deliverable.id);
const moved = preparePlanningTaskPatch(planning, joint, { subjectIds: [other.id] });
assert.equal(moved.phaseId, null);
assert.equal(moved.deliverableId, null);
const completed = preparePlanningTaskPatch(planning, moved, { status: "completed" });
assert.ok(completed.completedAt);
assert.deepEqual(getSubjectTasks([completed], planning.subjects, other.id), []);
assert.deepEqual(getSubjectTasks([completed], planning.subjects, other.id, true), [completed]);

console.log("Planning task assignments, lists and related records passed.");
