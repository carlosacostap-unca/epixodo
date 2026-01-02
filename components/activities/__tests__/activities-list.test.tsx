import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ActivitiesList } from "../activities-list";
import { pb } from "@/lib/pocketbase";

// Mocks
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      getFullList: jest.fn(),
      delete: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("../activity-detail-modal", () => ({
    ActivityDetailModal: () => <div data-testid="activity-detail-modal">Detail Modal</div>
}));

jest.mock("../create-activity-modal", () => ({
    CreateActivityModal: ({ isOpen }: any) => isOpen ? <div data-testid="create-activity-modal">Create Modal</div> : null
}));

describe("ActivitiesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show loading state initially", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      getFullList: jest.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });

    await act(async () => {
        render(<ActivitiesList />);
    });
  });

  it("should render activities list correctly", async () => {
    const mockActivities = [
      { id: "1", title: "Activity 1", start_date: "2024-01-01T12:00:00Z" },
      { id: "2", title: "Activity 2" },
    ];

    (pb.collection as jest.Mock).mockReturnValue({
      getFullList: jest.fn().mockResolvedValue(mockActivities),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });

    await act(async () => {
      render(<ActivitiesList />);
    });

    await waitFor(() => {
      expect(screen.getByText("Activity 1")).toBeInTheDocument();
      expect(screen.getByText("Activity 2")).toBeInTheDocument();
    });
  });

  it("should show empty state when no activities", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      getFullList: jest.fn().mockResolvedValue([]),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });

    await act(async () => {
      render(<ActivitiesList />);
    });

    await waitFor(() => {
      expect(screen.getByText("No hay actividades")).toBeInTheDocument();
    });
  });

  it("should open create modal", async () => {
    (pb.collection as jest.Mock).mockReturnValue({
      getFullList: jest.fn().mockResolvedValue([]),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });

    await act(async () => {
      render(<ActivitiesList />);
    });

    // Click create button (there might be multiple)
    const createButtons = await screen.findAllByText("Nueva Actividad");
    await act(async () => {
        fireEvent.click(createButtons[0]);
    });

    expect(screen.getByTestId("create-activity-modal")).toBeInTheDocument();
  });
});
