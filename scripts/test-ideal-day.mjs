import assert from "node:assert/strict";
import { copyIdealDayGoals, createIdealDayGoal, patchIdealDayGoal, getIdealDayGoals, getPreviousIdealDayDates, idealDayGoalMatchesQuery, isIdealDayGoalAlreadyAdded } from "../app/lib/ideal-day.ts";
import { emptyWorkspace } from "../app/lib/tasks.ts";
import { normalizeWorkspaceData, parseWorkspaceJson, hasWorkspaceContent } from "../app/lib/workspace-codec.ts";
import { loadWorkspace, saveWorkspace } from "../app/lib/task-storage.ts";

const draft = { date: "2026-11-06", title: "  Leer un capítulo  ", notes: "  Después del almuerzo.  " };
const goal = createIdealDayGoal(draft);
assert.ok(goal);
assert.equal(goal.title, "Leer un capítulo");
assert.equal(goal.notes, "Después del almuerzo.");
assert.equal(goal.completed, false);
assert.equal(createIdealDayGoal({ ...draft, title: "   " }), null);
assert.equal(createIdealDayGoal({ ...draft, title: "a".repeat(301) }), null);
assert.equal(createIdealDayGoal({ ...draft, notes: "a".repeat(10001) }), null);
for (const date of ["", "2026-02-29", "2026-11-31", "06/11/2026"]) {
  assert.equal(createIdealDayGoal({ ...draft, date }), null, `reject invalid date ${date}`);
}
assert.ok(createIdealDayGoal({ ...draft, date: "2028-02-29" }));

const completed = patchIdealDayGoal(goal, { completed: true, title: "  Leer dos capítulos " });
assert.equal(completed.id, goal.id);
assert.equal(completed.createdAt, goal.createdAt);
assert.equal(completed.date, goal.date);
assert.equal(completed.title, "Leer dos capítulos");
assert.equal(completed.completed, true);
assert.equal(patchIdealDayGoal(completed, { completed: false }).completed, false);
assert.equal(patchIdealDayGoal(goal, { title: " " }), null);
assert.equal(goal.completed, false, "editing must not mutate the original");

const tomorrow = createIdealDayGoal({ ...draft, date: "2026-11-07" });
const goals = [tomorrow, completed];
assert.deepEqual(getIdealDayGoals(goals, "2026-11-06"), [completed]);
assert.deepEqual(getIdealDayGoals(goals, "2026-11-08"), []);
assert.equal(idealDayGoalMatchesQuery(completed, " LEER "), true);
assert.equal(idealDayGoalMatchesQuery(completed, "almuerzo"), true);
assert.equal(idealDayGoalMatchesQuery(completed, "correr"), false);

const originalGoals = structuredClone(goals);
assert.deepEqual(getPreviousIdealDayDates(goals, "2026-11-08"), ["2026-11-07", "2026-11-06"]);
assert.deepEqual(getPreviousIdealDayDates(goals, "2026-11-07"), ["2026-11-06"]);
assert.deepEqual(getPreviousIdealDayDates(goals, "2026-11-06"), []);
assert.deepEqual(getPreviousIdealDayDates([...goals, { ...completed, id: "another" }], "2026-11-08"), ["2026-11-07", "2026-11-06"]);
const copies = copyIdealDayGoals(goals, [completed.id, completed.id, "missing"], "2026-11-08");
assert.equal(copies.length, 1, "copy only the selected existing goals once");
assert.notEqual(copies[0].id, completed.id, "copies must have their own identity");
assert.equal(copies[0].date, "2026-11-08");
assert.equal(copies[0].title, completed.title);
assert.equal(copies[0].notes, completed.notes);
assert.equal(copies[0].completed, false, "previously completed goals start pending");
assert.deepEqual(goals, originalGoals, "reusing goals must preserve the source day");
assert.equal(isIdealDayGoalAlreadyAdded(completed, [...goals, ...copies], "2026-11-08"), true);
assert.equal(isIdealDayGoalAlreadyAdded(tomorrow, [...goals, ...copies], "2026-11-08"), false);
assert.deepEqual(copyIdealDayGoals([...goals, ...copies], [completed.id], "2026-11-08"), [], "repeated copying must not duplicate goals");
assert.deepEqual(copyIdealDayGoals(goals, [completed.id, tomorrow.id], "2026-11-06"), [], "same-day and future goals cannot be reused as past goals");
assert.deepEqual(copyIdealDayGoals(goals, [completed.id], "2026-02-30"), []);
assert.deepEqual(copyIdealDayGoals(goals, [], "2026-11-08"), []);
assert.equal(copyIdealDayGoals(goals, goals.map((item) => item.id), "2026-11-08").length, 2, "copy all selected objectives from prior days");
const duplicateHistory = [...goals, { ...completed, id: "duplicate", title: ` ${completed.title.toUpperCase()} ` }];
assert.equal(copyIdealDayGoals(duplicateHistory, [completed.id, "duplicate"], "2026-11-08").length, 1, "equivalent objectives must be deduplicated within the same operation");
const editedCopy = patchIdealDayGoal(copies[0], { title: "Una meta para hoy", completed: true });
assert.equal(editedCopy.completed, true);
assert.deepEqual(goals, originalGoals, "editing a copy must not alter its source");

const workspace = { ...emptyWorkspace(), idealDayGoals: goals };
assert.equal(hasWorkspaceContent(workspace), true, "a workspace with only ideal-day goals has content");
assert.deepEqual(parseWorkspaceJson(JSON.stringify(workspace)).idealDayGoals, goals);
const reusedWorkspace = { ...workspace, idealDayGoals: [...goals, ...copies] };
assert.deepEqual(parseWorkspaceJson(JSON.stringify(reusedWorkspace)).idealDayGoals, reusedWorkspace.idealDayGoals, "copies survive workspace persistence with their own date and pending status");
assert.deepEqual(normalizeWorkspaceData({ tasks: [] }).idealDayGoals, [], "older workspaces remain compatible");
const invalid = [null, {}, { ...goal, date: "2026-02-30" }, { ...goal, completed: "false" }, { ...goal, title: " " }];
assert.deepEqual(normalizeWorkspaceData({ ...emptyWorkspace(), idealDayGoals: [...invalid, completed] }).idealDayGoals, [completed]);
assert.equal(normalizeWorkspaceData(workspace).tasks.length, 0, "goals must not become tasks");

let stored = null;
globalThis.window = { localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value; } } };
saveWorkspace(workspace);
assert.deepEqual(loadWorkspace().idealDayGoals, goals, "local storage preserves dates, notes and completion");
delete globalThis.window;
assert.deepEqual(loadWorkspace().idealDayGoals, []);

console.log("Ideal-day tests passed");
