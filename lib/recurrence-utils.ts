import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday
  endDate?: string; // ISO date string
}

export const RECURRENCE_OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: 'No repetir', value: 'none' },
  { label: 'Diariamente', value: 'daily' },
  { label: 'Semanalmente', value: 'weekly' },
  { label: 'Mensualmente', value: 'monthly' },
  { label: 'Anualmente', value: 'yearly' },
];

/**
 * Parses a JSON string into a RecurrenceRule, or returns null if invalid/none.
 */
export function parseRecurrenceRule(json: string | unknown): RecurrenceRule | null {
  if (!json) return null;
  try {
    const rule = typeof json === 'string' ? JSON.parse(json) : json;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((rule as any).frequency === 'none' || !(rule as any).frequency) return null;
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      frequency: (rule as any).frequency,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: (rule as any).interval || 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      daysOfWeek: (rule as any).daysOfWeek,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      endDate: (rule as any).endDate
    };
  } catch {
    return null;
  }
}

/**
 * Calculates the next due date based on the completed date (or current due date) and the rule.
 * Usually for "completion based" recurrence, we calculate from the *completion date* or the *original due date*.
 * Todoist style: "Every day" -> due tomorrow (relative to today). "Every monday" -> next monday.
 * 
 * @param fromDate The date to calculate from (usually the completion date or the current due date)
 * @param rule The recurrence rule
 */
export function calculateNextDueDate(fromDate: Date, rule: RecurrenceRule): Date | null {
  if (!rule || rule.frequency === 'none') return null;

  let nextDate = new Date(fromDate);
  const { frequency, interval = 1 } = rule;

  switch (frequency) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;
    case 'weekly':
        // Simple weekly: Add N weeks.
        // If daysOfWeek is present, find the next matching day.
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
            // Find next day in the current week or next week
            // This logic can be complex. For MVP, let's stick to simple "Add Interval Weeks".
            // Or if we want "Every Mon, Wed", we need to find the next occurrence.
            // Let's implement simple "Same day of week" if daysOfWeek is empty.
             nextDate = addWeeks(nextDate, interval);
        } else {
             nextDate = addWeeks(nextDate, interval);
        }
      break;
    case 'monthly':
      nextDate = addMonths(nextDate, interval);
      break;
    case 'yearly':
      nextDate = addYears(nextDate, interval);
      break;
  }

  // Check end date
  if (rule.endDate) {
    const end = new Date(rule.endDate);
    if (isAfter(nextDate, end)) {
      return null;
    }
  }

  return nextDate;
}

export function formatRecurrenceRule(rule: RecurrenceRule): string {
  if (!rule || rule.frequency === 'none') return '';
  
  const frequencyLabel = RECURRENCE_OPTIONS.find(o => o.value === rule.frequency)?.label || rule.frequency;
  const intervalLabel = rule.interval > 1 ? `Cada ${rule.interval} ` : '';
  
  // Adjust label for plural intervals
  let finalFreq = frequencyLabel;
  if (rule.interval > 1) {
      if (rule.frequency === 'daily') finalFreq = 'días';
      if (rule.frequency === 'weekly') finalFreq = 'semanas';
      if (rule.frequency === 'monthly') finalFreq = 'meses';
      if (rule.frequency === 'yearly') finalFreq = 'años';
  } else {
       // Singular implies "Diariamente" etc which is fine.
       // If "Cada 1 Diariamente" -> wrong.
       // Ideally: "Diariamente" or "Cada 2 días".
       if (rule.interval === 1) return frequencyLabel;
  }

  return `${intervalLabel}${finalFreq}`;
}
