"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Calendar, Plus, Link as LinkIcon, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight, Pencil, MoreHorizontal, Filter, Eye, EyeOff } from "lucide-react";
import { formatDate, isOverdue, toInputDate } from "@/lib/date-utils";
import { TaskDetailModal } from "./task-detail-modal";
import { CreateTaskModal } from "./create-task-modal";
import { ActivityDetailModal } from "../activities/activity-detail-modal";
import { StatusSelector } from "@/components/ui/status-selector";
import { useRecurringTaskCompletion } from "@/hooks/use-recurring-task-completion";

// TaskCard Component (Extracted for better performance and animations)
const TaskCard = ({ 
  task, 
  sectionKey, 
  onUpdate, 
  onSelect 
}: { 
  task: any, 
  sectionKey: string, 
  onUpdate: (task: any, status: string) => void, 
  onSelect: (id: string) => void 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const currentStatus = task.status || (task.completed ? 'completed' : 'pending');
  const isCompleted = currentStatus === 'completed';
  const isUrgent = sectionKey === 'overdue' || sectionKey === 'today';
  const isFuture = sectionKey === 'later' || sectionKey === 'nextWeek';
  
  const showDate = sectionKey !== 'today' && task.due_date;

  const handleComplete = async () => {
    if (!isCompleted) {
        setIsExiting(true);
        // Wait for animation to play
        await new Promise(r => setTimeout(r, 300));
    }
    onUpdate(task, isCompleted ? 'pending' : 'completed');
  };

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`group relative flex items-start gap-3 rounded-lg border p-3 transition-all duration-300 hover:shadow-md cursor-pointer
        ${isExiting ? 'opacity-0 translate-x-10' : 'opacity-100'}
        ${isUrgent 
          ? 'bg-white border-l-4 border-l-red-500 border-y-gray-200 border-r-gray-200 dark:bg-zinc-900 dark:border-l-red-500 dark:border-y-zinc-800 dark:border-r-zinc-800' 
          : isFuture
            ? 'bg-gray-50/50 border-gray-100 dark:bg-zinc-900/30 dark:border-zinc-800' // Future tasks lighter
            : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
        }
        ${isCompleted ? 'opacity-60 bg-gray-50 dark:bg-zinc-900/50' : ''}
      `}
    >
      <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
         <button
           onClick={handleComplete}
           className="flex h-8 w-8 -ml-2 -mt-2 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
           title={isCompleted ? "Marcar como pendiente" : "Completar"}
         >
           <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors
             ${isCompleted 
               ? 'border-green-500 bg-green-500 text-white' 
               : isUrgent 
                 ? 'border-red-400 dark:border-red-500'
                 : 'border-gray-300 dark:border-zinc-600'
             }
           `}>
             {isCompleted && <CheckCircle2 className="h-3 w-3" />}
           </div>
         </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-sm font-medium truncate pr-16 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
           {showDate && (
             <div className={`flex items-center gap-1 text-xs ${
               isOverdue(task.due_date, false) && !isCompleted ? 'text-red-600 font-medium' : 'text-gray-500'
             }`}>
               <Calendar className="h-3 w-3" />
               <span>{formatDate(task.due_date)}</span>
             </div>
           )}

           {task.expand?.activity && (
             <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 max-w-[150px] truncate">
               <LinkIcon className="h-3 w-3" />
               <span className="truncate">{task.expand.activity.title}</span>
             </div>
           )}
           
           {task.expand?.matter && (
             <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 max-w-[150px] truncate">
               <LinkIcon className="h-3 w-3" />
               <span className="truncate">{task.expand.matter.title}</span>
             </div>
           )}
        </div>
      </div>

      {/* Quick Actions on Hover */}
      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 rounded-md px-1 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-zinc-800">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md dark:hover:bg-green-900/20 transition-colors"
          title={isCompleted ? "Marcar como pendiente" : "Completar"}
        >
          {isCompleted ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(task.id);
          }}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/20 transition-colors"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ 
  sectionKey, 
  items, 
  title, 
  range,
  isOpen,
  onToggle,
  viewMode,
  onUpdate,
  onSelect
}: { 
  sectionKey: string, 
  items: any[], 
  title: string, 
  range?: string,
  isOpen: boolean,
  onToggle: (key: string) => void,
  viewMode: 'all' | 'focus',
  onUpdate: (task: any, status: string) => void,
  onSelect: (id: string) => void
}) => {
  if (items.length === 0 && viewMode === 'focus') return null;
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <button 
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center gap-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/30 rounded-md px-2 -ml-2 transition-colors group"
      >
        <div className={`p-0.5 rounded-md text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
           <ChevronRight className="h-4 w-4" />
        </div>
        <h2 className={`text-sm font-bold flex items-center gap-2 ${
          sectionKey === 'overdue' ? 'text-red-600 dark:text-red-400' : 
          sectionKey === 'today' ? 'text-blue-600 dark:text-blue-400' : 
          'text-gray-700 dark:text-gray-200'
        }`}>
          {title}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            {items.length}
          </span>
        </h2>
        {range && <span className="text-xs text-gray-400 hidden sm:inline-block">{range}</span>}
        <div className="flex-1 border-b border-gray-100 dark:border-zinc-800 ml-2"></div>
      </button>
      
      {isOpen && (
        <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pl-2 animate-in slide-in-from-top-1 duration-200">
          {items.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              sectionKey={sectionKey} 
              onUpdate={onUpdate}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function TasksList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'focus'>('all');
  
  // Section collapse states
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    overdue: true,
    today: true,
    thisWeek: false,
    nextWeek: false,
    later: false,
    noDate: true,
    completedPast: false
  });

  const toggleSection = (section: string) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchTasks = async () => {
    try {
      const records = await pb.collection("tasks").getList(1, 200, {
        sort: "due_date", // Sort by due date for better organization
        filter: `user = "${pb.authStore.model?.id}"`,
        expand: "activity,matter",
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

  const { handleTaskUpdate, RecurrenceModal } = useRecurringTaskCompletion(fetchTasks);

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

  const categorizeTasks = () => {
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
      const dateValue = task.due_date;
      
      if (task.status === 'completed' || task.completed) {
        sections.completedPast.push(task);
        return;
      }

      if (!dateValue) {
        sections.noDate.push(task);
        return;
      }

      const taskDateStr = toInputDate(dateValue);

      if (taskDateStr < todayStr) {
        sections.overdue.push(task);
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

  const { sections, ranges } = categorizeTasks();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white" />
      </div>
    );
  }

  // Sections config
  const sectionsConfig = [
    { key: 'overdue', title: 'Vencidas' },
    { key: 'today', title: 'Hoy', range: ranges.today },
    { key: 'thisWeek', title: 'Esta Semana', range: ranges.thisWeek },
    { key: 'nextWeek', title: 'Próxima Semana', range: ranges.nextWeek },
    { key: 'later', title: 'Futuras', range: ranges.later },
    { key: 'noDate', title: 'Sin Fecha' },
    { key: 'completedPast', title: 'Completadas' },
  ];

  const visibleSections = viewMode === 'focus' 
    ? sectionsConfig.filter(s => ['overdue', 'today'].includes(s.key))
    : sectionsConfig;

  const totalTasks = tasks.filter(t => !t.completed && t.status !== 'completed').length;
  const focusCount = sections.overdue.length + sections.today.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
           <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
              <button
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Todas
              </button>
              <button
                onClick={() => setViewMode('focus')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'focus'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                En Foco
                {focusCount > 0 && (
                   <span className={`ml-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] ${
                     viewMode === 'focus' 
                       ? 'bg-gray-100 text-gray-900 dark:bg-zinc-600 dark:text-white' 
                       : 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-300'
                   }`}>
                     {focusCount}
                   </span>
                )}
              </button>
           </div>
           <span className="text-sm text-gray-500 dark:text-gray-400">
             {totalTasks} pendientes
           </span>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      <div className="space-y-10">
        {visibleSections.map(config => (
          <Section 
            key={config.key}
            sectionKey={config.key}
            items={sections[config.key as keyof typeof sections]}
            title={config.title}
            range={config.range}
            isOpen={sectionStates[config.key]}
            onToggle={toggleSection}
            viewMode={viewMode}
            onUpdate={handleTaskUpdate}
            onSelect={setSelectedTaskId}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
             <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
               <CheckCircle2 className="h-8 w-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 dark:text-white">Todo al día</h3>
             <p className="max-w-sm mt-1">No tienes tareas pendientes. ¡Disfruta tu tiempo libre o crea una nueva tarea!</p>
             <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
             >
                Crear tarea ahora
             </button>
          </div>
        )}
      </div>

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
            fetchTasks(); 
            setSelectedActivityId(null);
          }}
        />
      )}

      <RecurrenceModal />
    </div>
  );
}
