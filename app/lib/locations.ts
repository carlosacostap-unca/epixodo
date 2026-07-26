export type LocationEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedLocation: string;
  actualLocation: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type LocationEntryDraft = Pick<
  LocationEntry,
  "date" | "startTime" | "endTime" | "plannedLocation" | "actualLocation" | "notes"
>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidLocationEntryDraft(draft: LocationEntryDraft) {
  return (
    DATE_PATTERN.test(draft.date) &&
    TIME_PATTERN.test(draft.startTime) &&
    TIME_PATTERN.test(draft.endTime) &&
    draft.startTime < draft.endTime &&
    draft.plannedLocation.trim().length > 0
  );
}

export function createLocationEntry(draft: LocationEntryDraft): LocationEntry | null {
  if (!isValidLocationEntryDraft(draft)) return null;
  const timestamp = new Date().toISOString();
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return {
    id: `location-${random}`,
    ...draft,
    plannedLocation: draft.plannedLocation.trim(),
    actualLocation: draft.actualLocation.trim(),
    notes: draft.notes.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchLocationEntry(
  entry: LocationEntry,
  patch: Partial<LocationEntryDraft>,
): LocationEntry | null {
  const next = { ...entry, ...patch };
  if (!isValidLocationEntryDraft(next)) return null;
  return {
    ...next,
    plannedLocation: next.plannedLocation.trim(),
    actualLocation: next.actualLocation.trim(),
    notes: next.notes.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function locationMatchesQuery(entry: LocationEntry, query: string) {
  const normalized = query.trim().toLocaleLowerCase("es");
  if (!normalized) return true;
  return `${entry.plannedLocation} ${entry.actualLocation} ${entry.notes}`
    .toLocaleLowerCase("es")
    .includes(normalized);
}
