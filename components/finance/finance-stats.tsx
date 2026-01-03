"use client";

import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface FinanceStatsProps {
  transactions: Transaction[];
  accounts?: Account[];
}

export function FinanceStats({ transactions, accounts = [] }: FinanceStatsProps) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total balance from accounts if available, otherwise use transaction history
  const balance = accounts && accounts.length > 0 
    ? accounts.reduce((sum, acc) => sum + acc.balance, 0)
    : totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Balance */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
            <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance Total</p>
            <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(balance)}
            </h3>
          </div>
        </div>
      </div>

      {/* Income */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
            <ArrowUpCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos</p>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </h3>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <ArrowDownCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
