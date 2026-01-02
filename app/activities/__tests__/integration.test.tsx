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
        if (collectionName === "activities") {
            return {
                getFullList: jest.fn().mockImplementation(() => Promise.resolve([...mockStore])),
                create: jest.fn().mockImplementation((data) => {
                    const newActivity = { ...data, id: `activity-${Date.now()}`, created: new Date().toISOString() };
                    mockStore.push(newActivity);
                    return Promise.resolve(newActivity);
                }),
                delete: jest.fn().mockImplementation((id) => {
                    const index = mockStore.findIndex(a => a.id === id);
                    if (index !== -1) {
                        mockStore.splice(index, 1);
                    }
                    return Promise.resolve(true);
                }),
                subscribe: jest.fn(),
                unsubscribe: jest.fn(),
            };
        }
        if (collectionName === "matters") {
            return {
                getFullList: jest.fn().mockResolvedValue([]),
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

// Mock child components
jest.mock("@/components/activities/create-activity-modal", () => ({
    CreateActivityModal: ({ isOpen, onClose, onSuccess }: any) => (
        isOpen ? (
            <div data-testid="create-activity-modal">
                <h1>Nueva Actividad</h1>
                <input placeholder="Título" id="activity-title" />
                <button onClick={() => {
                    // Simulate create
                    const pb = require("@/lib/pocketbase").pb;
                    const titleInput = document.getElementById("activity-title") as HTMLInputElement;
                    pb.collection("activities").create({ title: titleInput?.value || "New Activity" }).then(() => {
                        onSuccess();
                        onClose();
                    });
                }}>Guardar</button>
            </div>
        ) : null
    )
}));

jest.mock("@/components/activities/activity-detail-modal", () => ({
    ActivityDetailModal: () => <div data-testid="activity-detail">Detail</div>
}));

// Mock RichTextEditor
jest.mock("@/components/ui/editor/rich-text-editor", () => ({
    RichTextEditor: () => <div data-testid="rich-text-editor" />
}));

describe("Activities Integration", () => {
  beforeEach(() => {
    // Reset store
    const { pb } = require("@/lib/pocketbase");
    pb._resetStore();
    jest.clearAllMocks();
  });

  it("should complete full activity lifecycle (list -> create -> list -> delete)", async () => {
    await act(async () => {
        render(<Page />);
    });

    // 1. Initially empty
    await waitFor(() => {
        expect(screen.getByText("No hay actividades")).toBeInTheDocument();
    });

    // 2. Open Create Modal
    const createButtons = await screen.findAllByText("Nueva Actividad");
    await act(async () => {
        fireEvent.click(createButtons[0]);
    });

    await waitFor(() => {
        expect(screen.getByTestId("create-activity-modal")).toBeInTheDocument();
    });

    // 3. Create Activity
    const titleInput = screen.getByPlaceholderText("Título");
    fireEvent.change(titleInput, { target: { value: "Integration Activity" } });
    
    await act(async () => {
        fireEvent.click(screen.getByText("Guardar"));
    });

    // 4. Verify in list
    await waitFor(() => {
        expect(screen.getByText("Integration Activity")).toBeInTheDocument();
    });

    // 5. Delete Activity
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    const deleteButtons = screen.getAllByTitle("Eliminar");
    await act(async () => {
        fireEvent.click(deleteButtons[0]);
    });

    // 6. Verify removed
    await waitFor(() => {
        expect(screen.queryByText("Integration Activity")).not.toBeInTheDocument();
        expect(screen.getByText("No hay actividades")).toBeInTheDocument();
    });
  });
});
