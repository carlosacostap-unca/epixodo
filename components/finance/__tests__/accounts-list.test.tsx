import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountsList } from '../accounts-list';
import { pb } from '@/lib/pocketbase';

// Mock PocketBase
const deleteMock = jest.fn().mockResolvedValue({});
jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(() => ({
      delete: deleteMock,
    })),
  },
}));

describe('AccountsList', () => {
  const mockAccounts = [
    { id: '1', name: 'Banco A', type: 'bank', balance: 1000, currency: 'ARS' },
    { id: '2', name: 'Caja Chica', type: 'cash', balance: 500, currency: 'USD' },
  ];
  const mockOnEdit = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    deleteMock.mockClear();
  });

  it('renders empty state', () => {
    render(
      <AccountsList
        accounts={[]}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getByText('No tienes cuentas')).toBeInTheDocument();
  });

  it('renders accounts list', () => {
    render(
      <AccountsList
        accounts={mockAccounts}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Banco A')).toBeInTheDocument();
    expect(screen.getByText('Caja Chica')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <AccountsList
        accounts={mockAccounts}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    const editButton = screen.getByLabelText('Editar Banco A');
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockAccounts[0]);
  });
  
  it('calls delete when delete button is clicked and confirmed', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <AccountsList
        accounts={[mockAccounts[0]]}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
      />
    );

    const deleteButton = screen.getByLabelText('Eliminar Banco A');
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(pb.collection).toHaveBeenCalledWith('accounts');
    expect(deleteMock).toHaveBeenCalledWith('1');
    
    await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
