"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Trash2, Loader2, CheckSquare, CheckCircle2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { toInputDateTime, fromInputDateTimeToUTC } from "@/lib/date-utils";
import { Modal } from "@/components/ui/modal";
import { TaskDetailModal } from "../tasks/task-detail-modal";
import { CreateTaskModal } from "../tasks/create-task-modal";

interface ActivityDetailModalProps {
  activityId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ActivityDetailModal({ activityId, onClose, onUpdate }: ActivityDetailModalProps) {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const fetchActivity = useCallback(async () => {
    try {
      const record = await pb.collection("activities").getOne(activityId, {
        requestKey: null
      });
      setActivity(record);
      setTitle(record.title);
      setDescription(record.description || "");
      
      if (record.start_date) {
        setStartDate(toInputDateTime(record.start_date));
      }
      if (record.end_date) {
        setEndDate(toInputDateTime(record.end_date));
      }
      
      // Cargar tareas asociadas
      try {
        const tasksRecords = await pb.collection("tasks").getList(1, 50, {
          filter: `activity = "${activityId}"`,
          sort: "-created",
          requestKey: null
        });
        setTasks(tasksRecords.items);
      } catch (error) {
        console.log("No se pudieron cargar las tareas o la relación no existe aún");
      }
      
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching activity:", error);
        alert("No se pudo cargar la actividad o no existe.");
        onCloseRef.current();
      }
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (activityId) {
      fetchActivity();

      pb.collection("activities").subscribe(activityId, (e) => {
         if (e.action === "update") {
             fetchActivity();
         } else if (e.action === "delete") {
             onCloseRef.current();
         }
      });

      pb.collection("tasks").subscribe("*", (e) => {
          // Broad subscription, can be optimized
          fetchActivity();
      });
    }

    return () => {
        pb.collection("activities").unsubscribe(activityId);
        pb.collection("tasks").unsubscribe("*");
    };
  }, [activityId, fetchActivity]);

  const handleUpdate = async (data: any) => {
    try {
      const updatedActivity = await pb.collection("activities").update(activityId, data);
      setActivity(updatedActivity);
      onUpdate();
    } catch (error) {
      console.error("Error updating activity:", error);
      // Revert changes if needed or show error
    }
  };

  const handleTitleBlur = () => {
    if (activity && title !== activity.title) {
      handleUpdate({ title });
    }
  };

  const handleDateChange = (field: "start_date" | "end_date", value: string) => {
    if (field === "start_date") setStartDate(value);
    if (field === "end_date") setEndDate(value);
    
    // Auto-save dates
    const utcDate = value ? fromInputDateTimeToUTC(value) : null;
    handleUpdate({ [field]: utcDate });
  };

  const handleDescriptionBlur = () => {
    if (activity && description !== (activity.description || "")) {
      handleUpdate({ description });
    }
  };

  const toggleTaskStatus = async (task: any) => {
    try {
      await pb.collection("tasks").update(task.id, {
        completed: !task.completed,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("No se pudo actualizar el estado de la tarea");
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta actividad?")) return;
    
    try {
      await pb.collection("activities").delete(activityId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Error al eliminar la actividad");
    }
  };

  if (!activityId) return null;

  return (
    <Modal isOpen={!!activityId} onClose={onClose}>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : activity ? (
        <div className="p-6 sm:p-8">
          {/* Header with Title Input */}
          <div className="flex items-start gap-4">
             <div className="flex-grow">
               <input
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 onBlur={handleTitleBlur}
                 className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                 placeholder="Título de la actividad"
               />
             </div>
          </div>

          {/* Dates & Progress */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Inicio</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => handleDateChange("start_date", e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fin</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => handleDateChange("end_date", e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="mt-4 w-full">
               <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400">
                 <span>Progreso ({tasks.filter(t => t.completed).length}/{tasks.length} tareas)</span>
                 <span>{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
               </div>
               <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800">
                 <div 
                   className="h-2 rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300" 
                   style={{ width: `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%` }}
                 />
               </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-6 flex flex-col gap-1.5">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Descripción</span>
             <RichTextEditor
               content={description}
               onChange={setDescription}
               onBlur={handleDescriptionBlur}
               placeholder="Detalles de la actividad..."
             />
          </div>
          
          {/* Tasks List */}
          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tareas Asociadas
              </h2>
              <button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                + Agregar Tarea
              </button>
            </div>
            
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task);
                        }}
                        className={`flex-shrink-0 rounded-full p-1 transition-colors ${
                          task.completed
                            ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            : "text-gray-300 hover:bg-gray-100 hover:text-gray-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                        }`}
                        title={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
                      >
                        <CheckCircle2 className={`h-5 w-5 ${task.completed ? "fill-current" : ""}`} />
                      </button>
                      <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      task.completed 
                        ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10" 
                        : "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10"
                    }`}>
                      {task.completed ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No hay tareas asociadas a esta actividad.</p>
            )}
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

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {
            fetchActivity();
          }}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={() => {
           fetchActivity();
        }}
        initialActivityId={activityId}
      />
    </Modal>
  );
}