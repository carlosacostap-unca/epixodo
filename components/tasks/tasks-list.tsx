"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Calendar, Plus, Link as LinkIcon, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate, isOverdue, toInputDate } from "@/lib/date-utils";
import { TaskDetailModal } from "./task-detail-modal";
import { CreateTaskModal } from "./create-task-modal";
import { ActivityDetailModal } from "../activities/activity-detail-modal";

export function TasksList() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const records = await pb.collection("tasks").getList(1, 200, {
        sort: "due_date", // Sort by due date for better organization
        filter: `user = "${pb.authStore.model?.id}"`,
        expand: "activity",
        requestKey: null,
      });
      setTasks(records.items);
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching tasks:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    try {
      await pb.collection("tasks").update(task.id, {
        completed: !task.completed,
      });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("No se pudo actualizar la tarea");
    }
  };

  useEffect(() => {
    fetchTasks();

    pb.collection("tasks").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
             fetchTasks();
        }
    });

    return () => {
      pb.collection("tasks").unsubscribe("*");
    };
  }, []);

  const categorizeTasks = (dateField: 'due_date' | 'planned_date') => {
    const sections = {
      overdue: [] as any[],
      today: [] as any[],
      thisWeek: [] as any[],
      nextWeek: [] as any[],
      later: [] as any[],
      noDate: [] as any[],
      completedPast: [] as any[],
    };

    const now = new Date();
    const todayStr = toInputDate(now.toISOString());
    
    // Parse todayStr to work with local dates for arithmetic
    const [y, m, d] = todayStr.split('-').map(Number);
    const todayDate = new Date(y, m - 1, d);
    
    // Calculate end of this week (Sunday)
    const dayOfWeek = todayDate.getDay(); // 0 (Sun) - 6 (Sat)
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    const endOfWeekDate = new Date(todayDate);
    endOfWeekDate.setDate(todayDate.getDate() + daysUntilSunday);
    
    // Helper to format Date back to YYYY-MM-DD
    const formatDateStr = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper to format for display (DD/MM)
    const formatDisplayDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    const endOfWeekStr = formatDateStr(endOfWeekDate);
    
    // Calculate end of next week
    const startOfNextWeekDate = new Date(endOfWeekDate);
    startOfNextWeekDate.setDate(endOfWeekDate.getDate() + 1);
    
    const endOfNextWeekDate = new Date(endOfWeekDate);
    endOfNextWeekDate.setDate(endOfWeekDate.getDate() + 7);
    const endOfNextWeekStr = formatDateStr(endOfNextWeekDate);

    // Calculate start of following week (after next week)
    const startOfFollowingWeekDate = new Date(endOfNextWeekDate);
    startOfFollowingWeekDate.setDate(endOfNextWeekDate.getDate() + 1);

    // Define ranges for display
    const ranges = {
      today: formatDisplayDate(todayDate),
      thisWeek: `${formatDisplayDate(new Date(todayDate.getTime() + 86400000))} - ${formatDisplayDate(endOfWeekDate)}`,
      nextWeek: `${formatDisplayDate(startOfNextWeekDate)} - ${formatDisplayDate(endOfNextWeekDate)}`,
      later: `A partir del ${formatDisplayDate(startOfFollowingWeekDate)}`,
    };

    tasks.forEach(task => {
      const dateValue = task[dateField];
      if (!dateValue) {
        sections.noDate.push(task);
        return;
      }

      const taskDateStr = toInputDate(dateValue);

      if (taskDateStr < todayStr) {
        if (task.completed) {
          sections.completedPast.push(task);
        } else {
          sections.overdue.push(task);
        }
      } else if (taskDateStr === todayStr) {
        sections.today.push(task);
      } else if (taskDateStr > todayStr && taskDateStr <= endOfWeekStr) {
        sections.thisWeek.push(task);
      } else if (taskDateStr > endOfWeekStr && taskDateStr <= endOfNextWeekStr) {
        sections.nextWeek.push(task);
      } else {
        sections.later.push(task);
      }
    });

    return { sections, ranges };
  };

  const dueData = categorizeTasks('due_date');
  const plannedData = categorizeTasks('planned_date');

  const getSectionTitle = (sectionKey: string, range: string | undefined, mode: 'due_date' | 'planned_date') => {
    const isDue = mode === 'due_date';
    switch (sectionKey) {
      case 'overdue':
        return isDue ? 'Tareas vencidas' : 'Tareas atrasadas';
      case 'today':
        return isDue ? `Tareas que vencen hoy (${range})` : `Tareas para hoy (${range})`;
      case 'thisWeek':
        return isDue ? `Tareas que vencen en esta semana (${range})` : `Tareas para esta semana (${range})`;
      case 'nextWeek':
        return isDue ? `Tareas que vencen la próxima semana (${range})` : `Tareas para la próxima semana (${range})`;
      case 'later':
        return isDue ? `Tareas que vencen después de la próxima semana (${range})` : `Tareas para después de la próxima semana (${range})`;
      case 'noDate':
        return isDue ? 'Tareas sin fecha de vencimiento' : 'Tareas sin fecha planificada';
      case 'completedPast':
        return 'Tareas completadas anteriormente';
      default:
        return '';
    }
  };

  const TaskCard = ({ task, mode }: { task: any, mode: 'due_date' | 'planned_date' }) => (
    <div
      onClick={() => setSelectedTaskId(task.id)}
      className="group relative flex flex-col justify-between gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:ring-2 hover:ring-blue-500/50 hover:shadow-md dark:bg-zinc-900 dark:ring-white/10 dark:hover:ring-blue-400/50 cursor-pointer"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-base font-semibold text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
            {task.title}
          </h3>
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
          >
            <CheckCircle2 className={`h-5 w-5 ${task.completed ? "fill-current" : ""}`} />
          </button>
        </div>

        {mode !== 'due_date' && task.planned_date && (
          <span className="inline-flex w-fit items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/30">
            Planificada: {formatDate(task.planned_date)}
          </span>
        )}

        {task.expand?.activity && (
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            {mode === 'due_date' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedActivityId(task.expand.activity.id);
                }}
                className="hover:underline text-left"
              >
                Actividad: {task.expand.activity.title}
              </button>
            ) : (
              <>
                <LinkIcon className="h-3 w-3" />
                <span>{task.expand.activity.title}</span>
              </>
            )}
          </div>
        )}

        {mode !== 'due_date' && task.description && (
          <div 
            className={`line-clamp-2 text-sm text-gray-500 dark:text-gray-400 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 ${task.completed ? 'line-through opacity-50' : ''}`}
            dangerouslySetInnerHTML={{ __html: task.description }}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-zinc-800">
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
          task.completed
            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10"
            : "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10"
        }`}>
          {task.completed ? "Completada" : "Pendiente"}
        </span>
        
        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            !task.completed && isOverdue(task.due_date, false)
              ? "text-red-600 dark:text-red-400" 
              : "text-gray-500 dark:text-gray-400"
          }`}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
      </div>
    </div>
  );

  const Section = ({ title, items, icon: Icon, className = "", mode }: { title: string, items: any[], icon?: any, className?: string, mode: 'due_date' | 'planned_date' }) => {
    if (items.length === 0) return null;
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title} <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({items.length})</span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(task => <TaskCard key={task.id} task={task} mode={mode} />)}
        </div>
      </div>
    );
  };

  const TaskSectionsGroup = ({ data, mode }: { data: any, mode: 'due_date' | 'planned_date' }) => {
    const { sections, ranges } = data;
    
    return (
      <div className="space-y-10">
        <Section title={getSectionTitle('overdue', undefined, mode)} items={sections.overdue} icon={AlertCircle} className="text-red-600 dark:text-red-400" mode={mode} />
        <Section title={getSectionTitle('today', ranges.today, mode)} items={sections.today} icon={Clock} mode={mode} />
        <Section title={getSectionTitle('thisWeek', ranges.thisWeek, mode)} items={sections.thisWeek} icon={Calendar} mode={mode} />
        <Section title={getSectionTitle('nextWeek', ranges.nextWeek, mode)} items={sections.nextWeek} icon={Calendar} mode={mode} />
        <Section title={getSectionTitle('later', ranges.later, mode)} items={sections.later} icon={Calendar} mode={mode} />
        <Section title={getSectionTitle('noDate', undefined, mode)} items={sections.noDate} icon={Calendar} mode={mode} />
        <Section title={getSectionTitle('completedPast', undefined, mode)} items={sections.completedPast} icon={CheckCircle2} mode={mode} />
      </div>
    );
  };

  const CollapsibleGroup = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between border-b border-gray-200 pb-4 text-left transition-colors hover:bg-gray-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <div className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white">
            {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </div>
        </button>
        
        {isOpen && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Sección Nueva Tarea */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva Tarea</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex h-full min-h-[150px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-gray-500 transition-colors hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-base font-medium">Crear nueva tarea</span>
          </button>
        </div>
      </div>

      <CollapsibleGroup title="Por Vencimiento" defaultOpen={true}>
        <TaskSectionsGroup data={dueData} mode="due_date" />
      </CollapsibleGroup>

      <CollapsibleGroup title="Por Planificación" defaultOpen={false}>
        <TaskSectionsGroup data={plannedData} mode="planned_date" />
      </CollapsibleGroup>

      {tasks.length === 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          No tienes tareas creadas. ¡Empieza creando una!
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {
            fetchTasks();
          }}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchTasks();
        }}
      />

      {selectedActivityId && (
        <ActivityDetailModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onUpdate={() => {
            fetchTasks(); // Refresh tasks in case activity details changed that affect display
            setSelectedActivityId(null);
          }}
        />
      )}
    </div>
  );
}
