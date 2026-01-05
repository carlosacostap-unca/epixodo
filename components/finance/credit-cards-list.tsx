"use client";

import { CreditCard, Calendar, Pencil, Trash2, CalendarRange } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { pb } from "@/lib/pocketbase";
import { CreditCardStatementsModal } from "./credit-card-statements-modal";
import { formatDate } from "@/lib/date-utils";

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
  const [statementsCard, setStatementsCard] = useState<CreditCard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nextDueDates, setNextDueDates] = useState<Record<string, string | null>>({});

  const fetchDueDates = useCallback(async () => {
    const dates: Record<string, string | null> = {};
    const today = new Date().toISOString().split('T')[0];

    await Promise.all(cards.map(async (card) => {
      try {
        const records = await pb.collection("credit_card_statements").getList(1, 1, {
          filter: `card = "${card.id}" && due_date >= "${today}"`,
          sort: "due_date",
          requestKey: null,
        });
        
        if (records.items.length > 0) {
          dates[card.id] = records.items[0].due_date;
        } else {
          dates[card.id] = null;
        }
      } catch (error) {
        console.error("Error fetching due date for card:", card.id, error);
        dates[card.id] = null;
      }
    }));
    setNextDueDates(dates);
  }, [cards]);

  useEffect(() => {
    if (cards.length > 0) {
      fetchDueDates();
    }
  }, [fetchDueDates]);

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
                onClick={() => setStatementsCard(card)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                aria-label={`Gestionar vencimientos de ${card.name}`}
                title="Gestionar vencimientos mensuales"
              >
                <CalendarRange className="h-4 w-4" />
              </button>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {nextDueDates[card.id] 
                    ? `Próximo vencimiento: ${formatDate(nextDueDates[card.id]!)}`
                    : "Sin datos sobre el próximo vencimiento"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
      <CreditCardStatementsModal
        isOpen={!!statementsCard}
        onClose={() => {
          setStatementsCard(null);
          fetchDueDates();
        }}
        card={statementsCard}
      />
    </div>
  );
}
