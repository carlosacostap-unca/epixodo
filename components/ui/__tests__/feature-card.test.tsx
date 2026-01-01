import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../feature-card';
import { Home } from 'lucide-react'; // Icono de ejemplo

describe('FeatureCard', () => {
  const mockProps = {
    title: 'Test Title',
    description: 'Test Description',
    icon: Home,
    href: '/test-link',
  };

  it('renders title and description', () => {
    render(<FeatureCard {...mockProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders a link with correct href', () => {
    render(<FeatureCard {...mockProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test-link');
  });
});
