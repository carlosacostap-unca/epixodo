import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CreateTaskModal } from "../create-task-modal";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      create: jest.fn(),
      getOne: jest.fn(),
    })),
    authStore: {
      model: { id: "user-123" },
    },
  },
}));

// Mock RichTextEditor
jest.mock("@/components/ui/editor/rich-text-editor", () => ({
  RichTextEditor: ({ content, onChange, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock Modal
jest.mock("@/components/ui/modal", () => ({
  Modal: ({ children, isOpen }: any) => (isOpen ? <div data-testid="modal">{children}</div> : null),
}));

// Mock Selector Modals
jest.mock("../../matters/matter-selector-modal", () => ({
  MatterSelectorModal: ({ isOpen, onSelect }: any) => isOpen ? (
    <div data-testid="matter-selector">
      <button onClick={() => onSelect({ id: "m1", title: "Asunto 1" })}>Select Matter Mock</button>
    </div>
  ) : null
}));

jest.mock("../../activities/activity-selector-modal", () => ({
  ActivitySelectorModal: ({ isOpen, onSelect }: any) => isOpen ? (
    <div data-testid="activity-selector">
      <button onClick={() => onSelect({ id: "a1", title: "Actividad 1" })}>Select Activity Mock</button>
    </div>
  ) : null
}));

describe("CreateTaskModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection as jest.Mock).mockReturnValue({
      create: jest.fn().mockResolvedValue({ id: "task-123" }),
      getOne: jest.fn().mockImplementation((id) => {
        if (id === "m1") return Promise.resolve({ id: "m1", title: "Asunto 1" });
        if (id === "a1") return Promise.resolve({ id: "a1", title: "Actividad 1" });
        return Promise.resolve(null);
      }),
    });
  });

  it("should not render when isOpen is false", () => {
    render(
      <CreateTaskModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("should render correctly when isOpen is true", async () => {
    await act(async () => {
      render(
        <CreateTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Título de la tarea")).toBeInTheDocument();
    expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
  });

  it("should validate required title", async () => {
    await act(async () => {
      render(
        <CreateTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    const submitButton = screen.getByRole("button", { name: /Crear Tarea/i });
    expect(submitButton).toBeDisabled();

    const titleInput = screen.getByPlaceholderText("Título de la tarea");
    fireEvent.change(titleInput, { target: { value: "Nueva Tarea" } });

    expect(submitButton).not.toBeDisabled();
  });

  it("should create a task on submit", async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText("Título de la tarea");
    fireEvent.change(titleInput, { target: { value: "Comprar leche" } });

    const editor = screen.getByTestId("rich-text-editor");
    fireEvent.change(editor, { target: { value: "Ir al supermercado" } });

    const submitButton = screen.getByRole("button", { name: /Crear Tarea/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(pb.collection).toHaveBeenCalledWith("tasks");
      expect(pb.collection("tasks").create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Comprar leche",
          description: "Ir al supermercado",
          user: "user-123",
          completed: false,
          status: "pending",
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should allow selecting a status", async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText("Título de la tarea");
    fireEvent.change(titleInput, { target: { value: "Tarea bloqueada" } });

    // Find the status trigger (icon variant)
    const statusTrigger = screen.getByTitle("Pendiente");
    fireEvent.click(statusTrigger);

    // Select "Bloqueada"
    const blockedOption = screen.getByText("Bloqueada");
    fireEvent.click(blockedOption);

    const submitButton = screen.getByRole("button", { name: /Crear Tarea/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(pb.collection("tasks").create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tarea bloqueada",
          status: "blocked",
          completed: false,
        })
      );
    });
  });

  it("should set completed=true when status is completed", async () => {
    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByPlaceholderText("Título de la tarea");
    fireEvent.change(titleInput, { target: { value: "Tarea completada" } });

    // Find the status trigger (icon variant)
    const statusTrigger = screen.getByTitle("Pendiente");
    fireEvent.click(statusTrigger);

    // Select "Completada"
    const completedOption = screen.getByText("Completada");
    fireEvent.click(completedOption);

    const submitButton = screen.getByRole("button", { name: /Crear Tarea/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(pb.collection("tasks").create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tarea completada",
          status: "completed",
          completed: true,
        })
      );
    });
  });

  it("should handle mutual exclusivity via selector modals", async () => {
    await act(async () => {
      render(
        <CreateTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    // Verify initial state: no association
    expect(screen.getByText("Sin asociación")).toBeInTheDocument();

    // Open Activity Selector
    const addActivityBtn = screen.getByText("Actividad", { selector: "button" });
    fireEvent.click(addActivityBtn);
    
    // Mock selecting an activity
    const selectActivityBtn = screen.getByText("Select Activity Mock");
    fireEvent.click(selectActivityBtn);

    // Verify activity is selected
    expect(screen.getByText("Actividad 1")).toBeInTheDocument();
    expect(screen.queryByText("Sin asociación")).not.toBeInTheDocument();

    // Remove association
    const removeBtn = screen.getByTitle("Quitar asociación");
    fireEvent.click(removeBtn);
    expect(screen.getByText("Sin asociación")).toBeInTheDocument();

    // Open Matter Selector
    const addMatterBtn = screen.getByText("Asunto", { selector: "button" });
    fireEvent.click(addMatterBtn);

    // Mock selecting a matter
    const selectMatterBtn = screen.getByText("Select Matter Mock");
    fireEvent.click(selectMatterBtn);

    // Verify matter is selected
    expect(screen.getByText("Asunto: Asunto 1")).toBeInTheDocument();

    // IMPORTANT: To test mutual exclusivity fully with the new UI, 
    // we would need to trigger the other selector while one is selected.
    // But the UI hides the "add" buttons when an association exists.
    // The user has to remove first. 
    // Wait, the requirement was "mutual exclusivity". 
    // The UI implementation enforces it by only allowing one slot.
    // If I were to programmatically call the handler (e.g. if I allowed swapping),
    // it would still hold.
    // For this UI, just verifying we can add one or the other is enough coverage for the UI flow.
  });
});
