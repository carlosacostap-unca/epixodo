import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotesList } from '../notes-list';
import { pb } from '@/lib/pocketbase';

// Mock PocketBase
jest.mock('@/lib/pocketbase', () => {
  const getListMock = jest.fn();
  const subscribeMock = jest.fn();
  const unsubscribeMock = jest.fn();

  return {
    pb: {
      authStore: {
        model: { id: 'test-user-id' },
      },
      collection: jest.fn((name) => {
        if (name === 'notes') {
          return {
            getList: getListMock,
            subscribe: subscribeMock,
            unsubscribe: unsubscribeMock,
          };
        }
        return {
          getList: jest.fn(),
          subscribe: jest.fn(),
          unsubscribe: jest.fn(),
        };
      }),
    },
  };
});

// Mock CreateNoteModal and NoteDetailModal
jest.mock('../create-note-modal', () => ({
  CreateNoteModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div role="dialog">
        CreateNoteModal
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null,
}));

jest.mock('../note-detail-modal', () => ({
  NoteDetailModal: ({ noteId, onClose, onUpdate }: any) => (
    <div role="dialog" data-testid="note-detail-modal">
      NoteDetailModal: {noteId}
      <button onClick={onClose}>Close</button>
      <button onClick={onUpdate}>Update</button>
    </div>
  ),
}));

// Mock date-utils
jest.mock('@/lib/date-utils', () => ({
  formatDate: (date: string) => `Formatted ${date}`,
}));

describe('NotesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no notes', async () => {
    (pb.collection('notes').getList as jest.Mock).mockResolvedValue({ items: [] });

    render(<NotesList />);

    await waitFor(() => {
      expect(screen.getByText('No hay notas')).toBeInTheDocument();
    });
  });

  it('renders notes list correctly', async () => {
    const mockNotes = [
      { id: '1', title: 'Note 1', content: '<p>Content 1</p>', updated: '2023-01-01' },
      { id: '2', title: 'Note 2', content: '<p>Content 2</p>', updated: '2023-01-02' },
    ];
    (pb.collection('notes').getList as jest.Mock).mockResolvedValue({ items: mockNotes });

    render(<NotesList />);

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Note 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  it('opens create modal when clicking "Nueva Nota"', async () => {
    (pb.collection('notes').getList as jest.Mock).mockResolvedValue({ items: [] });

    render(<NotesList />);

    await waitFor(() => screen.getByText('No hay notas'));

    // There are two "Nueva Nota" buttons (one in header, one in empty state)
    const createButtons = screen.getAllByText('Nueva Nota');
    fireEvent.click(createButtons[0]);

    expect(screen.getByText('CreateNoteModal')).toBeInTheDocument();
  });

  it('opens detail modal when clicking a note', async () => {
    const mockNotes = [
      { id: '1', title: 'Note 1', content: 'Content 1', updated: '2023-01-01' },
    ];
    (pb.collection('notes').getList as jest.Mock).mockResolvedValue({ items: mockNotes });

    render(<NotesList />);

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Note 1'));

    expect(screen.getByTestId('note-detail-modal')).toBeInTheDocument();
    expect(screen.getByText('NoteDetailModal: 1')).toBeInTheDocument();
  });
});
