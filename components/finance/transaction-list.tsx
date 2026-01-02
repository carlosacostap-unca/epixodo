"use client";

import { pb } from "@/lib/pocketbase";
import { formatDate } from "@/lib/date-utils";
import { Trash2, ArrowUpRight, ArrowDownLeft, Pencil } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: () => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onUpdate, onEdit }: TransactionListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta transacción?")) return;

    try {
      await pb.collection("transactions").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
          No hay transacciones registradas
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Añade una nueva transacción para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-zinc-800/50 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">Fecha</th>
              <th className="px-6 py-3 font-medium">Descripción</th>
              <th className="px-6 py-3 font-medium">Categoría</th>
              <th className="px-6 py-3 font-medium text-right">Monto</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      transaction.type === "income" 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-zinc-800 dark:text-gray-300">
                    {transaction.category}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${
                  transaction.type === "income"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="invisible text-blue-600 hover:text-blue-700 group-hover:visible dark:text-blue-400 dark:hover:text-blue-300"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="invisible text-red-600 hover:text-red-700 group-hover:visible dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
