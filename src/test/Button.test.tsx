import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Test</Button>);
    const button = screen.getByText('Test');
    expect(button).toHaveClass('bg-true-white');
  });

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Test</Button>);
    const button = screen.getByText('Test');
    expect(button).toHaveClass('bg-gray-800');
  });

  it('handles click events', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    
    const button = screen.getByText('Click');
    button.click();
    
    expect(clicked).toBe(true);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});
