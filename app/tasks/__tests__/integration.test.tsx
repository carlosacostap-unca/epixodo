import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TasksPage from "../page";
import { pb } from "@/lib/pocketbase";

// Mock RichTextEditor
jest.mock("@/components/ui/editor/rich-text-editor", () => ({
  RichTextEditor: ({ content, onChange, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={!onChange}
    />
  ),
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => {
  const mockStore: any[] = [
    { 
        id: "task-1", 
        title: "Existing Task", 
        description: "Some description", 
        due_date: "2024-01-10T12:00:00Z", 
        completed: false, 
        created: "2024-01-01",
        expand: {} 
    }
  ];

  return {
    pb: {
      authStore: {
        isValid: true,
        model: { id: "user-123", name: "Test User" },
      },
      // Helper for tests to reset store
      _resetStore: () => {
        mockStore.length = 0;
        mockStore.push({ 
            id: "task-1", 
            title: "Existing Task", 
            description: "Some description", 
            due_date: "2024-01-10T12:00:00Z", 
            completed: false, 
            created: "2024-01-01",
            expand: {} 
        });
      },
      collection: jest.fn((collectionName) => {
        if (collectionName === "tasks") {
            return {
                getList: jest.fn().mockImplementation(() => Promise.resolve({ items: [...mockStore] })),
                create: jest.fn().mockImplementation((data) => {
                    const newTask = { ...data, id: `task-${Date.now()}`, created: new Date().toISOString() };
                    mockStore.push(newTask);
                    return Promise.resolve(newTask);
                }),
                update: jest.fn().mockImplementation((id, data) => {
                    const index = mockStore.findIndex(t => t.id === id);
                    if (index !== -1) {
                        mockStore[index] = { ...mockStore[index], ...data };
                        return Promise.resolve(mockStore[index]);
                    }
                    return Promise.reject("Not found");
                }),
                delete: jest.fn().mockImplementation((id) => {
                    const index = mockStore.findIndex(t => t.id === id);
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

describe("Tasks Module Integration", () => {
  const fixedDate = new Date("2024-01-10T12:00:00Z"); // Wednesday

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset store via the exposed helper
    (pb as any)._resetStore();
    jest.clearAllMocks();
  });

  it("should create, list, and complete a task", async () => {
    await act(async () => {
      render(<TasksPage />);
    });

    // 1. Check initial render
    expect(screen.getByText("Existing Task")).toBeInTheDocument();

    // 2. Open Create Modal
    fireEvent.click(screen.getByText("Crear nueva tarea"));
    
    // Wait for modal to open
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: "Nueva Tarea", level: 1 })).toBeInTheDocument();
    });

    // 3. Fill Form
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "New Integration Task" } });
    fireEvent.change(screen.getByLabelText(/Fecha de Vencimiento/i), { target: { value: "2024-01-11" } }); // Tomorrow
    
    // 4. Submit
    const submitBtn = screen.getByRole("button", { name: /Crear Tarea/i });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // 5. Verify List Update
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: "Nueva Tarea", level: 1 })).not.toBeInTheDocument(); // Modal closed
      expect(screen.getByText("New Integration Task")).toBeInTheDocument();
    });

    // 6. Complete the task
    // Find the toggle button for the new task
    const newTaskTitle = screen.getByText("New Integration Task");
    // Navigate up to the card
    const taskCard = newTaskTitle.closest("div.group");
    expect(taskCard).toBeInTheDocument();
    
    // The button is inside the card.
    const toggleBtn = taskCard?.querySelector("button");
    expect(toggleBtn).toBeInTheDocument();

    await act(async () => {
      if (toggleBtn) fireEvent.click(toggleBtn);
    });

    // 7. Verify Completion Status via UI
    await waitFor(() => {
        // Re-query the card or check text within it
        const card = screen.getByText("New Integration Task").closest("div.group");
        expect(card).toHaveTextContent("Completada");
    });
  });
});
