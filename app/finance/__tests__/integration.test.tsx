import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import FinancePage from '../page';
import { pb } from '@/lib/pocketbase';

// Mock mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock PocketBase
jest.mock('@/lib/pocketbase', () => {
  const createMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const getFullListMock = jest.fn();
  const subscribeMock = jest.fn();
  const unsubscribeMock = jest.fn();

  return {
    pb: {
      authStore: {
        isValid: true,
        model: { id: 'test-user', name: 'Test User' },
      },
      collection: jest.fn(() => ({
        getFullList: getFullListMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
        subscribe: subscribeMock,
        unsubscribe: unsubscribeMock,
      })),
    },
  };
});

describe('FinancePage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for fetching
    (pb.collection('transactions').getFullList as jest.Mock).mockResolvedValue([]);
  });

  it('completes the full flow: create -> list -> edit -> delete', async () => {
    // 1. Initial Render (Empty State)
    render(<FinancePage />);

    // Wait for loading to finish and check empty state
    await waitFor(() => {
      expect(screen.getByText('No hay transacciones registradas')).toBeInTheDocument();
    });

    // 2. Create Transaction
    // Click "Nueva Transacción"
    fireEvent.click(screen.getByText('Nueva Transacción'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Salary' } });
    
    // Select type (assuming default is expense, let's switch to income)
    // The component uses a button group or select. Let's check CreateTransactionModal implementation logic if needed.
    // Based on previous reads, it has buttons for Income/Expense.
    // Let's assume default is expense or find the button "Ingreso".
    const incomeButton = screen.getByText('Ingreso');
    fireEvent.click(incomeButton);

    // Mock create response
    const newTransaction = {
      id: 'tx-1',
      amount: 1000,
      type: 'income',
      description: 'Salary',
      category: 'Salario',
      date: '2023-01-01 10:00:00',
    };
    (pb.collection('transactions').create as jest.Mock).mockResolvedValueOnce(newTransaction);
    
    // Mock list update after create
    (pb.collection('transactions').getFullList as jest.Mock).mockResolvedValueOnce([newTransaction]);

    // Submit
    fireEvent.click(screen.getByText('Guardar'));

    // Verify list updates
    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
      // Use regex for currency as it might vary by locale
      expect(screen.getByText(/\+.*1\.?000/)).toBeInTheDocument(); 
    });

    // 3. Edit Transaction
    // Find edit button (Pencil icon). It's in the row.
    const editButton = screen.getByTitle('Editar');
    fireEvent.click(editButton);

    // Verify modal opens with data
    await waitFor(() => {
      expect(screen.getByText('Editar Transacción')).toBeInTheDocument();
      expect(screen.getByLabelText('Monto')).toHaveValue(1000);
      expect(screen.getByLabelText('Descripción')).toHaveValue('Salary');
    });

    // Change amount
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1500' } });
    
    // Mock update response
    const updatedTransaction = { ...newTransaction, amount: 1500 };
    (pb.collection('transactions').update as jest.Mock).mockResolvedValueOnce(updatedTransaction);
    
    // Mock list update after edit
    (pb.collection('transactions').getFullList as jest.Mock).mockResolvedValueOnce([updatedTransaction]);

    // Submit update
    fireEvent.click(screen.getByText('Guardar'));

    // Verify list updates
    await waitFor(() => {
        expect(screen.getByText(/\+.*1\.?500/)).toBeInTheDocument();
    });

    // 4. Delete Transaction
    // Mock delete confirmation
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
    // Mock delete response
    (pb.collection('transactions').delete as jest.Mock).mockResolvedValueOnce(true);
    
    // Mock list update after delete (empty again)
    (pb.collection('transactions').getFullList as jest.Mock).mockResolvedValueOnce([]);

    // Click delete
    const deleteButton = screen.getByTitle('Eliminar');
    fireEvent.click(deleteButton);

    // Verify list is empty again
    await waitFor(() => {
        expect(screen.getByText('No hay transacciones registradas')).toBeInTheDocument();
    });
  });
});
