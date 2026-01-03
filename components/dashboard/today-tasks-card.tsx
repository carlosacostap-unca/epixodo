"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { formatDate, toInputDate } from "@/lib/date-utils";
import { TaskDetailModal } from "../tasks/task-detail-modal";
import { updateTaskStatusWithRecurrence } from "@/lib/task-actions";

export function TodayTasksCard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMissingCollection, setIsMissingCollection] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTodayTasks = async () => {
    try {
      const todayStr = toInputDate(new Date().toISOString());

      // Fetch all incomplete tasks (up to 200) to perform client-side filtering
      // This avoids 400 errors if the 'do_today' field doesn't exist yet in the database
      const records = await pb.collection("tasks").getList(1, 200, {
        sort: "due_date",
        filter: `user = "${pb.authStore.model?.id}" && completed = false`,
        requestKey: null,
      });

      // Filter in memory to avoid complex query issues if field is missing
      const filteredTasks = records.items.filter((task: any) => {
         const isPlannedForToday = task.planned_date && toInputDate(task.planned_date) === todayStr;
         const isDueToday = task.due_date && toInputDate(task.due_date) === todayStr;
         return isPlannedForToday || isDueToday;
      });

      setTasks(filteredTasks);
    } catch (error: any) {
      if (error.status === 404) {
        setIsMissingCollection(true);
        console.warn("Colección 'tasks' no encontrada en PocketBase.");
      } else if (error.status !== 0) {
        console.error("Error fetching today tasks:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  const toggleTask = async (task: any) => {
    try {
      await updateTaskStatusWithRecurrence(task, 'completed');
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-900 dark:ring-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tu Enfoque de Hoy
        </h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-900 dark:ring-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Tu Enfoque de Hoy
      </h2>
      
      {isMissingCollection ? (
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center text-yellow-600 dark:text-yellow-400">
          <p className="text-sm font-medium">Colección no encontrada</p>
          <p className="text-xs opacity-70">Asegúrate de que la colección "tasks" existe.</p>
        </div>
      ) : tasks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => toggleTask(task)}
                  className="flex-shrink-0 text-gray-400 hover:text-green-600 dark:text-zinc-500 dark:hover:text-green-400"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <Link 
                  href={`/tasks/${task.id}`}
                  className="truncate text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  {task.title}
                </Link>
              </div>
              
              <div className="flex flex-shrink-0 items-center gap-2">
                {task.planned_date && toInputDate(task.planned_date) === toInputDate(new Date().toISOString()) && (
                  <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 sm:inline-block">
                    Planificada hoy
                  </span>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="mb-2 h-10 w-10 text-green-500/20" />
          <p className="text-sm">¡Todo listo por hoy!</p>
          <p className="text-xs opacity-70">No tienes tareas pendientes para hoy.</p>
        </div>
      )}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {
            fetchTodayTasks();
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
