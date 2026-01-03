import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MatterDetailModal } from "../matter-detail-modal";
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

jest.mock("../../activities/create-activity-modal", () => ({
  CreateActivityModal: ({ isOpen }: any) => isOpen ? <div data-testid="create-activity-modal">Create Activity Modal</div> : null
}));

jest.mock("../../activities/activity-detail-modal", () => ({
  ActivityDetailModal: ({ isOpen }: any) => isOpen ? <div data-testid="activity-detail-modal">Activity Detail</div> : null
}));

describe("MatterDetailModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const matterId = "matter-123";

  const mockMatter = {
    id: matterId,
    title: "Test Matter",
    description: "Test Description",
    due_date: "2024-01-01T10:00:00.000Z",
  };

  const mockTasks = [
    { id: "t1", title: "Task 1", status: "pending", completed: false },
    { id: "t2", title: "Task 2", status: "completed", completed: true },
  ];

  const mockActivities = [
    { id: "a1", title: "Activity 1", start_date: "2024-01-01T10:00:00.000Z" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection as jest.Mock).mockImplementation((collectionName) => {
      if (collectionName === "matters") {
        return {
          getOne: jest.fn().mockResolvedValue(mockMatter),
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
      if (collectionName === "activities") {
        return {
          getList: jest.fn().mockResolvedValue({ items: mockActivities }),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        };
      }
      return {};
    });
  });

  it("should render matter details correctly", async () => {
    await act(async () => {
      render(
        <MatterDetailModal
          matterId={matterId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Matter")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    });
  });

  it("should toggle task status using updateTaskStatusWithRecurrence", async () => {
    (updateTaskStatusWithRecurrence as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      render(
        <MatterDetailModal
          matterId={matterId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText("Task 1")).toBeInTheDocument();
    });

    // Find the button to toggle Task 1 (pending)
    // Note: In MatterDetailModal, the button title is also based on completion
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
});
