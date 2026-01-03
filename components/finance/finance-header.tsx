"use client";

import { Plus } from "lucide-react";

interface FinanceHeaderProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function FinanceHeader({ 
  title = "Finanzas", 
  description = "Gestiona tus ingresos y gastos", 
  actionLabel = "Nueva Transacción", 
  onAction 
}: FinanceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
