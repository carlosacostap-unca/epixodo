import { render, screen, fireEvent } from "@testing-library/react";
import { CreditCardsList } from "../credit-cards-list";

// Mock PocketBase
jest.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: jest.fn(() => ({
      delete: jest.fn(),
    })),
  },
}));

describe("CreditCardsList", () => {
  const mockCards = [
    {
      id: "1",
      name: "Visa Galicia",
      closing_date: 5,
      due_date: 15,
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnUpdate = jest.fn();

  it("renders empty state when no cards", () => {
    render(
      <CreditCardsList
        cards={[]}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText("No tienes tarjetas")).toBeInTheDocument();
  });

  it("renders card list correctly", () => {
    render(
      <CreditCardsList
        cards={mockCards}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText("Visa Galicia")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <CreditCardsList
        cards={mockCards}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    const editButton = screen.getByLabelText("Editar Visa Galicia");
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCards[0]);
  });
});
