import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ActivityDetailModal } from "../activity-detail-modal";
import { pb } from "@/lib/pocketbase";
import { updateTaskStatusWithRecurrence } from "@/lib/task-actions";

// Mocks
jest.mock("@/lib/task-actions", () => ({
  updateTaskStatusWithRecurrence: jest.fn(),
}));

jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      getOne: jest.fn(),
      getList: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}));

jest.mock("@/components/ui/modal", () => ({
  Modal: ({ children, isOpen }: any) => (isOpen ? <div data-testid="modal">{children}</div> : null),
}));

jest.mock("@/components/ui/editor/rich-text-editor", () => ({
  RichTextEditor: ({ content, onChange }: any) => (
    <textarea
      data-testid="rich-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("../../tasks/task-detail-modal", () => ({
  TaskDetailModal: ({ isOpen }: any) => isOpen ? <div data-testid="task-detail-modal">Task Detail</div> : null
}));

jest.mock("../../tasks/create-task-modal", () => ({
  CreateTaskModal: ({ isOpen }: any) => isOpen ? <div data-testid="create-task-modal">Create Task Modal</div> : null
}));

describe("ActivityDetailModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const activityId = "activity-123";

  const mockActivity = {
    id: activityId,
    title: "Test Activity",
    description: "Test Description",
    start_date: "2024-01-01T10:00:00.000Z",
    end_date: "2024-01-01T11:00:00.000Z",
  };

  const mockTasks = [
    { id: "t1", title: "Task 1", status: "pending", completed: false },
    { id: "t2", title: "Task 2", status: "completed", completed: true },
    { id: "t3", title: "Task 3", status: "waiting_response", completed: false },
    { id: "t4", title: "Task 4", status: "blocked", completed: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection as jest.Mock).mockImplementation((collectionName) => {
      if (collectionName === "activities") {
        return {
          getOne: jest.fn().mockResolvedValue(mockActivity),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          update: jest.fn(),
        };
      }
      if (collectionName === "tasks") {
        return {
          getList: jest.fn().mockResolvedValue({ items: mockTasks }),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          update: jest.fn(),
        };
      }
      return {};
    });
  });

  it("should render activity details correctly", async () => {
    await act(async () => {
      render(
        <ActivityDetailModal
          activityId={activityId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Activity")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    });
  });

  it("should render tasks with correct status badges", async () => {
    await act(async () => {
      render(
        <ActivityDetailModal
          activityId={activityId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
      expect(screen.getByText("Pendiente")).toBeInTheDocument(); // Yellow badge

      expect(screen.getByText("Task 2")).toBeInTheDocument();
      expect(screen.getByText("Completada")).toBeInTheDocument(); // Green badge

      expect(screen.getByText("Task 3")).toBeInTheDocument();
      expect(screen.getByText("En espera de respuesta")).toBeInTheDocument(); // Orange badge

      expect(screen.getByText("Task 4")).toBeInTheDocument();
      expect(screen.getByText("Bloqueada")).toBeInTheDocument(); // Red badge
    });
  });

  it("should toggle task status from pending to completed", async () => {
    (updateTaskStatusWithRecurrence as jest.Mock).mockResolvedValue(undefined);
    
    (pb.collection as jest.Mock).mockImplementation((collectionName) => {
      if (collectionName === "activities") {
        return {
          getOne: jest.fn().mockResolvedValue(mockActivity),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        };
      }
      if (collectionName === "tasks") {
        return {
          getList: jest.fn().mockResolvedValue({ items: mockTasks }),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          update: jest.fn(),
        };
      }
      return {};
    });

    await act(async () => {
      render(
        <ActivityDetailModal
          activityId={activityId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Find the button to toggle Task 1 (pending)
    const task1ToggleBtn = screen.getAllByTitle("Marcar como completada")[0];
    
    await act(async () => {
      fireEvent.click(task1ToggleBtn);
    });

    await waitFor(() => {
      expect(updateTaskStatusWithRecurrence).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t1" }),
        "completed"
      );
    });
  });

  it("should toggle task status from completed to pending", async () => {
    (updateTaskStatusWithRecurrence as jest.Mock).mockResolvedValue(undefined);
    
    (pb.collection as jest.Mock).mockImplementation((collectionName) => {
      if (collectionName === "activities") {
        return {
          getOne: jest.fn().mockResolvedValue(mockActivity),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        };
      }
      if (collectionName === "tasks") {
        return {
          getList: jest.fn().mockResolvedValue({ items: mockTasks }),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
          update: jest.fn(),
        };
      }
      return {};
    });

    await act(async () => {
      render(
        <ActivityDetailModal
          activityId={activityId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Find the button to toggle Task 2 (completed)
    // Note: The title changes based on status
    const task2ToggleBtn = screen.getByTitle("Marcar como pendiente");
    
    await act(async () => {
      fireEvent.click(task2ToggleBtn);
    });

    await waitFor(() => {
      expect(updateTaskStatusWithRecurrence).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t2" }),
        "pending"
      );
    });
  });

  it("should open create task modal", async () => {
    await act(async () => {
      render(
        <ActivityDetailModal
          activityId={activityId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    const addTaskBtn = screen.getByText("+ Agregar Tarea");
    
    await act(async () => {
      fireEvent.click(addTaskBtn);
    });

    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });
});
