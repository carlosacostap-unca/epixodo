"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { Calendar, AlertCircle, Circle } from "lucide-react";
import Link from "next/link";
import { formatDate, toInputDate } from "@/lib/date-utils";
import { TaskDetailModal } from "../tasks/task-detail-modal";

export function OverdueTasksCard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMissingCollection, setIsMissingCollection] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchOverdueTasks = async () => {
    try {
      const todayStr = toInputDate(new Date().toISOString());

      // Fetch all incomplete tasks
      const records = await pb.collection("tasks").getList(1, 200, {
        sort: "due_date",
        filter: `user = "${pb.authStore.model?.id}" && completed = false`,
        requestKey: null,
      });

      // Filter in memory for tasks where due_date < today
      const filteredTasks = records.items.filter((task: any) => {
         if (!task.due_date) return false;
         return toInputDate(task.due_date) < todayStr;
      });

      setTasks(filteredTasks);
    } catch (error: any) {
      if (error.status === 404) {
        setIsMissingCollection(true);
      } else if (error.status !== 0) {
        console.error("Error fetching overdue tasks:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueTasks();
  }, []);

  const toggleTask = async (task: any) => {
    try {
      await pb.collection("tasks").update(task.id, {
        completed: true,
      });
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (loading) return null; // Don't show anything while loading to avoid layout shift or just show empty

  if (!loading && tasks.length === 0 && !isMissingCollection) return null; // Don't show card if no overdue tasks

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-red-900/5 dark:bg-zinc-900 dark:ring-red-500/10 border-l-4 border-red-500">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Tareas Vencidas
      </h2>
      
      {isMissingCollection ? (
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center text-yellow-600 dark:text-yellow-400">
          <p className="text-sm font-medium">Colección no encontrada</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center justify-between gap-3 rounded-lg border border-red-100 p-3 hover:bg-red-50 dark:border-red-900/20 dark:hover:bg-red-900/10"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => toggleTask(task)}
                  className="flex-shrink-0 text-red-400 hover:text-green-600 dark:text-red-500 dark:hover:text-green-400"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <Link 
                  href={`/tasks/${task.id}`}
                  className="truncate text-sm font-medium text-gray-900 hover:text-red-600 dark:text-white dark:hover:text-red-400"
                >
                  {task.title}
                </Link>
              </div>
              
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={() => {
            fetchOverdueTasks();
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
