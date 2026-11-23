import { subjectHorizons, type Subject, type SubjectHorizon } from "../../lib/tasks";
import { sortedSubjects } from "./task-ui";

export const planningHorizons = [...subjectHorizons].sort(
  (a, b) => Number(a.value === "closure") - Number(b.value === "closure"),
);

export function groupSubjectsByHorizon(subjects: Subject[]) {
  const groups = new Map<SubjectHorizon, Subject[]>(
    planningHorizons.map(({ value }) => [value, []]),
  );

  for (const subject of sortedSubjects(subjects)) {
    groups.get(subject.horizon)?.push(subject);
  }

  return planningHorizons.map((horizon) => ({
    ...horizon,
    subjects: groups.get(horizon.value) ?? [],
  }));
}
