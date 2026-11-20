"use client";

import { useMemo } from "react";
import {
  createFinanceAccount,
  createFinanceDuePayment,
  createFinanceEntry,
  getAccountBalanceMinor,
  getFinanceDuePaymentUrgency,
  getFinanceCurrencySummaries,
  patchFinanceAccount,
  patchFinanceDuePayment,
  patchFinanceEntry,
  removeFinanceAccount,
  setFinanceDuePaymentStatus,
  sortedFinanceDuePayments,
  sortedFinanceEntries,
  type FinanceAccount,
  type FinanceAccountDraft,
  type FinanceDuePayment,
  type FinanceDuePaymentDraft,
  type FinanceDuePaymentStatus,
  type FinanceEntry,
  type FinanceEntryDraft,
} from "../../lib/finance";

export type FinanceData = {
  financeAccounts: FinanceAccount[];
  financeEntries: FinanceEntry[];
  financeDuePayments: FinanceDuePayment[];
};

export function useFinanceWorkspace(
  { financeAccounts, financeEntries, financeDuePayments }: FinanceData,
  today: string,
  updateFinance: (update: (current: FinanceData) => FinanceData) => void,
) {
  const balances = useMemo(
    () =>
      new Map(
        financeAccounts.map((account) => [
          account.id,
          getAccountBalanceMinor(account, financeEntries),
        ]),
      ),
    [financeAccounts, financeEntries],
  );
  const summaries = useMemo(
    () =>
      getFinanceCurrencySummaries(
        financeAccounts,
        financeEntries,
        today.slice(0, 7),
      ),
    [today, financeAccounts, financeEntries],
  );
  const recentEntries = useMemo(
    () => sortedFinanceEntries(financeEntries),
    [financeEntries],
  );
  const orderedDuePayments = useMemo(
    () => sortedFinanceDuePayments(financeDuePayments),
    [financeDuePayments],
  );
  const duePaymentCounts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    for (const payment of financeDuePayments) {
      if (payment.status !== "pending") continue;
      pending += 1;
      if (getFinanceDuePaymentUrgency(payment, today) === "overdue") overdue += 1;
    }
    return { pending, overdue };
  }, [today, financeDuePayments]);
  const accountById = useMemo(
    () => new Map(financeAccounts.map((account) => [account.id, account])),
    [financeAccounts],
  );
  const paymentsRequiringAttention = useMemo(
    () => orderedDuePayments.filter((payment) => {
      const urgency = getFinanceDuePaymentUrgency(payment, today);
      return urgency === "today" || urgency === "overdue";
    }),
    [orderedDuePayments, today],
  );

  function addAccount(draft: FinanceAccountDraft) {
    const account = createFinanceAccount(draft);
    if (!account) {
      return;
    }

    updateFinance((current) => ({
      ...current,
      financeAccounts: [...current.financeAccounts, account],
    }));
  }

  function updateAccount(accountId: string, patch: Partial<FinanceAccountDraft>) {
    updateFinance((current) => {
      const account = current.financeAccounts.find((item) => item.id === accountId);
      if (!account) {
        return current;
      }

      const updated = patchFinanceAccount(
        account,
        patch,
        current.financeEntries.some((entry) => entry.accountId === accountId),
      );
      if (!updated) {
        return current;
      }

      return {
        ...current,
        financeAccounts: current.financeAccounts.map((item) =>
          item.id === accountId ? updated : item,
        ),
      };
    });
  }

  function deleteAccount(accountId: string) {
    updateFinance((current) => {
      const removed = removeFinanceAccount(
        current.financeAccounts,
        current.financeEntries,
        accountId,
        current.financeDuePayments,
      );
      return {
        ...current,
        financeAccounts: removed.accounts,
        financeEntries: removed.entries,
        financeDuePayments: removed.duePayments,
      };
    });
  }

  function addEntry(draft: FinanceEntryDraft) {
    updateFinance((current) => {
      const entry = createFinanceEntry(
        draft,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return entry
        ? { ...current, financeEntries: [...current.financeEntries, entry] }
        : current;
    });
  }

  function updateEntry(entryId: string, patch: Partial<FinanceEntryDraft>) {
    updateFinance((current) => {
      const entry = current.financeEntries.find((item) => item.id === entryId);
      if (!entry) {
        return current;
      }

      const updated = patchFinanceEntry(
        entry,
        patch,
        new Set(current.financeAccounts.map((account) => account.id)),
      );
      return updated
        ? {
            ...current,
            financeEntries: current.financeEntries.map((item) =>
              item.id === entryId ? updated : item,
            ),
          }
        : current;
    });
  }

  function deleteEntry(entryId: string) {
    updateFinance((current) => ({
      ...current,
      financeEntries: current.financeEntries.filter((entry) => entry.id !== entryId),
    }));
  }

  function addDuePayment(draft: FinanceDuePaymentDraft) {
    updateFinance((current) => {
      const payment = createFinanceDuePayment(
        draft,
        new Map(current.financeAccounts.map((account) => [account.id, account.currency])),
      );
      return payment
        ? { ...current, financeDuePayments: [...current.financeDuePayments, payment] }
        : current;
    });
  }

  function updateDuePayment(
    paymentId: string,
    patch: Partial<FinanceDuePaymentDraft>,
  ) {
    updateFinance((current) => {
      const payment = current.financeDuePayments.find((item) => item.id === paymentId);
      if (!payment) return current;
      const updated = patchFinanceDuePayment(
        payment,
        patch,
        new Map(current.financeAccounts.map((account) => [account.id, account.currency])),
      );
      return updated
        ? {
            ...current,
            financeDuePayments: current.financeDuePayments.map((item) =>
              item.id === paymentId ? updated : item,
            ),
          }
        : current;
    });
  }

  function setDuePaymentStatus(paymentId: string, status: FinanceDuePaymentStatus) {
    updateFinance((current) => ({
      ...current,
      financeDuePayments: current.financeDuePayments.map((payment) =>
        payment.id === paymentId ? setFinanceDuePaymentStatus(payment, status) : payment,
      ),
    }));
  }

  function deleteDuePayment(paymentId: string) {
    updateFinance((current) => ({
      ...current,
      financeDuePayments: current.financeDuePayments.filter(
        (payment) => payment.id !== paymentId,
      ),
    }));
  }

  return {
    today,
    accounts: financeAccounts,
    entries: financeEntries,
    duePayments: financeDuePayments,
    accountById,
    paymentsRequiringAttention,
    balances,
    summaries,
    recentEntries,
    orderedDuePayments,
    duePaymentCounts,
    addAccount,
    updateAccount,
    deleteAccount,
    addEntry,
    updateEntry,
    deleteEntry,
    addDuePayment,
    updateDuePayment,
    setDuePaymentStatus,
    deleteDuePayment,
  };
}

export type FinanceWorkspace = ReturnType<typeof useFinanceWorkspace>;
