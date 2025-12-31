"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Loader2 } from "lucide-react";
import { fromInputDateToUTC } from "@/lib/date-utils";
import { Modal } from "@/components/ui/modal";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMatterId?: string | null;
  initialActivityId?: string | null;
}

export function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMatterId, 
  initialActivityId 
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matters, setMatters] = useState<any[]>([]);
  const [selectedMatter, setSelectedMatter] = useState(initialMatterId || "");

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setTitle("");
      setDescription("");
      setDueDate("");
      setPlannedDate("");
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

    if (dueDate && plannedDate && plannedDate > dueDate) {
      alert("La fecha planificada no puede ser posterior a la fecha de vencimiento.");
      return;
    }

    setIsLoading(true);
    try {
      await pb.collection("tasks").create({
        title: title,
        description: description,
        due_date: dueDate ? fromInputDateToUTC(dueDate) : null,
        planned_date: plannedDate ? fromInputDateToUTC(plannedDate) : null,
        completed: false,
        user: pb.authStore.model?.id,
        activity: initialActivityId || null,
        matter: selectedMatter || null,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error al crear la tarea. Asegúrate de que la colección 'tasks' exista en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Tarea</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {initialActivityId 
              ? "Crea una nueva tarea asociada a esta actividad." 
              : (initialMatterId ? "Crea una nueva tarea asociada a este asunto." : "Crea una nueva tarea para tu lista.")}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué tienes que hacer?"
                className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
                required
                autoFocus
              />
            </div>

            {!initialActivityId && (
              <div className="flex flex-col gap-2">
                <label htmlFor="matter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Asunto (Opcional)
                </label>
                <select
                  id="matter"
                  value={selectedMatter}
                  onChange={(e) => setSelectedMatter(e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
                  disabled={!!initialMatterId}
                >
                  <option value="">-- Seleccionar asunto --</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <RichTextEditor 
                content={description} 
                onChange={setDescription}
                placeholder="Escribe los detalles de la tarea..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="plannedDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha Planificada
                </label>
                <input
                  type="date"
                  id="plannedDate"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
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
                Crear Tarea
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
