"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceToEdit?: any;
}

export function CreateServiceModal({ isOpen, onClose, onSuccess, serviceToEdit }: CreateServiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("utilities");
  const [dueDay, setDueDay] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        setName(serviceToEdit.name);
        setProvider(serviceToEdit.provider || "");
        setCategory(serviceToEdit.category || "utilities");
        setDueDay(serviceToEdit.due_day?.toString() || "");
        setAverageCost(serviceToEdit.average_cost?.toString() || "");
        setCurrency(serviceToEdit.currency || "ARS");
        setIsActive(serviceToEdit.is_active ?? true);
      } else {
        setName("");
        setProvider("");
        setCategory("utilities");
        setDueDay("");
        setAverageCost("");
        setCurrency("ARS");
        setIsActive(true);
      }
    }
  }, [isOpen, serviceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        provider,
        category,
        due_day: parseInt(dueDay) || null,
        average_cost: parseFloat(averageCost) || 0,
        currency,
        is_active: isActive,
        user: pb.authStore.model?.id,
      };

      if (serviceToEdit) {
        await pb.collection("services").update(serviceToEdit.id, data);
      } else {
        await pb.collection("services").create(data);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio. Asegúrate de haber creado la colección 'services' en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {serviceToEdit ? "Editar Servicio" : "Nuevo Servicio"}
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
              placeholder="Ej. UTE, Antel, Netflix"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Proveedor
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="utilities">Servicios Públicos</option>
                <option value="subscription">Suscripción</option>
                <option value="insurance">Seguro</option>
                <option value="education">Educación</option>
                <option value="other">Otro</option>
              </select>
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
                <option value="USD">Dólar Estadounidense (US$)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Servicio Activo
            </label>
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
              {serviceToEdit ? "Guardar Cambios" : "Crear Servicio"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
