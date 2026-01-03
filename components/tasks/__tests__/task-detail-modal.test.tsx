import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TaskDetailModal } from "../task-detail-modal";
import { pb } from "@/lib/pocketbase";

// Mocks
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      getOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

jest.mock("../../activities/activity-detail-modal", () => ({
  ActivityDetailModal: ({ isOpen }: any) => isOpen ? <div data-testid="activity-detail-modal">Activity Detail</div> : null
}));

jest.mock("../../matters/matter-selector-modal", () => ({
  MatterSelectorModal: ({ isOpen }: any) => isOpen ? <div data-testid="matter-selector">Matter Selector</div> : null
}));

jest.mock("../../activities/activity-selector-modal", () => ({
  ActivitySelectorModal: ({ isOpen }: any) => isOpen ? <div data-testid="activity-selector">Activity Selector</div> : null
}));

describe("TaskDetailModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const taskId = "task-123";

  const mockTask = {
    id: taskId,
    title: "Test Task",
    description: "Test Description",
    status: "pending",
    completed: false,
    due_date: "2024-01-01T10:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection as jest.Mock).mockReturnValue({
      getOne: jest.fn().mockResolvedValue(mockTask),
      update: jest.fn().mockResolvedValue({ ...mockTask }),
    });
  });

  it("should render task details correctly", async () => {
    await act(async () => {
      render(
        <TaskDetailModal
          taskId={taskId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    });
  });

  it("should change status to completed", async () => {
    const updateMock = jest.fn().mockResolvedValue({ ...mockTask, status: 'completed', completed: true });
    (pb.collection as jest.Mock).mockReturnValue({
      getOne: jest.fn().mockResolvedValue(mockTask),
      update: updateMock,
    });

    await act(async () => {
      render(
        <TaskDetailModal
          taskId={taskId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Find trigger button (icon variant has title)
    const statusTrigger = screen.getByTitle("Pendiente");
    fireEvent.click(statusTrigger);
    
    // Find option in dropdown
    const completedOption = screen.getByText("Completada");
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(taskId, {
        status: "completed",
        completed: true,
      });
    });
  });

  it("should change status to waiting_response", async () => {
    const updateMock = jest.fn().mockResolvedValue({ ...mockTask, status: 'waiting_response', completed: false });
    (pb.collection as jest.Mock).mockReturnValue({
      getOne: jest.fn().mockResolvedValue(mockTask),
      update: updateMock,
    });

    await act(async () => {
      render(
        <TaskDetailModal
          taskId={taskId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Find trigger button
    const statusTrigger = screen.getByTitle("Pendiente");
    fireEvent.click(statusTrigger);
    
    // Find option
    const waitingOption = screen.getByText("En espera de respuesta");
    fireEvent.click(waitingOption);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(taskId, {
        status: "waiting_response",
        completed: false,
      });
    });
  });

  it("should change status from completed to pending", async () => {
    const completedTask = { ...mockTask, status: 'completed', completed: true };
    const updateMock = jest.fn().mockResolvedValue({ ...completedTask, status: 'pending', completed: false });
    
    (pb.collection as jest.Mock).mockReturnValue({
      getOne: jest.fn().mockResolvedValue(completedTask),
      update: updateMock,
    });

    await act(async () => {
      render(
        <TaskDetailModal
          taskId={taskId}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );
    });

    // Find trigger button (icon variant has title)
    const statusTrigger = screen.getByTitle("Completada");
    fireEvent.click(statusTrigger);
    
    // Find option
    const pendingOption = screen.getByText("Pendiente");
    fireEvent.click(pendingOption);

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(taskId, {
        status: "pending",
        completed: false,
      });
    });
  });
});
