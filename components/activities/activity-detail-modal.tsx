"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Trash2, Loader2, CheckSquare, CheckCircle2, Circle, Ban, Clock, Pencil, ChevronRight } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { toInputDateTime, fromInputDateTimeToUTC, formatDate } from "@/lib/date-utils";
import { Modal } from "@/components/ui/modal";
import { TaskDetailModal } from "../tasks/task-detail-modal";
import { CreateTaskModal } from "../tasks/create-task-modal";
import { getTaskStatusInfo } from "../tasks/task-constants";
import { RecurrenceSelector } from "@/components/ui/recurrence-selector";
import { RecurrenceRule, parseRecurrenceRule, calculateNextDueDate, formatRecurrenceRule } from "@/lib/recurrence-utils";
import { useRecurringTaskCompletion } from "@/hooks/use-recurring-task-completion";

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
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
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
      setRecurrence(parseRecurrenceRule(record.recurrence));
      
      // Cargar tareas asociadas
      try {
        const tasksRecords = await pb.collection("tasks").getList(1, 50, {
          filter: `activity = "${activityId}"`,
          sort: "-created",
          expand: "activity,matter",
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

  const { handleTaskUpdate, RecurrenceModal } = useRecurringTaskCompletion(fetchActivity);

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

  const getRecurrenceFeedback = () => {
    if (!recurrence) return null;
    try {
      const nextDate = calculateNextDueDate(recurrence, activity?.start_date ? new Date(activity.start_date) : new Date());
      const ruleText = formatRecurrenceRule(recurrence);
      const nextDateText = nextDate ? ` (próxima: ${formatDate(nextDate)})` : "";
      return `${ruleText}${nextDateText}`;
    } catch (e) {
      return null;
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

  const handleRecurrenceChange = (newRule: RecurrenceRule | null) => {
    setRecurrence(newRule);
    handleUpdate({ recurrence: newRule ? JSON.stringify(newRule) : null });
  };

  const handleDescriptionBlur = () => {
    if (activity && description !== (activity.description || "")) {
      handleUpdate({ description });
    }
  };

  const toggleTaskStatus = async (task: any) => {
    try {
      const newCompleted = !task.completed;
      const newStatus = newCompleted ? 'completed' : 'pending';
      
      await handleTaskUpdate(task, newStatus);
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

            <div className="flex flex-col gap-1.5">
               <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Recurrencia</span>
               <RecurrenceSelector 
                  value={recurrence} 
                  onChange={handleRecurrenceChange} 
               />
               {getRecurrenceFeedback() && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-in slide-in-from-top-1 fade-in duration-300">
                    {getRecurrenceFeedback()}
                  </p>
               )}
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
              <div className="space-y-2">
                {tasks.map(task => {
                  const currentStatus = task.status || (task.completed ? 'completed' : 'pending');
                  const statusInfo = getTaskStatusInfo(currentStatus);
                  
                  return (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="group relative flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                         <button
                           onClick={() => toggleTaskStatus(task)}
                           className="flex h-8 w-8 -ml-2 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                           title={task.completed ? "Marcar como pendiente" : "Completar"}
                         >
                           <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors
                              ${task.completed 
                                ? 'border-green-500 bg-green-500 text-white' 
                                : 'border-gray-300 dark:border-zinc-600 group-hover:border-blue-500 dark:group-hover:border-blue-400'
                              }
                           `}>
                             {task.completed && <CheckCircle2 className="h-3 w-3" />}
                           </div>
                         </button>
                      </div>
                      <span className={`text-sm font-medium transition-colors ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center">
                       {/* Badge visible by default, hidden on group hover */}
                       <div className="group-hover:hidden transition-opacity">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                             {
                              yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10",
                              orange: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-500 dark:ring-orange-900/10",
                              red: "bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-900/20 dark:text-red-500 dark:ring-red-900/10",
                              green: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10"
                            }[statusInfo.color]
                          }`}>
                            {statusInfo.label}
                          </span>
                       </div>

                       {/* Quick Actions visible on group hover */}
                       <div className="hidden group-hover:flex items-center gap-1 animate-in fade-in duration-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/20 transition-colors"
                            title="Editar tarea"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                       </div>
                    </div>
                  </div>
                )})}
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
      
      <RecurrenceModal />
    </Modal>
  );
}