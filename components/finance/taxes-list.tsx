"use client";

import { FileText, Pencil, Trash2, Calendar } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { formatDate } from "@/lib/date-utils";

interface TaxesListProps {
  taxes: any[];
  onEdit: (tax: any) => void;
  onUpdate: () => void;
}

export function TaxesList({ taxes, onEdit, onUpdate }: TaxesListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este impuesto?")) return;
    
    try {
      await pb.collection("taxes").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting tax:", error);
      alert("No se pudo eliminar el impuesto");
    }
  };

  if (taxes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes impuestos registrados</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Agrega tus obligaciones tributarias para llevar un control.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {taxes.map((tax) => (
        <div
          key={tax.id}
          className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/20">
                <FileText className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{tax.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tax.frequency === 'monthly' ? 'Mensual' : 
                     tax.frequency === 'bimonthly' ? 'Bimestral' :
                     tax.frequency === 'yearly' ? 'Anual' : 'Pago Único'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(tax)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-gray-300"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(tax.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Monto Estimado</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {tax.currency === 'USD' ? 'US$' : '$'} {tax.amount?.toLocaleString('es-UY')}
              </span>
            </div>
            {tax.next_due_date && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Próximo vencimiento: {formatDate(tax.next_due_date)}</span>
                </div>
            )}
             <div className="flex items-center gap-2 text-sm">
                 <div className={`h-2 w-2 rounded-full ${tax.is_automatic_debit ? 'bg-green-500' : 'bg-yellow-500'}`} />
                 <span className="text-gray-600 dark:text-gray-300">
                     {tax.is_automatic_debit ? 'Débito Automático' : 'Pago Manual'}
                 </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
