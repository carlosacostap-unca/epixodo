import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotesPage from '../page';
import { pb } from '@/lib/pocketbase';

// Mock mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock RichTextEditor (Tiptap is hard to test in JSDOM)
jest.mock('@/components/ui/editor/rich-text-editor', () => ({
  RichTextEditor: ({ content, onChange, placeholder }: any) => (
    <textarea
      placeholder={placeholder}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      data-testid="rich-text-editor"
    />
  ),
}));

// Mock PocketBase
jest.mock('@/lib/pocketbase', () => {
  const createMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const getListMock = jest.fn();
  const getOneMock = jest.fn();
  const subscribeMock = jest.fn();
  const unsubscribeMock = jest.fn();

  return {
    pb: {
      authStore: {
        isValid: true,
        model: { id: 'test-user', name: 'Test User' },
      },
      collection: jest.fn(() => ({
        getList: getListMock,
        getOne: getOneMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
        subscribe: subscribeMock,
        unsubscribe: unsubscribeMock,
      })),
    },
  };
});

describe('NotesPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pb.collection('notes').getList as jest.Mock).mockResolvedValue({ items: [] });
  });

  it('completes the full flow: create -> list -> view/edit -> delete', async () => {
    render(<NotesPage />);

    // 1. Initial Render (Empty State)
    await waitFor(() => {
      expect(screen.getByText('No hay notas')).toBeInTheDocument();
    });

    // 2. Create Note
    // There are multiple "Nueva Nota" buttons. One in header, one in empty state.
    // Use getAllByText and pick one, or use a more specific selector if possible.
    const createButtons = screen.getAllByText('Nueva Nota');
    fireEvent.click(createButtons[0]);

    // Wait for modal to open.
    // The modal uses a portal or renders directly.
    // Check for "Nueva Nota" heading inside the modal.
    // Since "Nueva Nota" is also on the button, we look for the heading specifically.
    await waitFor(() => {
        const headings = screen.getAllByText('Nueva Nota');
        // Filter for the one that is likely the modal header (e.g., inside an h1 or div)
        // Or check for other elements in the modal
        expect(screen.getByPlaceholderText('Escribe un título para la nota')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Escribe un título para la nota'), {
      target: { value: 'My New Note' },
    });
    
    // Interact with mocked RichTextEditor
    fireEvent.change(screen.getByTestId('rich-text-editor'), {
      target: { value: '<p>This is my note content.</p>' },
    });

    // Mock create response
    const newNote = {
      id: 'note-1',
      title: 'My New Note',
      content: '<p>This is my note content.</p>',
      updated: '2023-01-01 10:00:00',
      created: '2023-01-01 10:00:00',
      user: 'test-user'
    };
    (pb.collection('notes').create as jest.Mock).mockResolvedValueOnce(newNote);
    
    // Mock list update
    (pb.collection('notes').getList as jest.Mock).mockResolvedValueOnce({ items: [newNote] });

    // Submit
    fireEvent.click(screen.getByText('Crear Nota'));

    // Verify list update
    await waitFor(() => {
      expect(screen.getByText('My New Note')).toBeInTheDocument();
      // Content preview (mocked stripped HTML)
      expect(screen.getByText('This is my note content.')).toBeInTheDocument();
    });

    // 3. View/Edit Note (Detail Modal)
    // Mock getOne response for detail modal BEFORE clicking
    (pb.collection('notes').getOne as jest.Mock).mockResolvedValueOnce(newNote);

    // Click on the note card
    fireEvent.click(screen.getByText('My New Note'));

    // The detail modal fetches the note on mount.
    // Ensure we have mocked the getOne response BEFORE clicking if it triggers immediately, 
    // or the effect will run and consume the mock.
    // In our test setup, we mocked getOne right after click, which might be too late if the effect fires synchronously or very fast.
    // However, in JSDOM/React, effects run after render.
    // Let's verify NoteDetailModal implementation. It uses useEffect with noteId.
    
    // Let's ensure the mock is ready.
    // Actually, getOne is called with noteId.
    
    await waitFor(() => {
        // Check for modal elements. Title input is present.
        // We look for the input with the value
        const titleInput = screen.getByDisplayValue('My New Note');
        expect(titleInput).toBeInTheDocument();
        // Also check if it's the input inside the modal (NoteDetailModal renders an input for title)
        expect(titleInput.tagName).toBe('INPUT');
    });

    // Edit Title
    fireEvent.change(screen.getByDisplayValue('My New Note'), {
        target: { value: 'Updated Note Title' }
    });
    fireEvent.blur(screen.getByDisplayValue('Updated Note Title')); // Trigger save on blur

    // Mock update response
    const updatedNote = { ...newNote, title: 'Updated Note Title' };
    (pb.collection('notes').update as jest.Mock).mockResolvedValueOnce(updatedNote);
    
    // Wait for update call
    await waitFor(() => {
        expect(pb.collection('notes').update).toHaveBeenCalledWith('note-1', { title: 'Updated Note Title' }, expect.any(Object));
    });

    // 4. Delete Note
    // Mock delete confirmation
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    (pb.collection('notes').delete as jest.Mock).mockResolvedValueOnce(true);
    
    // Mock list update (empty)
    (pb.collection('notes').getList as jest.Mock).mockResolvedValueOnce({ items: [] });

    // Click delete button in modal
    fireEvent.click(screen.getByText('Eliminar'));

    await waitFor(() => {
        expect(pb.collection('notes').delete).toHaveBeenCalledWith('note-1');
    });

    // Modal should close and list should be empty
    await waitFor(() => {
        expect(screen.getByText('No hay notas')).toBeInTheDocument();
    });
  });
});
