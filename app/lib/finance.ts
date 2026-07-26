import { createId, isValidDateOnly } from "./tasks";

export type FinanceAccountType =
  | "cash"
  | "bank"
  | "digital_wallet"
  | "credit"
  | "investment"
  | "other";

export type FinanceEntryKind = "income" | "expense";
export type FinanceDuePaymentStatus = "pending" | "paid";
export type FinanceDuePaymentUrgency = "overdue" | "today" | "upcoming" | "paid";

export type FinanceAccount = {
  id: string;
  name: string;
  type: FinanceAccountType;
  currency: string;
  openingBalanceMinor: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceEntry = {
  id: string;
  accountId: string;
  kind: FinanceEntryKind;
  date: string;
  description: string;
  amountMinor: number;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceDuePayment = {
  id: string;
  accountId: string;
  description: string;
  amountMinor: number;
  dueDate: string;
  category: string;
  status: FinanceDuePaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceAccountDraft = Pick<
  FinanceAccount,
  "name" | "type" | "currency" | "openingBalanceMinor"
>;

export type FinanceEntryDraft = Pick<
  FinanceEntry,
  "accountId" | "kind" | "date" | "description" | "amountMinor"
> & {
  category?: string;
};

export type FinanceDuePaymentDraft = Pick<
  FinanceDuePayment,
  "accountId" | "description" | "amountMinor" | "dueDate"
> & {
  category?: string;
};

export type FinanceCurrencySummary = {
  currency: string;
  balanceMinor: number;
  incomeMinor: number;
  expenseMinor: number;
};

export const financeAccountTypes: { value: FinanceAccountType; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "bank", label: "Cuenta bancaria" },
  { value: "digital_wallet", label: "Billetera virtual" },
  { value: "credit", label: "Tarjeta o crédito" },
  { value: "investment", label: "Inversión" },
  { value: "other", label: "Otra" },
];

export function isFinanceAccountType(value: unknown): value is FinanceAccountType {
  return financeAccountTypes.some((type) => type.value === value);
}

export function isFinanceEntryKind(value: unknown): value is FinanceEntryKind {
  return value === "income" || value === "expense";
}

export function isFinanceDuePaymentStatus(value: unknown): value is FinanceDuePaymentStatus {
  return value === "pending" || value === "paid";
}

export function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

export function parseMinorAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const isNegative = normalized.startsWith("-");
  const unsigned = isNegative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  const signed = isNegative ? -minor : minor;

  return Number.isSafeInteger(signed) ? signed : null;
}

export function minorAmountToInput(value: number): string {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  return `${sign}${Math.floor(absolute / 100)},${`${absolute % 100}`.padStart(2, "0")}`;
}

export function formatMoney(valueMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueMinor / 100);
  } catch {
    return `${currency} ${(valueMinor / 100).toFixed(2)}`;
  }
}

export function isValidFinanceAccountDraft(draft: FinanceAccountDraft): boolean {
  return (
    Boolean(draft.name.trim()) &&
    isFinanceAccountType(draft.type) &&
    isCurrencyCode(draft.currency) &&
    Number.isSafeInteger(draft.openingBalanceMinor)
  );
}

export function isValidFinanceEntryDraft(
  draft: FinanceEntryDraft,
  accountIds?: Set<string>,
): boolean {
  return (
    Boolean(draft.accountId) &&
    (!accountIds || accountIds.has(draft.accountId)) &&
    isFinanceEntryKind(draft.kind) &&
    isValidDateOnly(draft.date) &&
    Boolean(draft.description.trim()) &&
    Number.isSafeInteger(draft.amountMinor) &&
    draft.amountMinor > 0
  );
}

export function isValidFinanceDuePaymentDraft(
  draft: FinanceDuePaymentDraft,
  accountIds?: Set<string>,
): boolean {
  return (
    Boolean(draft.accountId) &&
    (!accountIds || accountIds.has(draft.accountId)) &&
    Boolean(draft.description.trim()) &&
    Number.isSafeInteger(draft.amountMinor) &&
    draft.amountMinor > 0 &&
    isValidDateOnly(draft.dueDate)
  );
}

