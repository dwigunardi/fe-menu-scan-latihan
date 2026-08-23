import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedCoffeeCup } from '@/components/illustrations/animated-coffee-cup';

describe('AnimatedCoffeeCup', () => {
  it('renders coffee cup SVG illustration and 404 badge', () => {
    const { container } = render(<AnimatedCoffeeCup className="w-64 h-64" />);
    
    // Check SVG exists
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    // Check "404" badge text in SVG
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('applies custom className wrapper', () => {
    const { container } = render(<AnimatedCoffeeCup className="custom-cup-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-cup-class');
  });
});
