"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, CheckCircle, Circle, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

interface CreditInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: any;
  onChange?: () => void;
}

export function CreditInstallmentsModal({ isOpen, onClose, credit, onChange }: CreditInstallmentsModalProps) {
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && credit) {
      loadInstallments();
    }
  }, [isOpen, credit]);

  const loadInstallments = async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection("credit_installments").getList(1, 100, {
        filter: `credit = "${credit.id}"`,
        sort: 'due_date',
      });
      setInstallments(records.items);
    } catch (error: any) {
      if (error.isAbort) return;
      console.error("Error loading installments:", error);
      // Don't alert here to avoid spamming if collection doesn't exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (installment: any) => {
    try {
      const newStatus = installment.status === 'paid' ? 'pending' : 'paid';
      const data = {
        status: newStatus,
        payment_date: newStatus === 'paid' ? new Date().toISOString() : null
      };
      
      await pb.collection("credit_installments").update(installment.id, data);
      await loadInstallments();
      if (onChange) onChange();
    } catch (error) {
      console.error("Error updating installment:", error);
      alert("Error al actualizar la cuota");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Cuotas - {credit?.name}
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Gestiona los pagos de las cuotas de tu crédito.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : installments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
            <p className="text-gray-500 dark:text-gray-400">No hay cuotas registradas para este crédito.</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {installments.map((inst, index) => (
                <div 
                  key={inst.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    inst.status === 'paid' 
                      ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10' 
                      : 'border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleStatus(inst)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        inst.status === 'paid'
                          ? 'text-green-600 hover:text-green-700 dark:text-green-400'
                          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                      }`}
                    >
                      {inst.status === 'paid' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Cuota {index + 1}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>Vence: {formatDate(inst.due_date)}</span>
                      </div>
                      {inst.payment_date && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Pagado el: {formatDate(inst.payment_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: credit?.currency || 'ARS' }).format(inst.amount)}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      inst.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {inst.status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
