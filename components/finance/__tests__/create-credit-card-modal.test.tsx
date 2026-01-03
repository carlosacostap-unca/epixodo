import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateCreditCardModal } from "../create-credit-card-modal";
import { pb } from "@/lib/pocketbase";

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    authStore: {
      model: { id: "test-user-id" },
    },
    collection: jest.fn(() => ({
      create: jest.fn(),
      update: jest.fn(),
    })),
  },
}));

describe("CreateCreditCardModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when open", () => {
    render(
      <CreateCreditCardModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Nueva Tarjeta")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de la tarjeta")).toBeInTheDocument();
  });

  it("submits form with correct data", async () => {
    render(
      <CreateCreditCardModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la tarjeta"), {
      target: { value: "Visa Gold" },
    });

    fireEvent.click(screen.getByText("Crear Tarjeta"));

    await waitFor(() => {
      expect(pb.collection).toHaveBeenCalledWith("credit_cards");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
