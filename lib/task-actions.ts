import { pb } from "@/lib/pocketbase";
import { parseRecurrenceRule, calculateNextDueDate } from "@/lib/recurrence-utils";

/**
 * Calculates the data for the next occurrence of a recurring task.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNextRecurrenceTaskData(task: any) {
    if (!task.recurrence) return null;

    const rule = parseRecurrenceRule(task.recurrence);
    if (!rule) return null;

    // Calculate next date
    // Use due_date as base if available, otherwise use today (completion date)
    const baseDate = task.due_date ? new Date(task.due_date) : new Date();
    const nextDate = calculateNextDueDate(baseDate, rule);

    if (!nextDate) return null;

    return {
        title: task.title,
        description: task.description,
        status: 'pending',
        completed: false,
        due_date: nextDate,
        recurrence: typeof task.recurrence === 'string' ? task.recurrence : JSON.stringify(task.recurrence),
        activity: task.activity,
        matter: task.matter,
        user: task.user,
        planned_date: null,
    };
}

/**
 * Completes a recurring task and creates the next one with specific data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function completeRecurringTask(originalTask: any, nextTaskData: any) {
    // 1. Update current task
    const updatedTask = await pb.collection("tasks").update(originalTask.id, {
        status: 'completed',
        completed: true,
    });

    // 2. Create new task
    try {
        await pb.collection("tasks").create(nextTaskData);
        console.log("Recurring task created:", nextTaskData);
    } catch (e) {
        console.error("Error creating recurring task:", e);
        // Note: We might want to rollback the completion if creation fails, 
        // but for now we'll just log it as it's a partial success.
    }

    return updatedTask;
}

/**
 * Updates a task's status and handles recurrence if the task is completed.
 * If the task is recurring and marked as completed, a new task is created for the next occurrence automatically.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateTaskStatusWithRecurrence(task: any, newStatus: string) {
    const isCompleted = newStatus === 'completed';
    
    // If it's a recurring task being completed, we use the default calculation
    if (isCompleted && !task.completed && task.recurrence) {
        const nextTaskData = getNextRecurrenceTaskData(task);
        if (nextTaskData) {
            return completeRecurringTask(task, nextTaskData);
        }
    }
    
    // Standard update for non-recurring or non-completion events
    return await pb.collection("tasks").update(task.id, {
        status: newStatus,
        completed: isCompleted,
        completed_date: isCompleted ? new Date().toISOString() : null,
    });
}