export function createFinanceAccount(
  draft: FinanceAccountDraft,
  now = new Date(),
): FinanceAccount | null {
  const normalized = {
    ...draft,
    name: draft.name.trim(),
    currency: draft.currency.trim().toUpperCase(),
  };

  if (!isValidFinanceAccountDraft(normalized)) {
    return null;
  }

  const timestamp = now.toISOString();
  return {
    id: createId("account"),
    ...normalized,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchFinanceAccount(
  account: FinanceAccount,
  patch: Partial<FinanceAccountDraft>,
  hasEntries: boolean,
  now = new Date(),
): FinanceAccount | null {
  const nextCurrency = (patch.currency ?? account.currency).trim().toUpperCase();

  if (hasEntries && nextCurrency !== account.currency) {
    return null;
  }

  const updated: FinanceAccount = {
    ...account,
    ...patch,
    name: patch.name?.trim() ?? account.name,
    currency: nextCurrency,
    updatedAt: now.toISOString(),
  };

  return isValidFinanceAccountDraft(updated) ? updated : null;
}

export function createFinanceEntry(
  draft: FinanceEntryDraft,
  accountIds: Set<string>,
  now = new Date(),
): FinanceEntry | null {
  const normalized = {
    ...draft,
    description: draft.description.trim(),
    category: draft.category?.trim() ?? "",
  };

  if (!isValidFinanceEntryDraft(normalized, accountIds)) {
    return null;
  }

  const timestamp = now.toISOString();
  return {
    id: createId("entry"),
    ...normalized,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchFinanceEntry(
  entry: FinanceEntry,
  patch: Partial<FinanceEntryDraft>,
  accountIds: Set<string>,
  now = new Date(),
): FinanceEntry | null {
  const updated: FinanceEntry = {
    ...entry,
    ...patch,
    description: patch.description?.trim() ?? entry.description,
    category: patch.category === undefined ? entry.category : patch.category.trim(),
    updatedAt: now.toISOString(),
  };

  return isValidFinanceEntryDraft(updated, accountIds) ? updated : null;
}

export function createFinanceDuePayment(
  draft: FinanceDuePaymentDraft,
  accountIds: Set<string>,
  now = new Date(),
): FinanceDuePayment | null {
  const normalized = {
    ...draft,
    description: draft.description.trim(),
    category: draft.category?.trim() ?? "",
  };

  if (!isValidFinanceDuePaymentDraft(normalized, accountIds)) {
    return null;
  }

  const timestamp = now.toISOString();
  return {
    id: createId("due-payment"),
    ...normalized,
    status: "pending",
    paidAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function patchFinanceDuePayment(
  payment: FinanceDuePayment,
  patch: Partial<FinanceDuePaymentDraft>,
  accountIds: Set<string>,
  now = new Date(),
): FinanceDuePayment | null {
  const updated: FinanceDuePayment = {
    ...payment,
    ...patch,
    description: patch.description?.trim() ?? payment.description,
    category: patch.category === undefined ? payment.category : patch.category.trim(),
    updatedAt: now.toISOString(),
  };

  return isValidFinanceDuePaymentDraft(updated, accountIds) ? updated : null;
}

export function setFinanceDuePaymentStatus(
  payment: FinanceDuePayment,
  status: FinanceDuePaymentStatus,
  now = new Date(),
): FinanceDuePayment {
  const timestamp = now.toISOString();
  return {
    ...payment,
    status,
    paidAt: status === "paid" ? timestamp : null,
    updatedAt: timestamp,
  };
}

export function getFinanceDuePaymentUrgency(
  payment: FinanceDuePayment,
  today: string,
): FinanceDuePaymentUrgency {
  if (payment.status === "paid") return "paid";
  if (payment.dueDate < today) return "overdue";
  if (payment.dueDate === today) return "today";
  return "upcoming";
}

export function sortedFinanceDuePayments(payments: FinanceDuePayment[]): FinanceDuePayment[] {
  return [...payments].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    if (a.status === "pending") {
      return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);
    }
    return (b.paidAt ?? b.updatedAt).localeCompare(a.paidAt ?? a.updatedAt);
  });
}

export function sortedFinanceEntries(entries: FinanceEntry[]): FinanceEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

export function getAccountBalanceMinor(
  account: FinanceAccount,
  entries: FinanceEntry[],
): number {
  return entries.reduce((balance, entry) => {
    if (entry.accountId !== account.id) {
      return balance;
    }

    return balance + (entry.kind === "income" ? entry.amountMinor : -entry.amountMinor);
  }, account.openingBalanceMinor);
}

export function getFinanceCurrencySummaries(
  accounts: FinanceAccount[],
  entries: FinanceEntry[],
  month: string,
): FinanceCurrencySummary[] {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const summaries = new Map<string, FinanceCurrencySummary>();

  for (const account of accounts) {
    const current = summaries.get(account.currency) ?? {
      currency: account.currency,
      balanceMinor: 0,
      incomeMinor: 0,
      expenseMinor: 0,
    };
    current.balanceMinor += account.openingBalanceMinor;
    summaries.set(account.currency, current);
  }

  for (const entry of entries) {
    const account = accountById.get(entry.accountId);
    if (!account) {
      continue;
    }

    const summary = summaries.get(account.currency);
    if (!summary) {
      continue;
    }

    summary.balanceMinor += entry.kind === "income" ? entry.amountMinor : -entry.amountMinor;

    if (entry.date.startsWith(`${month}-`)) {
      if (entry.kind === "income") {
        summary.incomeMinor += entry.amountMinor;
      } else {
        summary.expenseMinor += entry.amountMinor;
      }
    }
  }

  return [...summaries.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

export function removeFinanceAccount(
  accounts: FinanceAccount[],
  entries: FinanceEntry[],
  accountId: string,
  duePayments: FinanceDuePayment[] = [],
): { accounts: FinanceAccount[]; entries: FinanceEntry[]; duePayments: FinanceDuePayment[] } {
  return {
    accounts: accounts.filter((account) => account.id !== accountId),
    entries: entries.filter((entry) => entry.accountId !== accountId),
    duePayments: duePayments.filter((payment) => payment.accountId !== accountId),
  };
}

export function getFinanceAccountTypeLabel(type: FinanceAccountType): string {
  return financeAccountTypes.find((item) => item.value === type)?.label ?? "Otra";
}
