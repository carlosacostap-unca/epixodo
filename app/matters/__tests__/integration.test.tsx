import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Page from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock PocketBase with a stateful store
jest.mock("@/lib/pocketbase", () => {
  const mockStore: any[] = [];

  return {
    pb: {
      authStore: {
        isValid: true,
        model: { id: "user-123", name: "Test User" },
      },
      _resetStore: () => {
        mockStore.length = 0;
      },
      collection: jest.fn((collectionName) => {
        if (collectionName === "matters") {
            return {
                getFullList: jest.fn().mockImplementation(() => Promise.resolve([...mockStore])),
                create: jest.fn().mockImplementation((data) => {
                    const newMatter = { ...data, id: `matter-${Date.now()}`, created: new Date().toISOString() };
                    mockStore.push(newMatter);
                    return Promise.resolve(newMatter);
                }),
                delete: jest.fn().mockImplementation((id) => {
                    const index = mockStore.findIndex(m => m.id === id);
                    if (index !== -1) {
                        mockStore.splice(index, 1);
                    }
                    return Promise.resolve(true);
                }),
                subscribe: jest.fn(),
                unsubscribe: jest.fn(),
            };
        }
        return {
          getList: jest.fn().mockResolvedValue({ items: [] }),
          getFullList: jest.fn().mockResolvedValue([]),
        };
      }),
    }
  };
});

// Mock child components to avoid complex render trees
jest.mock("@/components/matters/create-matter-modal", () => ({
    CreateMatterModal: ({ isOpen, onClose, onSuccess }: any) => (
        isOpen ? (
            <div data-testid="create-matter-modal">
                <h1>Nuevo Asunto</h1>
                <input placeholder="Título" id="matter-title" />
                <button onClick={() => {
                    // Simulate create
                    const pb = require("@/lib/pocketbase").pb;
                    const titleInput = document.getElementById("matter-title") as HTMLInputElement;
                    pb.collection("matters").create({ title: titleInput?.value || "New Matter" }).then(() => {
                        onSuccess();
                        onClose();
                    });
                }}>Guardar</button>
            </div>
        ) : null
    )
}));

jest.mock("@/components/matters/matter-detail-modal", () => ({
    MatterDetailModal: () => <div data-testid="matter-detail">Detail</div>
}));

// Mock RichTextEditor
jest.mock("@/components/ui/editor/rich-text-editor", () => ({
    RichTextEditor: () => <div data-testid="rich-text-editor" />
}));

describe("Matters Integration", () => {
  beforeEach(() => {
    // Reset store
    const { pb } = require("@/lib/pocketbase");
    pb._resetStore();
    jest.clearAllMocks();
  });

  it("should complete full matter lifecycle (list -> create -> list -> delete)", async () => {
    await act(async () => {
        render(<Page />);
    });

    // 1. Initially empty
    await waitFor(() => {
        expect(screen.getByText("No hay asuntos")).toBeInTheDocument();
    });

    // 2. Open Create Modal
    const createButtons = await screen.findAllByText("Nuevo Asunto");
    await act(async () => {
        fireEvent.click(createButtons[0]);
    });

    await waitFor(() => {
        expect(screen.getByTestId("create-matter-modal")).toBeInTheDocument();
    });

    // 3. Create Matter
    const titleInput = screen.getByPlaceholderText("Título");
    fireEvent.change(titleInput, { target: { value: "Integration Matter" } });
    
    await act(async () => {
        fireEvent.click(screen.getByText("Guardar"));
    });

    // 4. Verify in list
    await waitFor(() => {
        expect(screen.getByText("Integration Matter")).toBeInTheDocument();
    });

    // 5. Delete Matter
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    const deleteButtons = screen.getAllByTitle("Eliminar"); // Assuming Delete button has title="Eliminar"
    await act(async () => {
        fireEvent.click(deleteButtons[0]);
    });

    // 6. Verify removed
    await waitFor(() => {
        expect(screen.queryByText("Integration Matter")).not.toBeInTheDocument();
        expect(screen.getByText("No hay asuntos")).toBeInTheDocument();
    });
  });
});
