import { createId, isValidDateOnly, type DateOnly } from "./tasks";

export type IdealDayGoal = {
  id: string;
  date: DateOnly;
  title: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IdealDayGoalDraft = Pick<IdealDayGoal, "date" | "title" | "notes">;

export function isValidIdealDayGoalDraft(draft: IdealDayGoalDraft): boolean {
  return isValidDateOnly(draft.date) && draft.title.trim().length > 0 &&
    draft.title.trim().length <= 300 && draft.notes.trim().length <= 10000;
}

export function createIdealDayGoal(draft: IdealDayGoalDraft): IdealDayGoal | null {
  if (!isValidIdealDayGoalDraft(draft)) return null;
  const timestamp = new Date().toISOString();
  return {
    id: createId("ideal-goal"),
    date: draft.date,
    title: draft.title.trim(),
    notes: draft.notes.trim(),
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchIdealDayGoal(
  goal: IdealDayGoal,
  patch: Partial<Pick<IdealDayGoal, "title" | "notes" | "completed">>,
): IdealDayGoal | null {
  const next = { ...goal, ...patch };
  if (!isValidIdealDayGoalDraft(next) || typeof next.completed !== "boolean") return null;
  return {
    ...next,
    title: next.title.trim(),
    notes: next.notes.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function getIdealDayGoals(goals: IdealDayGoal[], date: DateOnly): IdealDayGoal[] {
  return goals.filter((goal) => goal.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function idealDayGoalMatchesQuery(goal: IdealDayGoal, query: string): boolean {
  return `${goal.title} ${goal.notes}`.toLocaleLowerCase("es")
    .includes(query.trim().toLocaleLowerCase("es"));
}

export function getPreviousIdealDayDates(goals: IdealDayGoal[], beforeDate: DateOnly): DateOnly[] {
  return [...new Set(goals.filter((goal) => goal.date < beforeDate).map((goal) => goal.date))]
    .sort((a, b) => b.localeCompare(a));
}

function goalContentKey(goal: Pick<IdealDayGoal, "title" | "notes">): string {
  return JSON.stringify([goal.title.trim().toLocaleLowerCase("es"), goal.notes.trim()]);
}

export function isIdealDayGoalAlreadyAdded(goal: IdealDayGoal, goals: IdealDayGoal[], date: DateOnly): boolean {
  const key = goalContentKey(goal);
  return goals.some((item) => item.date === date && goalContentKey(item) === key);
}

export function copyIdealDayGoals(goals: IdealDayGoal[], goalIds: string[], targetDate: DateOnly): IdealDayGoal[] {
  if (!isValidDateOnly(targetDate)) return [];
  const selectedIds = new Set(goalIds);
  const existing = new Set(goals.filter((goal) => goal.date === targetDate).map(goalContentKey));
  const copies: IdealDayGoal[] = [];

  for (const goal of goals) {
    if (!selectedIds.has(goal.id) || goal.date >= targetDate || existing.has(goalContentKey(goal))) continue;
    const copy = createIdealDayGoal({ date: targetDate, title: goal.title, notes: goal.notes });
    if (!copy) continue;
    copies.push(copy);
    existing.add(goalContentKey(goal));
  }
  return copies;
}
