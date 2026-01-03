"use client";

import { Wallet, Building2, PiggyBank, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { pb } from "@/lib/pocketbase";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface AccountsListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onUpdate: () => void;
}

export function AccountsList({ accounts, onEdit, onUpdate }: AccountsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) return;
    
    setDeletingId(id);
    try {
      await pb.collection("accounts").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("No se pudo eliminar la cuenta");
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return Building2;
      case 'savings': return PiggyBank;
      default: return Wallet;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || 'ARS',
    }).format(amount);
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <Wallet className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes cuentas</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Agrega una cuenta para empezar a gestionar tu dinero.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const Icon = getIcon(account.type);
        
        return (
          <div
            key={account.id}
            className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {account.type === 'bank' ? 'Banco' : account.type === 'savings' ? 'Ahorro' : 'Efectivo'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(account)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                  aria-label={`Editar ${account.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={deletingId === account.id}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  aria-label={`Eliminar ${account.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo disponible</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>
            
            {/* Decorative gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        );
      })}
    </div>
  );
}
