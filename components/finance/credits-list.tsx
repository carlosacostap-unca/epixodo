"use client";

import { useState, useEffect } from "react";
import { Banknote, Pencil, Trash2 } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { formatDate } from "@/lib/date-utils";
import { CreditInstallmentsModal } from "./credit-installments-modal";

interface CreditsListProps {
  credits: any[];
  onEdit: (credit: any) => void;
  onUpdate: () => void;
}

interface CreditStats {
  [creditId: string]: {
    paidAmount: number;
    paidCount: number;
    totalCount: number;
    nextDueDate?: string;
    nextDueAmount?: number;
  }
}

export function CreditsList({ credits, onEdit, onUpdate }: CreditsListProps) {
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [stats, setStats] = useState<CreditStats>({});

  const loadStats = async () => {
    try {
      const user = pb.authStore.model?.id;
      if (!user) return;
      
      const installments = await pb.collection("credit_installments").getFullList({
        filter: `user = "${user}"`,
        sort: 'due_date',
      });
      
      const newStats: CreditStats = {};
      
      installments.forEach((inst: any) => {
        if (!newStats[inst.credit]) {
          newStats[inst.credit] = { paidAmount: 0, paidCount: 0, totalCount: 0 };
        }
        
        newStats[inst.credit].totalCount++;
        if (inst.status === 'paid') {
          newStats[inst.credit].paidAmount += (inst.amount || 0);
          newStats[inst.credit].paidCount++;
        } else if (inst.status === 'pending') {
          // Since we sorted by due_date, the first pending one we encounter is the next one
          if (!newStats[inst.credit].nextDueDate) {
            newStats[inst.credit].nextDueDate = inst.due_date;
            newStats[inst.credit].nextDueAmount = inst.amount;
          }
        }
      });
      
      setStats(newStats);
    } catch (error: any) {
      if (error.isAbort) return;
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [credits]); // Recalculate when credits list changes

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este crédito?")) return;
    
    try {
      await pb.collection("credits").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting credit:", error);
      alert("No se pudo eliminar el crédito");
    }
  };

  if (credits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <Banknote className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes créditos</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Agrega un préstamo o crédito para comenzar a gestionarlo.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {credits.map((credit) => {
          const creditStats = stats[credit.id] || { paidAmount: 0, paidCount: 0, totalCount: 0 };
          const remaining = Math.max(0, (credit.total_amount || 0) - creditStats.paidAmount);
          
          return (
          <div
            key={credit.id}
            className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2.5 dark:bg-green-900/20">
                  <Banknote className="h-6 w-6 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{credit.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{credit.lender}</p>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(credit)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-gray-300"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(credit.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Solicitado</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {credit.currency === 'USD' ? 'US$' : '$'} {credit.requested_amount?.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Monto Total</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {credit.currency === 'USD' ? 'US$' : '$'} {credit.total_amount?.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Restante</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {credit.currency === 'USD' ? 'US$' : '$'} {remaining.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cuotas Pagadas</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {creditStats.paidCount} / {creditStats.totalCount}
                </span>
              </div>
              {creditStats.nextDueDate && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Próximo Vencimiento</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(creditStats.nextDueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Monto Próxima Cuota</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {credit.currency === 'USD' ? 'US$' : '$'} {creditStats.nextDueAmount?.toLocaleString('es-AR')}
                    </span>
                  </div>
                </>
              )}
              {credit.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Fin Estimado</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(credit.end_date)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Estado</span>
                <span className={`font-medium ${credit.status === 'paid' ? 'text-green-600' : 'text-blue-600'}`}>
                  {credit.status === 'paid' ? 'Pagado' : 'Activo'}
                </span>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setSelectedCredit(credit);
                    setIsInstallmentsModalOpen(true);
                  }}
                  className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  Ver Cuotas
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>

      <CreditInstallmentsModal 
        isOpen={isInstallmentsModalOpen}
        onClose={() => {
          setIsInstallmentsModalOpen(false);
          setSelectedCredit(null);
        }}
        credit={selectedCredit}
        onChange={() => {
          loadStats();
          onUpdate();
        }}
      />
    </>
  );
}
