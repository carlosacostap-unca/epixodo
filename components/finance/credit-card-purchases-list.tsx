"use client";

import { pb } from "@/lib/pocketbase";
import { formatDate } from "@/lib/date-utils";
import { Trash2, Pencil, CreditCard, Calendar, List } from "lucide-react";

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: "pending" | "paid";
}

interface Purchase {
  id: string;
  title: string;
  description: string;
  purchase_date: string;
  credit_card: string;
  total_amount: number;
  end_date: string;
  expand?: {
    credit_card?: {
      name: string;
      last_four_digits: string;
    };
    "credit_card_installments(purchase)"?: Installment[];
  };
}

interface CreditCardPurchasesListProps {
  purchases: Purchase[];
  onUpdate: () => void;
  onEdit: (purchase: Purchase) => void;
}

export function CreditCardPurchasesList({ purchases, onUpdate, onEdit }: CreditCardPurchasesListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta compra? Esto también eliminará todas sus cuotas.")) return;

    try {
      await pb.collection("credit_card_purchases").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  if (purchases.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
          No hay compras registradas
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Añade una nueva compra para comenzar
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
              <th className="px-6 py-3 font-medium">Título / Descripción</th>
              <th className="px-6 py-3 font-medium">Tarjeta</th>
              <th className="px-6 py-3 font-medium text-right">Monto Total</th>
              <th className="px-6 py-3 font-medium text-center">Cuotas</th>
              <th className="px-6 py-3 font-medium">Finalización</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {purchases.map((purchase) => {
              const installments = purchase.expand?.["credit_card_installments(purchase)"] || [];
              const paidInstallments = installments.filter(i => i.status === 'paid').length;
              const totalInstallments = installments.length;

              return (
                <tr key={purchase.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(purchase.purchase_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {purchase.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CreditCard className="h-4 w-4" />
                      <span>{purchase.expand?.credit_card?.name || "Desconocida"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      <List className="h-3 w-3" />
                      {paidInstallments}/{totalInstallments}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(purchase.end_date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(purchase)}
                        className="invisible text-blue-600 hover:text-blue-700 group-hover:visible dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="invisible text-red-600 hover:text-red-700 group-hover:visible dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
