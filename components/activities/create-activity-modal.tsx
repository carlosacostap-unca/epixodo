"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { fromInputDateTimeToUTC } from "@/lib/date-utils";

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMatterId?: string | null;
}

export function CreateActivityModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMatterId 
}: CreateActivityModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matters, setMatters] = useState<any[]>([]);
  const [selectedMatter, setSelectedMatter] = useState(initialMatterId || "");

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setSelectedMatter(initialMatterId || "");
      
      const fetchMatters = async () => {
        try {
          const records = await pb.collection("matters").getFullList({
            sort: "-created",
            requestKey: null
          });
          setMatters(records);
        } catch (error) {
          console.log("No matters found or collection not created yet");
        }
      };
      fetchMatters();
    }
  }, [isOpen, initialMatterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await pb.collection("activities").create({
        title: title,
        description: description,
        start_date: startDate ? fromInputDateTimeToUTC(startDate) : null,
        end_date: endDate ? fromInputDateTimeToUTC(endDate) : null,
        user: pb.authStore.model?.id,
        matter: selectedMatter || null,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error al crear la actividad. Asegúrate de que la colección 'activities' exista en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Actividad</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crea una nueva actividad con fecha y hora.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la actividad"
              className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="matter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Asunto (Opcional)
            </label>
            <select
              id="matter"
              value={selectedMatter}
              onChange={(e) => setSelectedMatter(e.target.value)}
              className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
            >
              <option value="">-- Seleccionar asunto --</option>
              {matters.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <RichTextEditor 
              content={description} 
              onChange={setDescription}
              placeholder="Detalles de la actividad..."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha y Hora de Inicio
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha y Hora de Fin
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Actividad
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
