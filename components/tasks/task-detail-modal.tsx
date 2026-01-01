"use client";

import { useEffect, useState, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Trash2, Calendar, Loader2, Link as LinkIcon, CheckCircle2, X, Plus, Search } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { formatDate, toInputDate, fromInputDateToUTC } from "@/lib/date-utils";
import { Modal } from "@/components/ui/modal";
import { ActivityDetailModal } from "../activities/activity-detail-modal";
import { MatterSelectorModal } from "../matters/matter-selector-modal";
import { ActivitySelectorModal } from "../activities/activity-selector-modal";

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailModal({ taskId, onClose, onUpdate }: TaskDetailModalProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null); // For future matter detail modal
  
  // Selection Modals
  const [isMatterSelectorOpen, setIsMatterSelectorOpen] = useState(false);
  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);

  // Form states (initialized from task)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  
  // Debounce ref for description
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTask = async () => {
    try {
      const record = await pb.collection("tasks").getOne(taskId, {
        expand: "activity,matter",
        requestKey: null
      });
      setTask(record);
      setTitle(record.title);
      setDescription(record.description || "");
      if (record.due_date) setDueDate(toInputDate(record.due_date));
      if (record.planned_date) setPlannedDate(toInputDate(record.planned_date));
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching task:", error);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const updateField = async (field: string, value: any) => {
    try {
      const updatedTask = await pb.collection("tasks").update(taskId, {
        [field]: value
      }, {
        expand: "activity,matter",
        requestKey: null // Disable auto-cancellation
      });
      setTask(updatedTask);
      onUpdate();
    } catch (error: any) {
      if (error.isAbort) {
        console.log("Request cancelled:", field);
      } else {
        console.error(`Error updating ${field}:`, error);
      }
    }
  };

  const handleTitleBlur = () => {
    if (title !== task?.title) {
      updateField("title", title);
    }
  };

  const handleDateChange = (field: "due_date" | "planned_date", dateValue: string) => {
    if (field === "due_date") setDueDate(dateValue);
    if (field === "planned_date") setPlannedDate(dateValue);
    
    // Immediate update for dates
    const utcDate = dateValue ? fromInputDateToUTC(dateValue) : null;
    updateField(field, utcDate);
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    
    // Debounce update
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }
    
    descriptionTimeoutRef.current = setTimeout(() => {
      if (newDescription !== task?.description) {
        updateField("description", newDescription);
      }
    }, 1000); // 1 second debounce
  };

  const handleAssociationSelect = async (type: 'activity' | 'matter', item: any) => {
    try {
      // If selecting activity, clear matter. If selecting matter, clear activity.
      // Assuming exclusive association based on previous requirements.
      const data: any = {};
      if (type === 'activity') {
        data.activity = item.id;
        data.matter = null;
      } else {
        data.matter = item.id;
        data.activity = null;
      }

      const updatedTask = await pb.collection("tasks").update(taskId, data, {
        expand: "activity,matter"
      });
      setTask(updatedTask);
      onUpdate();
    } catch (error) {
      console.error("Error updating association:", error);
    }
  };

  const handleRemoveAssociation = async () => {
    try {
      const updatedTask = await pb.collection("tasks").update(taskId, {
        activity: null,
        matter: null
      }, {
        expand: "activity,matter"
      });
      setTask(updatedTask);
      onUpdate();
    } catch (error) {
      console.error("Error removing association:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    try {
      await pb.collection("tasks").delete(taskId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const toggleTaskStatus = async () => {
    if (!task) return;
    updateField("completed", !task.completed);
  };

  if (!taskId) return null;

  return (
    <Modal isOpen={!!taskId} onClose={onClose}>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : task ? (
        <div className="p-6 sm:p-8">
          {/* Header with Title Input */}
          <div className="flex items-start gap-4">
            <button
              onClick={toggleTaskStatus}
              className={`mt-1 flex-shrink-0 rounded-full transition-colors ${
                task.completed
                  ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  : "text-gray-300 hover:bg-gray-100 hover:text-green-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-green-400"
              }`}
            >
              <CheckCircle2 className={`h-6 w-6 ${task.completed ? "fill-current" : ""}`} />
            </button>
            
            <div className="flex-grow">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className={`w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white ${task.completed ? 'text-gray-500 line-through' : ''}`}
                placeholder="Título de la tarea"
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</span>
              <button
                onClick={toggleTaskStatus}
                className={`inline-flex w-fit items-center rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  task.completed
                    ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10 dark:hover:bg-green-900/30"
                    : "bg-yellow-50 text-yellow-800 ring-yellow-600/20 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10 dark:hover:bg-yellow-900/30"
                }`}
              >
                {task.completed ? "Completada" : "Pendiente"}
              </button>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vencimiento</span>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDateChange("due_date", e.target.value)}
                  className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Planned Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Planificada</span>
              <div className="relative">
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => handleDateChange("planned_date", e.target.value)}
                  className="w-full rounded-md border-0 bg-blue-50/50 px-2.5 py-1.5 text-sm text-blue-900 ring-1 ring-inset ring-blue-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-blue-900/10 dark:text-blue-100 dark:ring-blue-900/30 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Association */}
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Asociación</span>
              
              <div className="flex flex-wrap items-center gap-3">
                {task.expand?.activity ? (
                  <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    <LinkIcon className="h-4 w-4" />
                    <button 
                      onClick={() => setSelectedActivityId(task.expand.activity.id)}
                      className="hover:underline font-medium"
                    >
                      {task.expand.activity.title}
                    </button>
                    <button 
                      onClick={handleRemoveAssociation}
                      className="ml-1 rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      title="Quitar asociación"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : task.expand?.matter ? (
                  <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-1.5 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    <LinkIcon className="h-4 w-4" />
                    <span className="font-medium">Asunto: {task.expand.matter.title}</span>
                    <button 
                      onClick={handleRemoveAssociation}
                      className="ml-1 rounded-full p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                      title="Quitar asociación"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Sin asociación</span>
                )}

                {/* Association Controls */}
                <div className="flex items-center gap-2">
                  {!task.expand?.activity && !task.expand?.matter && (
                    <>
                      <button
                        onClick={() => setIsActivitySelectorOpen(true)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Actividad
                      </button>
                      <button
                        onClick={() => setIsMatterSelectorOpen(true)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Asunto
                      </button>
                    </>
                  )}
                  {(task.expand?.activity || task.expand?.matter) && (
                     <button
                        onClick={() => {
                          // Open the selector for the current type to switch/change, 
                          // OR open a menu? 
                          // Let's just allow clearing (X button above) and then re-adding.
                          // But user might want to swap directly.
                          // Let's add a "Change" button?
                          // For simplicity, I'll just rely on the X button to clear, then add.
                          // Wait, user said "permitir editar... permitir buscar".
                          // Maybe if I have an association, I can still see the buttons to switch?
                          // Let's show "Switch to..." buttons?
                          // Or just a "Cambiar" dropdown?
                          // I'll keep it simple: X to remove is clear.
                          // I'll add a small "Cambiar" text button that opens the relevant selector?
                          // No, X then Add is fine.
                         }}
                         className="hidden" // Placeholder
                      />
                  )}
                </div>
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
                    onChange={handleDescriptionChange}
                    placeholder="Escribe una descripción..."
                  />
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6 dark:border-zinc-800">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onUpdate={() => {
             fetchTask();
             onUpdate();
          }}
        />
      )}
      
      <MatterSelectorModal
        isOpen={isMatterSelectorOpen}
        onClose={() => setIsMatterSelectorOpen(false)}
        onSelect={(matter) => handleAssociationSelect('matter', matter)}
      />
      
      <ActivitySelectorModal
        isOpen={isActivitySelectorOpen}
        onClose={() => setIsActivitySelectorOpen(false)}
        onSelect={(activity) => handleAssociationSelect('activity', activity)}
      />
    </Modal>
  );
}
