import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Toast from '../../components/Toast/Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders toast with message', () => {
    render(
      <Toast 
        type="success" 
        message="Test message" 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Toast 
        type="success" 
        message="Test message" 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto closes after duration', async () => {
    render(
      <Toast 
        type="success" 
        message="Test message" 
        onClose={mockOnClose}
        duration={100}
      />
    );
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('renders different types correctly', () => {
    const { rerender } = render(
      <Toast type="success" message="Success" onClose={mockOnClose} />
    );
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Toast type="error" message="Error" onClose={mockOnClose} />);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<Toast type="warning" message="Warning" onClose={mockOnClose} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Toast type="info" message="Info" onClose={mockOnClose} />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
