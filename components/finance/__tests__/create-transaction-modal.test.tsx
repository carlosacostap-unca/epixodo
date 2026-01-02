import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTransactionModal } from '../create-transaction-modal';
import { pb } from '@/lib/pocketbase';

// Mock the pb module
jest.mock('@/lib/pocketbase', () => {
  const createMock = jest.fn();
  const updateMock = jest.fn();
  return {
    pb: {
      collection: jest.fn((name) => {
        if (name === 'transactions') {
          return {
            create: createMock,
            update: updateMock,
          };
        }
        return {
          create: jest.fn(),
          update: jest.fn(),
        };
      }),
      authStore: {
        model: { id: 'test-user-id' },
      },
    },
  };
});

describe('CreateTransactionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Nueva Transacción')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('does not submit if required fields are empty', async () => {
    render(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Guardar');
    fireEvent.click(submitButton);

    // Get the mock function from the mocked module
    // We need to access the mock directly. 
    // Since we defined it in the mock factory, we can't easily access the same instance unless we expose it or use a spy.
    // Better way:
    const createMock = pb.collection('transactions').create;
    expect(createMock).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data', async () => {
    // Setup mock return value
    (pb.collection('transactions').create as jest.Mock).mockResolvedValueOnce({});

    render(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Test Transaction' } });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Food' } });
    
    // Select "Ingreso" (Income)
    fireEvent.click(screen.getByText('Ingreso'));

    // Submit
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
        expect(pb.collection('transactions').create).toHaveBeenCalledWith({
            amount: 100,
            type: 'income',
            description: 'Test Transaction',
            category: 'Food',
            date: expect.any(String), // We can check date format if needed
            user: 'test-user-id',
        });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles submission error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (pb.collection('transactions').create as jest.Mock).mockRejectedValueOnce(new Error('Failed to create'));

    render(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Error Test' } });
    
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(pb.collection('transactions').create).toHaveBeenCalled();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('populates form and updates transaction when editing', async () => {
    const transactionToEdit = {
      id: '123',
      amount: 500,
      type: 'expense' as const,
      description: 'Old Description',
      category: 'Old Category',
      date: '2023-01-01',
    };

    (pb.collection('transactions').update as jest.Mock).mockResolvedValueOnce({});

    render(
      <CreateTransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        transactionToEdit={transactionToEdit}
      />
    );

    expect(screen.getByText('Editar Transacción')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toHaveValue(500);
    expect(screen.getByLabelText('Descripción')).toHaveValue('Old Description');

    // Modify fields
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '600' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'New Description' } });

    // Submit
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
        expect(pb.collection('transactions').update).toHaveBeenCalledWith('123', {
            amount: 600,
            type: 'expense',
            description: 'New Description',
            category: 'Old Category', // Should remain if not changed (via state)
            date: expect.any(String), // Date format might change slightly due to TZ
        });
    });

    expect(pb.collection('transactions').create).not.toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
