import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionList } from '../transaction-list';
import { pb } from '@/lib/pocketbase';

// Mock the pb module
jest.mock('@/lib/pocketbase', () => {
  const deleteMock = jest.fn();
  return {
    pb: {
      collection: jest.fn((name) => {
        if (name === 'transactions') {
          return {
            delete: deleteMock,
          };
        }
        return {
          delete: jest.fn(),
        };
      }),
    },
  };
});

// Mock date-utils
jest.mock('@/lib/date-utils', () => ({
  formatDate: (date: string) => `Formatted ${date}`,
}));

describe('TransactionList', () => {
  const mockOnUpdate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockTransactions = [
    {
      id: '1',
      amount: 1000,
      type: 'income' as const,
      description: 'Salary',
      category: 'Work',
      date: '2023-01-01',
    },
    {
      id: '2',
      amount: 50,
      type: 'expense' as const,
      description: 'Groceries',
      category: 'Food',
      date: '2023-01-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no transactions', () => {
    render(<TransactionList transactions={[]} onUpdate={mockOnUpdate} onEdit={mockOnEdit} />);
    expect(screen.getByText('No hay transacciones registradas')).toBeInTheDocument();
  });

  it('renders transactions correctly', () => {
    render(<TransactionList transactions={mockTransactions} onUpdate={mockOnUpdate} onEdit={mockOnEdit} />);

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    
    // Check formatting
    // We expect the amount to be present. Since Intl can vary, we check for the number.
    // The received output in some envs is "1000,00" without dot.
    const incomeRow = screen.getByText('Salary').closest('tr');
    expect(incomeRow).toHaveTextContent(/1\.?000/); // Matches 1.000 or 1000
    
    const expenseRow = screen.getByText('Groceries').closest('tr');
    expect(expenseRow).toHaveTextContent('50');
    
    // Check dates (mocked)
    expect(screen.getByText('Formatted 2023-01-01')).toBeInTheDocument();
  });

  it('handles delete confirmation and action', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    (pb.collection('transactions').delete as jest.Mock).mockResolvedValueOnce(true);

    render(<TransactionList transactions={mockTransactions} onUpdate={mockOnUpdate} onEdit={mockOnEdit} />);

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
        expect(pb.collection('transactions').delete).toHaveBeenCalledWith('1');
    });
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('handles edit action', () => {
    render(<TransactionList transactions={mockTransactions} onUpdate={mockOnUpdate} onEdit={mockOnEdit} />);

    const editButtons = screen.getAllByTitle('Editar');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('cancels delete action', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => false);

    render(<TransactionList transactions={mockTransactions} onUpdate={mockOnUpdate} onEdit={mockOnEdit} />);

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(pb.collection('transactions').delete).not.toHaveBeenCalled();
    expect(mockOnUpdate).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
