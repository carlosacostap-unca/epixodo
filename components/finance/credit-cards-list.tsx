"use client";

import { CreditCard, Calendar, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { pb } from "@/lib/pocketbase";
import { getNextClosingDate, formatDate } from "@/lib/date-utils";

interface CreditCard {
  id: string;
  name: string;
  closing_date: number;
  due_date: number;
}

interface CreditCardsListProps {
  cards: CreditCard[];
  onEdit: (card: CreditCard) => void;
  onUpdate: () => void;
}

export function CreditCardsList({ cards, onEdit, onUpdate }: CreditCardsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarjeta?")) return;
    
    setDeletingId(id);
    try {
      await pb.collection("credit_cards").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("No se pudo eliminar la tarjeta");
    } finally {
      setDeletingId(null);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes tarjetas</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Agrega una tarjeta de crédito para gestionar tus gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-zinc-800">
                <CreditCard className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
              </div>
            </div>
            
            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(card)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                aria-label={`Editar ${card.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(card.id)}
                disabled={deletingId === card.id}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                aria-label={`Eliminar ${card.name}`}
              >
                {deletingId === card.id ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cierre</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Día {card.closing_date}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400" title="Próxima fecha de cierre">
                    Próx: {formatDate(getNextClosingDate(card.closing_date).toISOString())}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Vencimiento</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Día {card.due_date}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
