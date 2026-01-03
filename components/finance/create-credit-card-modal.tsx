"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";

interface CreateCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardToEdit?: {
    id: string;
    name: string;
    closing_date: number;
    due_date: number;
  } | null;
}

export function CreateCreditCardModal({ isOpen, onClose, onSuccess, cardToEdit }: CreateCreditCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [closingDate, setClosingDate] = useState("1");
  const [dueDate, setDueDate] = useState("10");

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        setName(cardToEdit.name);
        setClosingDate(cardToEdit.closing_date.toString());
        setDueDate(cardToEdit.due_date.toString());
      } else {
        setName("");
        setClosingDate("1");
        setDueDate("10");
      }
    }
  }, [isOpen, cardToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        closing_date: parseInt(closingDate),
        due_date: parseInt(dueDate),
        user: pb.authStore.model?.id,
      };

      if (cardToEdit) {
        await pb.collection("credit_cards").update(cardToEdit.id, data);
      } else {
        await pb.collection("credit_cards").create(data);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving credit card:", error);
      const errorData = error.response?.data || {};
      const errorDetails = Object.entries(errorData)
        .map(([key, val]: [string, any]) => `${key}: ${val.message}`)
        .join("\n");
      
      alert(`Error al guardar la tarjeta:\n${errorDetails || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {cardToEdit ? "Editar Tarjeta" : "Nueva Tarjeta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de la tarjeta
            </label>
            <input
              id="name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
              placeholder="Ej. Visa Galicia"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="closing" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Día de Cierre
              </label>
              <select
                id="closing"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Día {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="due" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Día de Vencimiento
              </label>
              <select
                id="due"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Día {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {cardToEdit ? "Guardar Cambios" : "Crear Tarjeta"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
