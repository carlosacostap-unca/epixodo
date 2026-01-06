"use client";

import { useState, useEffect, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";
import { toInputDate, fromInputDateToUTC } from "@/lib/date-utils";

interface CreateCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creditToEdit?: any;
}

export function CreateCreditModal({ isOpen, onClose, onSuccess, creditToEdit }: CreateCreditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [status, setStatus] = useState("active");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [generatedInstallments, setGeneratedInstallments] = useState<any[]>([]);
  
  const isLoadingData = useRef(false);

  // Efecto para generar la proyección de cuotas
  useEffect(() => {
    if (isLoadingData.current) return;

    const total = parseFloat(totalAmount);
    const count = parseInt(installmentsCount);
    
    if (!total || !count || count < 1 || !startDate) {
      setGeneratedInstallments([]);
      return;
    }

    const amountPerInstallment = total / count;
    const installments = [];
    
    // Parseamos la fecha de inicio para calcular los vencimientos
    // Asumimos que la fecha de inicio es la fecha de otorgamiento,
    // y el primer vencimiento es al mes siguiente.
    const [year, month, day] = startDate.split('-').map(Number);
    // Nota: month es 1-based en el split, pero Date usa 0-based
    
    for (let i = 1; i <= count; i++) {
      // Calculamos el vencimiento sumando i meses
      // Usamos UTC para evitar problemas de zona horaria en la suma de meses
      const dueDate = new Date(Date.UTC(year, month - 1 + i, day));
      
      // Formateamos a YYYY-MM-DD para visualización y posterior guardado
      const dueDateStr = dueDate.toISOString().split('T')[0];

      installments.push({
        number: i,
        amount: amountPerInstallment,
        due_date: dueDateStr,
        status: 'pending'
      });
    }

    setGeneratedInstallments(installments);
  }, [totalAmount, installmentsCount, startDate]);

  useEffect(() => {
    if (isOpen) {
      if (creditToEdit) {
        isLoadingData.current = true;
        setName(creditToEdit.name);
        setLender(creditToEdit.lender || "");
        setRequestedAmount(creditToEdit.requested_amount?.toString() || "");
        setTotalAmount(creditToEdit.total_amount?.toString() || "");
        setRemainingAmount(creditToEdit.remaining_amount?.toString() || "");
        setCurrency(creditToEdit.currency || "ARS");
        setStartDate(toInputDate(creditToEdit.start_date));
        setEndDate(toInputDate(creditToEdit.end_date));
        setInterestRate(creditToEdit.interest_rate?.toString() || "");
        setStatus(creditToEdit.status || "active");
        
        // Fetch existing installments
        pb.collection("credit_installments").getFullList({
          filter: `credit = "${creditToEdit.id}"`,
          sort: 'due_date'
        }).then(installments => {
          if (installments.length > 0) {
            setInstallmentsCount(installments.length.toString());
            const formatted = installments.map(inst => ({
              id: inst.id,
              number: inst.number,
              amount: inst.amount,
              due_date: toInputDate(inst.due_date),
              status: inst.status,
              payment_date: inst.payment_date
            }));
            setGeneratedInstallments(formatted);
          } else {
             setInstallmentsCount("1");
          }
          // Allow generation effect to run again after a delay
          setTimeout(() => { isLoadingData.current = false; }, 500);
        }).catch(err => {
          console.error("Error fetching installments:", err);
          setInstallmentsCount("1");
          isLoadingData.current = false;
        });

      } else {
        setName("");
        setLender("");
        setRequestedAmount("");
        setTotalAmount("");
        setRemainingAmount("");
        setCurrency("ARS");
        setStartDate("");
        setEndDate("");
        setInterestRate("");
        setStatus("active");
        setInstallmentsCount("1");
        setGeneratedInstallments([]);
      }
    }
  }, [isOpen, creditToEdit]);

  // Efecto para actualizar la fecha fin estimada basada en la última cuota
  useEffect(() => {
    if (generatedInstallments.length > 0) {
      const lastInstallment = generatedInstallments[generatedInstallments.length - 1];
      if (lastInstallment.due_date) {
        setEndDate(lastInstallment.due_date);
      }
    } else {
      setEndDate("");
    }
  }, [generatedInstallments]);

  // Efecto para calcular el monto restante automáticamente
  useEffect(() => {
    const total = parseFloat(totalAmount) || 0;
    
    if (creditToEdit) {
      // Si estamos editando, mantenemos la lógica de: Restante = NuevoTotal - Pagado
      // Pagado = TotalOriginal - RestanteOriginal
      const oldTotal = creditToEdit.total_amount || 0;
      const oldRemaining = creditToEdit.remaining_amount || 0;
      const paid = oldTotal - oldRemaining;
      
      const newRemaining = Math.max(0, total - paid);
      setRemainingAmount(newRemaining.toString());
    } else {
      // Si es nuevo, el restante es igual al total
      setRemainingAmount(total.toString());
    }
  }, [totalAmount, creditToEdit]);

  const handleInstallmentChange = (index: number, field: string, value: string) => {
    const newInstallments = [...generatedInstallments];
    if (field === 'amount') {
      newInstallments[index][field] = parseFloat(value) || 0;
    } else {
      newInstallments[index][field] = value;
    }
    setGeneratedInstallments(newInstallments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const currentUserId = pb.authStore.model?.id;
      if (!currentUserId) {
        alert("No se pudo identificar al usuario actual. Por favor, inicia sesión nuevamente.");
        setIsLoading(false);
        return;
      }

      const data = {
        name,
        requested_amount: parseFloat(requestedAmount) || 0,
        total_amount: parseFloat(totalAmount) || 0,
        remaining_amount: parseFloat(remainingAmount) || 0,
        currency,
        start_date: startDate ? fromInputDateToUTC(startDate) : null,
        end_date: endDate ? fromInputDateToUTC(endDate) : null,
        interest_rate: parseFloat(interestRate) || 0,
        status,
        user: currentUserId,
        lender,
      };

      let record;
      if (creditToEdit) {
        record = await pb.collection("credits").update(creditToEdit.id, data);
        
        // Actualizar cuotas: Borrar existentes y crear nuevas
        // Esto maneja cambios en cantidad, montos, fechas, etc.
        try {
          const existingInstallments = await pb.collection("credit_installments").getFullList({
            filter: `credit = "${creditToEdit.id}"`,
          });
          
          // Borrar anteriores
          await Promise.all(existingInstallments.map(i => pb.collection("credit_installments").delete(i.id)));
          
          // Crear nuevas (preservando estado si existe en generatedInstallments)
          if (generatedInstallments.length > 0) {
            const promises = generatedInstallments.map((inst) =>
              pb.collection("credit_installments").create({
                credit: record.id,
                number: inst.number,
                amount: inst.amount,
                due_date: inst.due_date.includes('T') ? inst.due_date : fromInputDateToUTC(inst.due_date),
                status: inst.status || "pending", 
                payment_date: inst.payment_date || null,
                user: currentUserId,
              }, { requestKey: null })
            );
            await Promise.all(promises);
          }
        } catch (err: any) {
          console.error("Error updating installments:", err);
          const msg = err?.data?.message || err?.message || JSON.stringify(err);
          alert(`El crédito se actualizó, pero hubo un error con las cuotas: ${msg}`);
        }

      } else {
        record = await pb.collection("credits").create(data);

        // Crear cuotas generadas
        if (generatedInstallments.length > 0) {
          try {
            const promises = generatedInstallments.map((inst) =>
              pb.collection("credit_installments").create({
                credit: record.id,
                number: inst.number,
                amount: inst.amount,
                due_date: inst.due_date.includes('T') ? inst.due_date : fromInputDateToUTC(inst.due_date),
                status: "pending",
                payment_date: null,
                user: currentUserId,
              }, { requestKey: null })
            );
            await Promise.all(promises);
          } catch (err: any) {
            console.error("Error creating installments:", err);
            const msg = err?.data?.message || err?.message || JSON.stringify(err);
            alert(`El crédito se creó, pero fallaron las cuotas: ${msg}`);
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving credit:", error);
      const msg = error?.data?.message || error?.message || "Error desconocido";
      alert(`Error al guardar el crédito: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {creditToEdit ? "Editar Crédito" : "Nuevo Crédito"}
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
              placeholder="Ej. Préstamo Auto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prestamista / Banco
            </label>
            <input
              type="text"
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Ej. Banco Santander"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Monto Solicitado
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto Total
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto Restante
              </label>
              <input
                type="number"
                step="0.01"
                readOnly
                value={remainingAmount}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white cursor-not-allowed"
              />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Solicitud
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cantidad de Cuotas
              </label>
              <input
                type="number"
                min="1"
                required
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {!creditToEdit && generatedInstallments.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Proyección de Cuotas</h3>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                  <thead className="bg-gray-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Vencimiento</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                    {generatedInstallments.map((inst, index) => (
                      <tr key={inst.number}>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{inst.number}</td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={inst.due_date}
                            onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-xs text-gray-500">
                              {currency === 'USD' ? 'US$' : '$'}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={inst.amount}
                              onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                              className="w-full rounded border border-gray-300 bg-white pl-8 pr-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha Fin Estimada
              </label>
              <input
                type="date"
                readOnly
                value={endDate}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="active">Activo</option>
              <option value="paid">Pagado</option>
            </select>
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
              {creditToEdit ? "Guardar Cambios" : "Crear Crédito"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
