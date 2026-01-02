import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateNoteModal } from '../create-note-modal';
import { pb } from '@/lib/pocketbase';

// Mock the pb module
jest.mock('@/lib/pocketbase', () => {
  const createMock = jest.fn();
  return {
    pb: {
      collection: jest.fn((name) => {
        if (name === 'notes') {
          return {
            create: createMock,
          };
        }
        return {
          create: jest.fn(),
        };
      }),
      authStore: {
        model: { id: 'test-user-id' },
      },
    },
  };
});

// Mock RichTextEditor
jest.mock('@/components/ui/editor/rich-text-editor', () => ({
  RichTextEditor: ({ onChange, content, placeholder }: any) => (
    <textarea
      placeholder={placeholder}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      data-testid="rich-text-editor"
    />
  ),
}));

describe('CreateNoteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <CreateNoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Nueva Nota')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('submit button is disabled when title is empty', () => {
    render(
      <CreateNoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Crear Nota');
    expect(submitButton).toBeDisabled();
  });

  it('submits successfully with valid data', async () => {
    // Setup mock return value
    (pb.collection('notes').create as jest.Mock).mockResolvedValueOnce({});

    render(
      <CreateNoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'My Note' } });
    fireEvent.change(screen.getByTestId('rich-text-editor'), { target: { value: 'Note Content' } });
    
    // Submit
    const submitButton = screen.getByText('Crear Nota');
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
        expect(pb.collection('notes').create).toHaveBeenCalledWith({
            title: 'My Note',
            content: 'Note Content',
            user: 'test-user-id',
        });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets form when reopened', () => {
    const { rerender } = render(
      <CreateNoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Draft Note' } });
    
    // Close modal (simulate by rerendering with isOpen=false)
    rerender(
        <CreateNoteModal
            isOpen={false}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
        />
    );

    // Reopen
    rerender(
        <CreateNoteModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
        />
    );

    // Title should be empty
    expect(screen.getByLabelText('Título')).toHaveValue('');
  });
});
