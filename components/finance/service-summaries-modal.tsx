"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, Plus, Trash2, CheckCircle, Circle, Calendar } from "lucide-react";
import { formatDate, toInputDate, fromInputDateToUTC } from "@/lib/date-utils";

interface ServiceSummary {
  id: string;
  period: string; // ISO date string representing the month
  amount: number;
  due_date: string;
  status: "pending" | "paid";
  payment_date?: string;
}

interface ServiceSummariesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  onChange?: () => void;
}

export function ServiceSummariesModal({ isOpen, onClose, service, onChange }: ServiceSummariesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState<ServiceSummary[]>([]);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newPeriod, setNewPeriod] = useState(""); // YYYY-MM
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const loadSummaries = async () => {
    if (!service) return;
    setIsLoading(true);
    try {
      const records = await pb.collection("service_summaries").getList(1, 100, {
        filter: `service = "${service.id}"`,
        sort: '-period', // Newest first
      });
      setSummaries(records.items as unknown as ServiceSummary[]);
    } catch (error: any) {
      if (error.isAbort) return;
      // Ignore 404 missing collection error while the user sets it up
      if (error.status === 404) return;
      console.error("Error loading summaries:", error);
      // Silent error or user notification depending on severity
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && service) {
      loadSummaries();
      // Reset form
      setIsAdding(false);
      const now = new Date();
      setNewPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setNewAmount("");
      setNewDueDate("");
    }
  }, [isOpen, service]);

  const handleAddSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    try {
      setIsLoading(true);
      // Period is stored as the first day of the month in UTC
      const periodDate = new Date(`${newPeriod}-01T00:00:00Z`); // Simple construction
      
      const data = {
        service: service.id,
        period: fromInputDateToUTC(`${newPeriod}-01`), // Standardize to UTC
        amount: parseFloat(newAmount),
        due_date: fromInputDateToUTC(newDueDate),
        status: "pending",
        user: pb.authStore.model?.id,
      };

      await pb.collection("service_summaries").create(data);
      
      setIsAdding(false);
      setNewAmount("");
      setNewDueDate("");
      await loadSummaries();
      onChange?.();
    } catch (error) {
      console.error("Error creating summary:", error);
      alert("Error al crear el resumen. Asegúrate de tener la colección 'service_summaries'.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (summary: ServiceSummary) => {
    try {
      const newStatus = summary.status === 'pending' ? 'paid' : 'pending';
      const data = {
        status: newStatus,
        payment_date: newStatus === 'paid' ? new Date().toISOString() : null,
      };

      await pb.collection("service_summaries").update(summary.id, data);
      await loadSummaries();
      onChange?.();
    } catch (error) {
      console.error("Error updating summary:", error);
      alert("No se pudo actualizar el estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este resumen?")) return;
    try {
      await pb.collection("service_summaries").delete(id);
      await loadSummaries();
      onChange?.();
    } catch (error) {
      console.error("Error deleting summary:", error);
    }
  };

  const formatPeriod = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    // Use the timezone from date-utils context if possible, but for Month/Year usually simple UTC is fine if stored as such.
    // However, let's use Intl for consistency with app locale
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between pr-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resúmenes de {service?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Administra tus facturas y pagos
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {isAdding ? "Cancelar" : "Agregar Resumen"}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddSummary} className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Periodo (Mes/Año)
                </label>
                <input
                  type="month"
                  required
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Vencimiento
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Monto Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Resumen"}
              </button>
            </div>
          </form>
        )}

        {isLoading && !isAdding ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No hay resúmenes registrados para este servicio.
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  summary.status === 'paid' 
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10' 
                    : 'border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleStatus(summary)}
                    className={`rounded-full p-1 transition-colors ${
                      summary.status === 'paid'
                        ? 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {summary.status === 'paid' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {formatPeriod(summary.period)}
                      </h4>
                      {summary.status === 'pending' && new Date(summary.due_date) < new Date() && (
                         <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                           Vencido
                         </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {formatDate(summary.due_date)}
                      </span>
                      {summary.payment_date && (
                        <span className="text-green-600 dark:text-green-400">
                          Pagado el {formatDate(summary.payment_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-lg font-semibold ${
                    summary.status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {service?.currency === 'USD' ? 'US$' : '$'} {summary.amount?.toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => handleDelete(summary.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
