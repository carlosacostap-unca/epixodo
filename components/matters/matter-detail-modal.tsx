"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { pb } from "@/lib/pocketbase";
import { Trash2, Calendar, Loader2, CheckSquare, Pencil, Clock, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { formatDate, toInputDate, fromInputDateToUTC, formatDateTime } from "@/lib/date-utils";
import { Modal } from "@/components/ui/modal";
import { ActivityDetailModal } from "../activities/activity-detail-modal";
import { TaskDetailModal } from "../tasks/task-detail-modal";
import { CreateTaskModal } from "../tasks/create-task-modal";
import { CreateActivityModal } from "../activities/create-activity-modal";

interface MatterDetailModalProps {
  matterId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function MatterDetailModal({ matterId, onClose, onUpdate }: MatterDetailModalProps) {
  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Lists
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  
  // UI states
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  
  // Selection states for nested modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);

  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const fetchMatter = useCallback(async () => {
    try {
      const record = await pb.collection("matters").getOne(matterId, {
        requestKey: null
      });
      setMatter(record);
      setTitle(record.title);
      setDescription(record.description || "");
      
      if (record.due_date) {
        setDueDate(toInputDate(record.due_date));
      }
      
      // Cargar actividades asociadas
      try {
        const activitiesRecords = await pb.collection("activities").getList(1, 50, {
          filter: `matter = "${matterId}"`,
          sort: "-created",
          requestKey: null
        });
        setActivities(activitiesRecords.items);
      } catch (error) {
        console.log("No se pudieron cargar las actividades o la relación no existe aún");
      }

      // Cargar tareas asociadas
      try {
        const tasksRecords = await pb.collection("tasks").getList(1, 50, {
          filter: `matter = "${matterId}"`,
          sort: "-created",
          requestKey: null
        });
        setTasks(tasksRecords.items);
      } catch (error) {
        console.log("No se pudieron cargar las tareas o la relación no existe aún");
      }

      // Cargar todas las tareas (directas y de actividades) para el progreso
      try {
        // Primero necesitamos los IDs de las actividades
        const activitiesRecords = await pb.collection("activities").getList(1, 100, {
           filter: `matter = "${matterId}"`,
           fields: 'id',
           requestKey: null
        });
        
        const activityIds = activitiesRecords.items.map(a => a.id);
        
        let filter = `matter = "${matterId}"`;
        if (activityIds.length > 0) {
          const activityFilter = activityIds.map(id => `activity = "${id}"`).join(" || ");
          filter = `(${filter}) || (${activityFilter})`;
        }

        const allTasksRecords = await pb.collection("tasks").getList(1, 200, {
          filter: filter,
          requestKey: null
        });
        setAllTasks(allTasksRecords.items);
      } catch (error) {
        console.log("Error calculando progreso:", error);
      }
      
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching matter:", error);
        alert("No se pudo cargar el asunto o no existe.");
        onCloseRef.current();
      }
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    if (matterId) {
      fetchMatter();
      
      pb.collection("matters").subscribe(matterId, (e) => {
          if (e.action === "update") {
              fetchMatter();
          } else if (e.action === "delete") {
              onCloseRef.current();
          }
      });

      pb.collection("activities").subscribe("*", (e) => {
         fetchMatter();
      });

      pb.collection("tasks").subscribe("*", (e) => {
          fetchMatter();
      });
    }

    return () => {
        pb.collection("matters").unsubscribe(matterId);
        pb.collection("activities").unsubscribe("*");
        pb.collection("tasks").unsubscribe("*");
    };
  }, [matterId, fetchMatter]);

  const handleUpdate = async (data: any) => {
    try {
      const updatedMatter = await pb.collection("matters").update(matterId, data);
      setMatter(updatedMatter);
      onUpdate();
    } catch (error) {
      console.error("Error updating matter:", error);
    }
  };

  const handleTitleBlur = () => {
    if (matter && title !== matter.title) {
      handleUpdate({ title });
    }
  };

  const handleDateChange = (value: string) => {
    setDueDate(value);
    const utcDate = value ? fromInputDateToUTC(value) : null;
    handleUpdate({ due_date: utcDate });
  };

  const handleDescriptionBlur = () => {
    if (matter && description !== (matter.description || "")) {
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

  const toggleActivityExpansion = (activityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este asunto?")) return;
    
    try {
      await pb.collection("matters").delete(matterId);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting matter:", error);
      alert("Error al eliminar el asunto");
    }
  };

  if (!matterId) return null;

  return (
    <Modal isOpen={!!matterId} onClose={onClose}>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : matter ? (
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
                 placeholder="Título del asunto"
               />
             </div>
          </div>

          {/* Date & Progress */}
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vence</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>

            {allTasks.length > 0 && (
              <div className="w-full flex-grow">
                 <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400">
                   <span>Progreso ({allTasks.filter(t => t.completed).length}/{allTasks.length} tareas)</span>
                   <span>{Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)}%</span>
                 </div>
                 <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800">
                   <div 
                     className="h-2 rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300" 
                     style={{ width: `${Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)}%` }}
                   />
                 </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 flex flex-col gap-1.5">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Descripción</span>
             <RichTextEditor
               content={description}
               onChange={setDescription}
               onBlur={handleDescriptionBlur}
               placeholder="Detalles del asunto..."
             />
          </div>
          
          {/* Activities List */}
          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividades
              </h2>
              <button
                onClick={() => setIsCreateActivityModalOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                + Agregar Actividad
              </button>
            </div>
            
            {activities.length > 0 ? (
              <div className="space-y-3 mb-8">
                {activities.map(activity => {
                  const activityTasks = allTasks.filter(t => t.activity === activity.id);
                  const isExpanded = expandedActivities.has(activity.id);
                  
                  return (
                    <div key={activity.id} className="rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                      <div 
                        onClick={() => setSelectedActivityId(activity.id)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer bg-white dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => toggleActivityExpansion(activity.id, e)}
                            className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({activityTasks.length} tareas)
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {activity.start_date ? formatDateTime(activity.start_date) : 'Sin fecha'}
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
                          {activityTasks.length > 0 ? (
                            <div className="space-y-2 pl-8">
                              {activityTasks.map(task => (
                                <div 
                                  key={task.id}
                                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                                      <CheckCircle2 className={`h-4 w-4 ${task.completed ? "fill-current" : ""}`} />
                                    </button>
                                    <span 
                                      className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'} cursor-pointer hover:underline`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTaskId(task.id);
                                      }}
                                    >
                                      {task.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="pl-8 text-xs text-gray-500 italic">No hay tareas en esta actividad.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic mb-8">No hay actividades asociadas.</p>
            )}

            {/* Tasks List */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tareas
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
              <p className="text-sm text-gray-500 italic">No hay tareas asociadas.</p>
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
            fetchMatter();
          }}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={() => {
          fetchMatter();
        }}
        initialMatterId={matterId}
      />

      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          onClose={() => {
            setSelectedActivityId(null);
            fetchMatter();
          }}
          onUpdate={() => {
            setSelectedActivityId(null);
            fetchMatter();
          }}
        />
      )}

      <CreateActivityModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => setIsCreateActivityModalOpen(false)}
        onSuccess={() => {
          fetchMatter();
        }}
        initialMatterId={matterId}
      />
    </Modal>
  );
}