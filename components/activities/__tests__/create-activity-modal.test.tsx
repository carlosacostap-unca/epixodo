import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CreateActivityModal } from "../create-activity-modal";
import { pb } from "@/lib/pocketbase";

// Mocks
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      create: jest.fn(),
      getFullList: jest.fn().mockResolvedValue([]),
    })),
    authStore: {
      model: { id: "user-123" },
    },
  },
}));

jest.mock("@/components/ui/modal", () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

jest.mock("@/components/ui/editor/rich-text-editor", () => ({
  RichTextEditor: ({ onChange, content }: any) => (
    <textarea
      data-testid="rich-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe("CreateActivityModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly when isOpen is true", async () => {
    await act(async () => {
      render(
        <CreateActivityModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Nueva Actividad")).toBeInTheDocument();
  });

  it("should validate required title", async () => {
    await act(async () => {
      render(
        <CreateActivityModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    const submitButton = screen.getByText("Crear Actividad");
    expect(submitButton).toBeDisabled();

    const titleInput = screen.getByLabelText(/Título/i);
    await act(async () => {
        fireEvent.change(titleInput, { target: { value: "Test Activity" } });
    });

    expect(submitButton).not.toBeDisabled();
  });

  it("should load matters options", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
        create: jest.fn(),
        getFullList: jest.fn().mockResolvedValue([
            { id: "m1", title: "Matter 1" }
        ]),
    });

    await act(async () => {
      render(
        <CreateActivityModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    await waitFor(() => {
        expect(pb.collection).toHaveBeenCalledWith("matters");
    });
  });

  it("should create activity successfully", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      create: jest.fn().mockResolvedValue({ id: "activity-1", title: "Test Activity" }),
      getFullList: jest.fn().mockResolvedValue([]),
    });

    await act(async () => {
      render(
        <CreateActivityModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    await act(async () => {
        fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Test Activity" } });
        fireEvent.change(screen.getByTestId("rich-editor"), { target: { value: "Description" } });
    });

    await act(async () => {
        fireEvent.click(screen.getByText("Crear Actividad"));
    });

    await waitFor(() => {
      expect(pb.collection).toHaveBeenCalledWith("activities");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
