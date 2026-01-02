import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TasksList } from "../tasks-list";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue({});
const mockGetList = jest.fn();

jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn((collectionName) => {
      if (collectionName === "tasks") {
        return {
          getList: mockGetList,
          update: mockUpdate,
          subscribe: mockSubscribe,
          unsubscribe: mockUnsubscribe,
        };
      }
      return {
        getList: jest.fn(),
      };
    }),
    authStore: {
      model: { id: "user-123" },
    },
  },
}));

// Mock child components to avoid complex render trees
jest.mock("../create-task-modal", () => ({
  CreateTaskModal: ({ isOpen }: any) => isOpen ? <div data-testid="create-task-modal">Create Modal</div> : null,
}));

jest.mock("../task-detail-modal", () => ({
  TaskDetailModal: ({ taskId }: any) => <div data-testid="task-detail-modal">Detail Modal: {taskId}</div>,
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("TasksList", () => {
  const fixedDate = new Date("2024-01-10T12:00:00Z"); // Wednesday

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", async () => {
    mockGetList.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<TasksList />);
    // Look for skeleton or loading indicator. The component renders 3 divs with animate-pulse
    // We can just check that it doesn't show "Nueva Tarea" yet or check for class names.
    // Easier: check that "Nueva Tarea" button is NOT there yet (as it is after loading)
    expect(screen.queryByText("Crear nueva tarea")).not.toBeInTheDocument();
  });

  it("should render tasks grouped by due date", async () => {
    mockGetList.mockResolvedValue({
      items: [
        { id: "1", title: "Task Overdue", due_date: "2024-01-01T10:00:00Z", completed: false },
        { id: "2", title: "Task Today", due_date: "2024-01-10T10:00:00Z", completed: false },
        { id: "3", title: "Task Future", due_date: "2024-02-01T10:00:00Z", completed: false },
      ],
    });

    await act(async () => {
      render(<TasksList />);
    });

    expect(screen.getByText("Crear nueva tarea")).toBeInTheDocument();
    
    // Check for section headers (partial match)
    expect(screen.getByText(/Tareas vencidas/)).toBeInTheDocument();
    expect(screen.getByText(/Tareas que vencen hoy/)).toBeInTheDocument();
    expect(screen.getByText(/Tareas que vencen después/)).toBeInTheDocument();

    // Check for task titles
    expect(screen.getByText("Task Overdue")).toBeInTheDocument();
    expect(screen.getByText("Task Today")).toBeInTheDocument();
    expect(screen.getByText("Task Future")).toBeInTheDocument();
  });

  it("should toggle task completion", async () => {
    const task = { id: "1", title: "Task to Complete", due_date: "2024-01-10T10:00:00Z", completed: false };
    mockGetList.mockResolvedValue({ items: [task] });

    await act(async () => {
      render(<TasksList />);
    });

    const checkButton = screen.getAllByRole("button")[1]; // First one is likely "New Task" or toggle section
    // Actually, finding the button inside the task card is safer.
    // The check button has a specific class or icon. 
    // Let's find the task card first.
    
    // We can use the container to find the button
    const taskTitle = screen.getByText("Task to Complete");
    const taskCard = taskTitle.closest("div.group");
    const toggleBtn = taskCard?.querySelector("button"); 
    
    if (toggleBtn) {
        await act(async () => {
            fireEvent.click(toggleBtn);
        });
        
        expect(mockUpdate).toHaveBeenCalledWith("1", { completed: true });
        expect(mockGetList).toHaveBeenCalledTimes(2); // Initial + Refetch
    } else {
        throw new Error("Toggle button not found");
    }
  });

  it("should open create modal", async () => {
    mockGetList.mockResolvedValue({ items: [] });
    await act(async () => {
      render(<TasksList />);
    });

    fireEvent.click(screen.getByText("Crear nueva tarea"));
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });

  it("should open detail modal when clicking a task", async () => {
    mockGetList.mockResolvedValue({
      items: [{ id: "1", title: "Click Me", due_date: "2024-01-10T10:00:00Z" }],
    });

    await act(async () => {
      render(<TasksList />);
    });

    fireEvent.click(screen.getByText("Click Me"));
    expect(screen.getByTestId("task-detail-modal")).toBeInTheDocument();
  });
});
