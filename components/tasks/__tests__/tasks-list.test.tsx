import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TasksList } from "../tasks-list";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue({});
const mockCreate = jest.fn().mockResolvedValue({});
const mockGetList = jest.fn();

jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn((collectionName) => {
      if (collectionName === "tasks") {
        return {
          getList: mockGetList,
          update: mockUpdate,
          create: mockCreate,
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

  it("should update task status", async () => {
    const task = { id: "1", title: "Task to Update", due_date: "2024-01-10T10:00:00Z", completed: false, status: 'pending' };
    mockGetList.mockResolvedValue({ items: [task] });

    await act(async () => {
      render(<TasksList />);
    });

    // Find the status trigger (icon variant has title "Pendiente")
    const statusTrigger = screen.getByTitle("Pendiente");
    
    await act(async () => {
        fireEvent.click(statusTrigger);
    });

    // Find option in dropdown
    const completedOption = screen.getByText("Completada");

    await act(async () => {
        fireEvent.click(completedOption);
    });
    
    expect(mockUpdate).toHaveBeenCalledWith("1", { status: 'completed', completed: true });
    expect(mockGetList).toHaveBeenCalledTimes(2); 
  });

  it("should create next task when completing a recurring task", async () => {
    const recurringTask = {
        id: "1",
        title: "Recurring Task",
        due_date: "2024-01-10T12:00:00Z",
        completed: false,
        status: 'pending',
        recurrence: JSON.stringify({ frequency: 'daily', interval: 1 })
    };
    mockGetList.mockResolvedValue({ items: [recurringTask] });

    await act(async () => {
      render(<TasksList />);
    });

    // Find the status trigger
    const statusTrigger = screen.getByTitle("Pendiente");
    await act(async () => { fireEvent.click(statusTrigger); });
    
    // Select completed
    const completedOption = screen.getByText("Completada");
    await act(async () => { fireEvent.click(completedOption); });

    // Expect update to complete current task
    expect(mockUpdate).toHaveBeenCalledWith("1", { status: 'completed', completed: true });

    // Expect create to be called for next task (should be 2024-01-11 since fake time is 2024-01-10)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        title: "Recurring Task",
        status: 'pending',
        completed: false,
        recurrence: recurringTask.recurrence
    }));
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
