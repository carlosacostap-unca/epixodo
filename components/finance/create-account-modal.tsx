"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, Wallet, Building2, PiggyBank, MoreHorizontal } from "lucide-react";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit?: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
  } | null;
}

export function CreateAccountModal({ isOpen, onClose, onSuccess, accountToEdit }: CreateAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("ARS");

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setName(accountToEdit.name);
        setType(accountToEdit.type);
        setBalance(accountToEdit.balance.toString());
        setCurrency(accountToEdit.currency || "ARS");
      } else {
        setName("");
        setType("bank");
        setBalance("");
        setCurrency("ARS");
      }
    }
  }, [isOpen, accountToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        type,
        balance: parseFloat(balance),
        currency,
        user: pb.authStore.model?.id,
      };

      if (accountToEdit) {
        await pb.collection("accounts").update(accountToEdit.id, data);
      } else {
        await pb.collection("accounts").create(data);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {accountToEdit ? "Editar Cuenta" : "Nueva Cuenta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de la cuenta
            </label>
            <input
              id="name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
              placeholder="Ej. Banco Santander"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'bank', label: 'Banco', icon: Building2 },
                { id: 'cash', label: 'Efectivo', icon: Wallet },
                { id: 'savings', label: 'Ahorro', icon: PiggyBank },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    type === item.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Balance & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Saldo Actual
              </label>
              <input
                id="balance"
                type="number"
                step="0.01"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Moneda
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="ARS">Peso Argentino ($)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-900"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {accountToEdit ? "Actualizar" : "Crear Cuenta"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
