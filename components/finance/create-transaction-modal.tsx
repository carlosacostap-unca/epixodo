"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, DollarSign, Calendar, Tag, AlignLeft } from "lucide-react";
import { toInputDate, fromInputDateToUTC } from "@/lib/date-utils";

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: any[];
  transactionToEdit?: {
    id: string;
    amount: number;
    type: "income" | "expense";
    description: string;
    category: string;
    date: string;
    account?: string;
  } | null;
}

export function CreateTransactionModal({ isOpen, onClose, onSuccess, transactionToEdit, accounts }: CreateTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setAmount(transactionToEdit.amount.toString());
        setType(transactionToEdit.type);
        setDescription(transactionToEdit.description);
        setCategory(transactionToEdit.category);
        // Usamos toInputDate para formatear la fecha UTC a la zona horaria configurada
        setDate(toInputDate(transactionToEdit.date));
        setAccountId(transactionToEdit.account || "");
      } else {
        setAmount("");
        setDescription("");
        setCategory("");
        // Inicializamos con la fecha actual en la zona horaria configurada
        setDate(toInputDate(new Date().toISOString()));
        setType("expense");
        setAccountId(accounts.length > 0 ? accounts[0].id : "");
      }
    }
  }, [isOpen, transactionToEdit, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId) return;

    setIsLoading(true);

    try {
      // Convertimos la fecha del input (en zona horaria) a UTC para guardar
      const utcDate = fromInputDateToUTC(date);

      if (transactionToEdit) {
        await pb.collection("transactions").update(transactionToEdit.id, {
          amount: parseFloat(amount),
          type,
          description,
          category,
          date: utcDate,
          account: accountId,
        });
      } else {
        await pb.collection("transactions").create({
          amount: parseFloat(amount),
          type,
          description,
          category,
          date: utcDate,
          account: accountId,
          user: pb.authStore.model?.id,
        });
      }

      if (!transactionToEdit) {
        setAmount("");
        setDescription("");
        setCategory("");
        setDate(toInputDate(new Date().toISOString()));
        setType("expense");
        setAccountId(accounts.length > 0 ? accounts[0].id : "");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {transactionToEdit ? "Editar Transacción" : "Nueva Transacción"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description - AutoFocus */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <AlignLeft className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="description"
                type="text"
                required
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white pl-10 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
                placeholder="Ej: Compra de supermercado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-10 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 rounded-l-lg px-2 py-2 text-sm font-medium border ${
                    type === "income"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-700"
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 rounded-r-lg px-2 py-2 text-sm font-medium border ${
                    type === "expense"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-700"
                  }`}
                >
                  Gasto
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categoría
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-10 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
                  placeholder="Ej: Alimentación"
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cuenta
              </label>
              <div className="relative mt-1">
                <select
                  id="account"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white pl-10 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
              />
            </div>
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
