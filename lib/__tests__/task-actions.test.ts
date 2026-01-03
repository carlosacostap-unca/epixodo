import { updateTaskStatusWithRecurrence } from "../task-actions";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      update: jest.fn(),
      create: jest.fn(),
    })),
  },
}));

describe("updateTaskStatusWithRecurrence", () => {
  const mockTask = {
    id: "task-1",
    title: "Recurring Task",
    description: "Desc",
    status: "pending",
    completed: false,
    due_date: "2024-01-01T12:00:00.000Z",
    recurrence: JSON.stringify({ frequency: "daily", interval: 1 }),
    user: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new task when a recurring task is completed", async () => {
    // Mock update response
    (pb.collection as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ ...mockTask, status: "completed", completed: true }),
      create: jest.fn().mockResolvedValue({ id: "new-task" }),
    });

    await updateTaskStatusWithRecurrence(mockTask, "completed");

    // Check if update was called
    expect(pb.collection("tasks").update).toHaveBeenCalledWith("task-1", {
      status: "completed",
      completed: true,
    });

    // Check if create was called for the next occurrence
    // Next day after Jan 1st is Jan 2nd
    expect(pb.collection("tasks").create).toHaveBeenCalledWith(expect.objectContaining({
      title: "Recurring Task",
      status: "pending",
      completed: false,
      // We expect the date to be roughly Jan 2nd
      // Note: exact string matching might be tricky due to timezones, so we check existence
    }));

    const createCall = (pb.collection("tasks").create as jest.Mock).mock.calls[0][0];
    const newDueDate = new Date(createCall.due_date);
    expect(newDueDate.toISOString()).toContain("2024-01-02");
  });

  it("should NOT create a new task if recurrence is missing", async () => {
    const nonRecurringTask = { ...mockTask, recurrence: null };
    
    (pb.collection as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ ...nonRecurringTask, status: "completed", completed: true }),
      create: jest.fn(),
    });

    await updateTaskStatusWithRecurrence(nonRecurringTask, "completed");

    expect(pb.collection("tasks").create).not.toHaveBeenCalled();
  });

  it("should NOT create a new task if status is not completed", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ ...mockTask, status: "in_progress" }),
      create: jest.fn(),
    });

    await updateTaskStatusWithRecurrence(mockTask, "in_progress");

    expect(pb.collection("tasks").create).not.toHaveBeenCalled();
  });
});
