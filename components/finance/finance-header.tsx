"use client";

import { Plus } from "lucide-react";

interface FinanceHeaderProps {
  onNewTransaction: () => void;
}

export function FinanceHeader({ onNewTransaction }: FinanceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona tus ingresos y gastos
        </p>
      </div>
      <button
        onClick={onNewTransaction}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        <Plus className="h-4 w-4" />
        Nueva Transacción
      </button>
    </div>
  );
}
