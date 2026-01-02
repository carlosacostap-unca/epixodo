import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CreateTaskModal } from "../create-task-modal";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      create: jest.fn(),
      getFullList: jest.fn(),
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

describe("CreateTaskModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection as jest.Mock).mockReturnValue({
      create: jest.fn().mockResolvedValue({ id: "task-123" }),
      getFullList: jest.fn().mockResolvedValue([]),
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
    expect(screen.getByText("Nueva Tarea")).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
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

    const titleInput = screen.getByLabelText(/Título/i);
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

    const titleInput = screen.getByLabelText(/Título/i);
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
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should validate date logic (planned <= due)", async () => {
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <CreateTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Tarea mal fechada" } });
    
    // Set due date to today
    fireEvent.change(screen.getByLabelText(/Fecha de Vencimiento/i), { target: { value: "2024-01-01" } });
    
    // Set planned date to tomorrow (invalid)
    fireEvent.change(screen.getByLabelText(/Fecha Planificada/i), { target: { value: "2024-01-02" } });

    const submitButton = screen.getByRole("button", { name: /Crear Tarea/i });
    fireEvent.click(submitButton);

    expect(mockAlert).toHaveBeenCalledWith("La fecha planificada no puede ser posterior a la fecha de vencimiento.");
    expect(pb.collection("tasks").create).not.toHaveBeenCalled();

    mockAlert.mockRestore();
  });

  it("should load matters options", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
        create: jest.fn(),
        getFullList: jest.fn().mockResolvedValue([
            { id: "m1", title: "Asunto 1" },
            { id: "m2", title: "Asunto 2" }
        ]),
    });

    await act(async () => {
      render(
        <CreateTaskModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    await waitFor(() => {
        expect(pb.collection).toHaveBeenCalledWith("matters");
        expect(pb.collection("matters").getFullList).toHaveBeenCalled();
    });
    
    // Check if options are rendered (might need to wait for state update)
    // Note: In the component, matters are fetched in useEffect.
    // We might need to check the select options.
    const select = screen.getByLabelText(/Asunto \(Opcional\)/i);
    expect(select).toBeInTheDocument();
    
    await waitFor(() => {
        expect(screen.getByText("Asunto 1")).toBeInTheDocument();
        expect(screen.getByText("Asunto 2")).toBeInTheDocument();
    });
  });
});
