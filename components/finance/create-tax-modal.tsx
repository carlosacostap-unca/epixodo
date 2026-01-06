"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";
import { toInputDate, fromInputDateToUTC } from "@/lib/date-utils";

interface CreateTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taxToEdit?: any;
}

export function CreateTaxModal({ isOpen, onClose, onSuccess, taxToEdit }: CreateTaxModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [isAutomaticDebit, setIsAutomaticDebit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taxToEdit) {
        setName(taxToEdit.name);
        setDescription(taxToEdit.description || "");
        setFrequency(taxToEdit.frequency || "monthly");
        setNextDueDate(toInputDate(taxToEdit.next_due_date));
        setAmount(taxToEdit.amount?.toString() || "");
        setCurrency(taxToEdit.currency || "ARS");
        setIsAutomaticDebit(taxToEdit.is_automatic_debit || false);
      } else {
        setName("");
        setDescription("");
        setFrequency("monthly");
        setNextDueDate("");
        setAmount("");
        setCurrency("ARS");
        setIsAutomaticDebit(false);
      }
    }
  }, [isOpen, taxToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        description,
        frequency,
        next_due_date: fromInputDateToUTC(nextDueDate),
        amount: parseFloat(amount) || 0,
        currency,
        is_automatic_debit: isAutomaticDebit,
        user: pb.authStore.model?.id,
      };

      if (taxToEdit) {
        await pb.collection("taxes").update(taxToEdit.id, data);
      } else {
        await pb.collection("taxes").create(data);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving tax:", error);
      alert("Error al guardar el impuesto. Asegúrate de haber creado la colección 'taxes' en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {taxToEdit ? "Editar Impuesto" : "Nuevo Impuesto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Ej. Contribución Inmobiliaria"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frecuencia
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="monthly">Mensual</option>
                <option value="bimonthly">Bimestral</option>
                <option value="yearly">Anual</option>
                <option value="one_time">Pago Único</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Próximo Vencimiento
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto Estimado
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="ARS">Peso Argentino ($)</option>
                <option value="USD">Dólar Americano (US$)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAutomaticDebit"
              checked={isAutomaticDebit}
              onChange={(e) => setIsAutomaticDebit(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <label htmlFor="isAutomaticDebit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Débito Automático
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {taxToEdit ? "Guardar Cambios" : "Crear Impuesto"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
