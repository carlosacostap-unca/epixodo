"use client";

import { useState } from "react";
import { getNextRecurrenceTaskData, completeRecurringTask, updateTaskStatusWithRecurrence } from "@/lib/task-actions";
import { RecurringCompletionModal } from "@/components/tasks/recurring-completion-modal";

export function useRecurringTaskCompletion(onSuccess: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recurringTask, setRecurringTask] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nextTaskData, setNextTaskData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTaskUpdate = async (task: any, newStatus: string) => {
    // Check if we need to intercept for recurrence
    if (newStatus === 'completed' && !task.completed && task.recurrence) {
        const nextData = getNextRecurrenceTaskData(task);
        if (nextData) {
            setRecurringTask(task);
            setNextTaskData(nextData);
            setIsModalOpen(true);
            return; // Intercepted
        }
    }
    
    // Standard update if not intercepted
    try {
        await updateTaskStatusWithRecurrence(task, newStatus);
        onSuccess();
    } catch (error) {
        console.error("Error updating task:", error);
        // Optionally re-throw or handle error
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmRecurrence = async (finalData: any) => {
     if (recurringTask) {
         await completeRecurringTask(recurringTask, finalData);
         setIsModalOpen(false);
         setRecurringTask(null);
         setNextTaskData(null);
         onSuccess();
     }
  };

  const closeRecurrenceModal = () => {
      setIsModalOpen(false);
      setRecurringTask(null);
      setNextTaskData(null);
  };

  const RecurrenceModal = () => (
      <RecurringCompletionModal
        isOpen={isModalOpen}
        onClose={closeRecurrenceModal}
        onConfirm={confirmRecurrence}
        originalTask={recurringTask}
        nextTaskData={nextTaskData}
      />
  );

  return {
      handleTaskUpdate,
      RecurrenceModal
  };
}
