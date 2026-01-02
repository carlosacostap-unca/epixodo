import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CreateMatterModal } from "../create-matter-modal";
import { pb } from "@/lib/pocketbase";

// Mocks
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      create: jest.fn(),
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

describe("CreateMatterModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly when isOpen is true", async () => {
    await act(async () => {
      render(
        <CreateMatterModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Nuevo Asunto")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", async () => {
    await act(async () => {
      render(
        <CreateMatterModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("should validate required title", async () => {
    await act(async () => {
      render(
        <CreateMatterModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    const submitButton = screen.getByText("Crear Asunto");
    expect(submitButton).toBeDisabled();

    const titleInput = screen.getByLabelText(/Título/i);
    await act(async () => {
        fireEvent.change(titleInput, { target: { value: "Test Matter" } });
    });

    expect(submitButton).not.toBeDisabled();
  });

  it("should create matter successfully", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      create: jest.fn().mockResolvedValue({ id: "matter-1", title: "Test Matter" }),
    });

    await act(async () => {
      render(
        <CreateMatterModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    await act(async () => {
        fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Test Matter" } });
        fireEvent.change(screen.getByTestId("rich-editor"), { target: { value: "Description" } });
    });

    await act(async () => {
        fireEvent.click(screen.getByText("Crear Asunto"));
    });

    await waitFor(() => {
      expect(pb.collection).toHaveBeenCalledWith("matters");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
