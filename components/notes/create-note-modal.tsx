"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateNoteModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setTitle("");
      setContent("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await pb.collection("notes").create({
        title: title,
        content: content,
        user: pb.authStore.model?.id,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Error al crear la nota. Asegúrate de que la colección 'notes' exista en PocketBase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Nueva Nota</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crea una nueva nota personal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:placeholder:text-zinc-400 sm:text-sm sm:leading-6"
              placeholder="Escribe un título para la nota"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Contenido
            </label>
            <div className="min-h-[200px] rounded-md border border-gray-300 shadow-sm dark:border-zinc-700 overflow-hidden">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Escribe el contenido de tu nota..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-700 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Nota
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
