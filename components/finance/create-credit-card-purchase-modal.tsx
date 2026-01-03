"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, DollarSign, Calendar, CreditCard, AlignLeft, List, Plus, Trash2 } from "lucide-react";
import { toInputDate, fromInputDateToUTC } from "@/lib/date-utils";

interface Installment {
  id?: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: "pending" | "paid";
}

interface CreateCreditCardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  creditCards: any[];
  purchaseToEdit?: any;
}

export function CreateCreditCardPurchaseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  creditCards,
  purchaseToEdit 
}: CreateCreditCardPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [endDate, setEndDate] = useState("");

  // Installment Generation
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [firstDueDate, setFirstDueDate] = useState("");
  
  // Installments List
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (purchaseToEdit) {
        setTitle(purchaseToEdit.title);
        setDescription(purchaseToEdit.description);
        setPurchaseDate(toInputDate(purchaseToEdit.purchase_date));
        setCreditCardId(purchaseToEdit.credit_card);
        setTotalAmount(purchaseToEdit.total_amount.toString());
        setEndDate(toInputDate(purchaseToEdit.end_date));
        
        // Load installments
        const loadedInstallments = purchaseToEdit.expand?.["credit_card_installments(purchase)"] || [];
        // Sort by number
        loadedInstallments.sort((a: any, b: any) => a.installment_number - b.installment_number);
        setInstallments(loadedInstallments.map((i: any) => ({
            id: i.id,
            installment_number: i.installment_number,
            amount: i.amount,
            due_date: toInputDate(i.due_date),
            status: i.status
        })));

        // Try to infer generation params
        setInstallmentsCount(loadedInstallments.length.toString());
        if (loadedInstallments.length > 0) {
            setFirstDueDate(toInputDate(loadedInstallments[0].due_date));
        } else {
            setFirstDueDate(toInputDate(new Date().toISOString()));
        }

      } else {
        resetForm();
      }
    }
  }, [isOpen, purchaseToEdit]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPurchaseDate(toInputDate(new Date().toISOString()));
    setCreditCardId(creditCards.length > 0 ? creditCards[0].id : "");
    setTotalAmount("");
    setEndDate("");
    setInstallmentsCount("1");
    setFirstDueDate(toInputDate(new Date().toISOString()));
    setInstallments([]);
  };

  const generateInstallments = () => {
    if (!totalAmount || !installmentsCount || !firstDueDate) return;

    const count = parseInt(installmentsCount);
    const total = parseFloat(totalAmount);
    const amountPerInstallment = total / count;
    
    const newInstallments: Installment[] = [];
    
    // Parse initial date parts
    const [startYear, startMonth, startDay] = firstDueDate.split('-').map(Number);

    for (let i = 0; i < count; i++) {
      // Calculate target year and month
      let targetYear = startYear;
      let targetMonth = startMonth + i;
      
      // Handle year rollover
      while (targetMonth > 12) {
          targetMonth -= 12;
          targetYear++;
      }
      
      // Handle day clamping (e.g. Jan 31 -> Feb 28)
      // new Date(year, month, 0) gets the last day of the previous month. 
      // So new Date(targetYear, targetMonth, 0) gets last day of targetMonth.
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay = Math.min(startDay, daysInMonth);
      
      // Format to YYYY-MM-DD
      const formattedDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${targetDay.toString().padStart(2, '0')}`;

      newInstallments.push({
        installment_number: i + 1,
        amount: parseFloat(amountPerInstallment.toFixed(2)),
        due_date: formattedDate,
        status: "pending"
      });
    }
    
    // Adjust last installment to match total exactly due to rounding
    const currentSum = newInstallments.reduce((sum, i) => sum + i.amount, 0);
    const diff = total - currentSum;
    if (diff !== 0) {
        newInstallments[newInstallments.length - 1].amount += diff;
        newInstallments[newInstallments.length - 1].amount = parseFloat(newInstallments[newInstallments.length - 1].amount.toFixed(2));
    }

    // Update End Date automatically
    if (newInstallments.length > 0) {
        setEndDate(newInstallments[newInstallments.length - 1].due_date);
    }

    setInstallments(newInstallments);
  };

  const handleInstallmentChange = (index: number, field: keyof Installment, value: any) => {
    const newInstallments = [...installments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    setInstallments(newInstallments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !creditCardId || !totalAmount) return;

    setIsLoading(true);

    try {
      let purchaseId = purchaseToEdit?.id;

      const purchaseData = {
        title,
        description,
        purchase_date: fromInputDateToUTC(purchaseDate),
        credit_card: creditCardId,
        total_amount: parseFloat(totalAmount),
        end_date: endDate ? fromInputDateToUTC(endDate) : "",
        user: pb.authStore.model?.id,
      };

      if (purchaseToEdit) {
        await pb.collection("credit_card_purchases").update(purchaseId, purchaseData);
      } else {
        const record = await pb.collection("credit_card_purchases").create(purchaseData);
        purchaseId = record.id;
      }

      // Handle Installments
      // 1. Get existing IDs if editing
      const existingIds = purchaseToEdit?.expand?.["credit_card_installments(purchase)"]?.map((i: any) => i.id) || [];
      const currentIds = installments.filter(i => i.id).map(i => i.id);

      // 2. Delete removed installments
      const toDelete = existingIds.filter((id: string) => !currentIds.includes(id));
      await Promise.all(toDelete.map((id: string) => pb.collection("credit_card_installments").delete(id, { requestKey: null })));

      // 3. Create or Update installments
      await Promise.all(installments.map((inst) => {
        const data = {
          purchase: purchaseId,
          installment_number: inst.installment_number,
          amount: inst.amount,
          due_date: fromInputDateToUTC(inst.due_date),
          status: inst.status,
          user: pb.authStore.model?.id
        };

        if (inst.id) {
            return pb.collection("credit_card_installments").update(inst.id, data, { requestKey: null });
        } else {
            return pb.collection("credit_card_installments").create(data, { requestKey: null });
        }
      }));

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving purchase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {purchaseToEdit ? "Editar Compra" : "Nueva Compra con Tarjeta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Compra</label>
                <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tarjeta de Crédito</label>
                <select
                    required
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                    <option value="">Seleccionar tarjeta</option>
                    {creditCards.map((card) => (
                        <option key={card.id} value={card.id}>{card.name} ({card.last_four_digits})</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Total</label>
                <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-white pl-7 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Finalización</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-zinc-800" />

          {/* Installments Generator */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800/50">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Generar Cuotas</h3>
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad de Cuotas</label>
                    <input
                        type="number"
                        min="1"
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Primer Vencimiento</label>
                    <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    />
                </div>
                <button
                    type="button"
                    onClick={generateInstallments}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Generar
                </button>
            </div>
          </div>

          {/* Installments List */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Listado de Cuotas</h3>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0 dark:bg-zinc-800">
                        <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Monto</th>
                            <th className="px-3 py-2">Vencimiento</th>
                            <th className="px-3 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {installments.map((inst, idx) => (
                            <tr key={idx}>
                                <td className="px-3 py-2">{inst.installment_number}</td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={inst.amount}
                                        onChange={(e) => handleInstallmentChange(idx, 'amount', parseFloat(e.target.value))}
                                        className="w-24 rounded border-gray-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="date"
                                        value={inst.due_date}
                                        onChange={(e) => handleInstallmentChange(idx, 'due_date', e.target.value)}
                                        className="rounded border-gray-300 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <select
                                        value={inst.status}
                                        onChange={(e) => handleInstallmentChange(idx, 'status', e.target.value)}
                                        className={`rounded border-gray-300 py-1 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 ${
                                            inst.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                        }`}
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="paid">Pagada</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {installments.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        No hay cuotas generadas.
                    </div>
                )}
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
              Guardar Compra
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
