"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { fromInputDateToUTC } from "@/lib/date-utils";
import { MatterSelectorModal } from "./matter-selector-modal";

interface CreateMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialParentId?: string;
}

export function CreateMatterModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialParentId
}: CreateMatterModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parentMatter, setParentMatter] = useState<any>(null);
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setParentMatter(null);
      
      if (initialParentId) {
        // Fetch parent info if provided
        pb.collection("matters").getOne(initialParentId).then(setParentMatter).catch(console.error);
      }
    }
  }, [isOpen, initialParentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await pb.collection("matters").create({
        title: title,
        description: description,
        due_date: dueDate ? fromInputDateToUTC(dueDate) : null,
        parent: parentMatter?.id || null,
        user: pb.authStore.model?.id,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating matter:", error);
      alert("Error al crear el asunto. Asegúrate de que la colección 'matters' tenga el campo 'parent' en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {parentMatter ? "Nuevo Subasunto" : "Nuevo Asunto"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {parentMatter 
              ? `Creando un subasunto para "${parentMatter.title}"`
              : "Crea un nuevo asunto para organizar actividades y tareas."}
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
              placeholder="Nombre del asunto"
              className="w-full rounded-md border-0 bg-gray-50 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

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

          {!initialParentId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Asunto Padre (Opcional)
              </label>
              {parentMatter ? (
                <div className="flex items-center justify-between rounded-md border border-gray-200 p-2 dark:border-zinc-700">
                  <span className="text-sm text-gray-900 dark:text-white">{parentMatter.title}</span>
                  <button
                    type="button"
                    onClick={() => setParentMatter(null)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsParentSelectorOpen(true)}
                  className="flex w-full items-center justify-center rounded-md border border-dashed border-gray-300 p-2 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:text-gray-400"
                >
                  Seleccionar asunto padre
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <RichTextEditor 
              content={description} 
              onChange={setDescription}
              placeholder="Detalles del asunto..."
            />
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
              {parentMatter ? "Crear Subasunto" : "Crear Asunto"}
            </button>
          </div>
        </form>

        <MatterSelectorModal
          isOpen={isParentSelectorOpen}
          onClose={() => setIsParentSelectorOpen(false)}
          onSelect={setParentMatter}
        />
      </div>
    </Modal>
  );
}
