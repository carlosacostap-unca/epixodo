"use client";

import { useState, useEffect, useCallback } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, Calendar, Trash2, Plus, AlertCircle } from "lucide-react";
import { formatDate, fromInputDateToUTC } from "@/lib/date-utils";

interface CreditCardStatement {
  id: string;
  period: string; // YYYY-MM format
  closing_date: string;
  due_date: string;
  card: string;
  total_amount: number;
  min_amount: number;
  status: 'pending' | 'paid';
  payment_type?: 'total' | 'partial' | 'minimum';
  paid_amount?: number;
}

interface CreditCardStatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    name: string;
  } | null;
}

export function CreditCardStatementsModal({ isOpen, onClose, card }: CreditCardStatementsModalProps) {
  const [statements, setStatements] = useState<CreditCardStatement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [period, setPeriod] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [status, setStatus] = useState<'pending' | 'paid'>("pending");
  const [paymentType, setPaymentType] = useState<'total' | 'partial' | 'minimum'>("total");
  const [paidAmount, setPaidAmount] = useState("");

  useEffect(() => {
    if (isOpen && card) {
      setError(null);
      fetchStatements();
      // Set default next month period
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const year = nextMonth.getFullYear();
      const month = String(nextMonth.getMonth() + 1).padStart(2, "0");
      setPeriod(`${year}-${month}`);
      setClosingDate("");
      setDueDate("");
      setTotalAmount("");
      setMinAmount("");
      setStatus("pending");
      setPaymentType("total");
      setPaidAmount("");
    }
  }, [isOpen, card]);

  const fetchStatements = async () => {
    if (!card) return;
    setIsLoading(true);
    try {
      const records = await pb.collection("credit_card_statements").getList(1, 50, {
        filter: `card = "${card.id}"`,
        sort: "-period",
      });
      setStatements(records.items as unknown as CreditCardStatement[]);
    } catch (error) {
      console.error("Error fetching statements:", error);
      // If collection doesn't exist yet, we'll just show empty list
      setStatements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {
        card: card.id,
        period,
        closing_date: fromInputDateToUTC(closingDate),
        due_date: fromInputDateToUTC(dueDate),
        total_amount: parseFloat(totalAmount) || 0,
        min_amount: parseFloat(minAmount) || 0,
        status,
        user: pb.authStore.model?.id,
      };

      if (status === 'paid') {
        data.payment_type = paymentType;
        data.paid_amount = parseFloat(paidAmount) || 0;
      }

      await pb.collection("credit_card_statements").create(data);
      
      // Reset form (except period, maybe increment it? Nah, just clear dates)
      setClosingDate("");
      setDueDate("");
      
      await fetchStatements();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error creating statement:", error);
      alert("Error al guardar el resumen. Asegúrate de que la colección 'credit_card_statements' exista.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este resumen?")) return;

    try {
      await pb.collection("credit_card_statements").delete(id);
      await fetchStatements();
    } catch (error) {
      console.error("Error deleting statement:", error);
      alert("No se pudo eliminar el resumen");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[80vh] flex flex-col">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Resúmenes: {card?.name}
        </h2>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Add New Statement Form */}
        <form onSubmit={handleAddStatement} className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Nuevo Resumen Mensual</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Periodo</label>
              <input
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Cierre</label>
              <input
                type="date"
                required
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Vencimiento</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Total a Pagar</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Mínimo a Pagar</label>
              <input
                type="number"
                step="0.01"
                required
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
          </div>

          {status === 'paid' && (
            <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400">Tipo de Pago</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as 'total' | 'partial' | 'minimum')}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="total">Pago Total</option>
                  <option value="partial">Pago Parcial</option>
                  <option value="minimum">Pago Mínimo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400">Monto Pagado</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar
            </button>
          </div>
        </form>

        {/* List of Statements */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : statements.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No hay resúmenes cargados para esta tarjeta.</p>
              <p className="text-xs mt-1">Usa el formulario de arriba para agregar uno.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2">Periodo</th>
                  <th className="px-4 py-2">Cierre</th>
                  <th className="px-4 py-2">Vencimiento</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {statements.map((stmt) => (
                  <tr key={stmt.id} className="group">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {stmt.period}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(stmt.closing_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(stmt.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(stmt.id)}
                        className="rounded-full p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Eliminar resumen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
