import {
  createFinanceDuePayment,
  createFinanceEntry,
  type FinanceAccount,
  type FinanceDuePayment,
  type FinanceDuePaymentDraft,
  type FinanceEntry,
  type FinanceEntryDraft,
} from "../../lib/finance";

export type FinanceSuggestionAction =
  | { type: "finance_entry"; currency: string; draft: FinanceEntryDraft }
  | { type: "finance_due_payment"; draft: FinanceDuePaymentDraft };

type PreparedSuggestion =
  | { error: string }
  | { entry: FinanceEntry }
  | { payment: FinanceDuePayment };

export function prepareFinanceSuggestion(
  action: FinanceSuggestionAction,
  accounts: FinanceAccount[],
  now: Date,
): PreparedSuggestion {
  const currency = action.type === "finance_entry" ? action.currency : action.draft.currency;
  const account = accounts.find(({ id }) => id === action.draft.accountId);
  if (action.draft.accountId && account?.currency !== currency) {
    return { error: `La cuenta elegida ya no está disponible en ${currency}. Elegí otra cuenta y volvé a confirmar.` };
  }

  if (action.type === "finance_entry") {
    const entry = createFinanceEntry(action.draft, new Set(account ? [account.id] : []), now);
    return entry ? { entry } : { error: "Revisá la cuenta, fecha, descripción e importe del movimiento." };
  }

  const payment = createFinanceDuePayment(
    action.draft,
    new Map(account ? [[account.id, account.currency]] : []),
    now,
  );
  return payment ? { payment } : { error: "Revisá la moneda, fecha, descripción e importe del pago." };
}
