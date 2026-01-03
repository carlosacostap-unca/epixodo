"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Loader2, Link as LinkIcon, X, Plus } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { fromInputDateToUTC } from "@/lib/date-utils";
import { StatusSelector } from "@/components/ui/status-selector";
import { RecurrenceSelector } from "@/components/ui/recurrence-selector";
import { RecurrenceRule, parseRecurrenceRule } from "@/lib/recurrence-utils";

interface RecurringCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalData: any) => Promise<void>;
  originalTask: any;
  nextTaskData: any;
}

export function RecurringCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  originalTask,
  nextTaskData,
}: RecurringCompletionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);

  // Associations (read-only mostly, but nice to show)
  const [activity, setActivity] = useState<any>(null);
  const [matter, setMatter] = useState<any>(null);

  useEffect(() => {
    if (isOpen && nextTaskData) {
      setTitle(nextTaskData.title || "");
      setDescription(nextTaskData.description || "");
      
      // Handle Date conversion if needed
      if (nextTaskData.due_date) {
        const d = new Date(nextTaskData.due_date);
        setDueDate(d.toISOString().split('T')[0]);
      } else {
        setDueDate("");
      }

      if (nextTaskData.recurrence) {
        setRecurrence(parseRecurrenceRule(nextTaskData.recurrence));
      } else {
        setRecurrence(null);
      }
      
      setStatus(nextTaskData.status || "pending");
      
      // We use the original task's expanded relations if available, 
      // otherwise we might need to rely on what's in nextTaskData (ids)
      // For display purposes, we can try to use originalTask's expand if it matches
      if (originalTask?.expand?.activity) {
          setActivity(originalTask.expand.activity);
      } else {
          setActivity(null);
      }

      if (originalTask?.expand?.matter) {
          setMatter(originalTask.expand.matter);
      } else {
          setMatter(null);
      }
      
      setLoading(false);
    }
  }, [isOpen, nextTaskData, originalTask]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const finalData = {
        ...nextTaskData,
        title,
        description,
        status,
        completed: status === 'completed',
        due_date: dueDate ? fromInputDateToUTC(dueDate) : null,
        recurrence: recurrence ? JSON.stringify(recurrence) : null,
        // Keep associations
        activity: nextTaskData.activity,
        matter: nextTaskData.matter,
        user: nextTaskData.user,
      };

      await onConfirm(finalData);
      onClose();
    } catch (error) {
      console.error("Error confirming recurring task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar Siguiente Tarea Recurrente
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Al completar la tarea actual, se creará la siguiente instancia. Puedes editar sus detalles antes de confirmar.
            </p>
        </div>

        {/* Header with Title Input */}
        <div className="flex items-start gap-4">
          <StatusSelector
            status={status}
            onChange={setStatus}
            variant="icon"
            className="mt-1"
          />
          
          <div className="flex-grow">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white ${status === 'completed' ? 'text-gray-500 line-through' : ''}`}
              placeholder="Título de la tarea"
              autoFocus
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</span>
              <StatusSelector
                status={status}
                onChange={setStatus}
                variant="badge"
              />
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vencimiento</span>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Recurrencia</span>
            <RecurrenceSelector
              value={recurrence}
              onChange={setRecurrence}
            />
          </div>

          {/* Association Display */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Asociación (Heredada)</span>
            
            <div className="flex flex-wrap items-center gap-3">
              {activity ? (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">{activity.title}</span>
                </div>
              ) : matter ? (
                <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-1.5 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">Asunto: {matter.title}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin asociación</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
           <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Escribe una descripción..."
                />
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar y Completar
          </button>
        </div>
      </div>
    </Modal>
  );
}
