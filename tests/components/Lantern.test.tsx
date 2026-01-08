import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Lantern } from '../../components/Lantern';

describe('Lantern Component', () => {
  it('renders fu lantern when type is "fu"', () => {
    const { container } = render(<Lantern type="fu" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('180');
  });

  it('renders chun lantern when type is "chun"', () => {
    const { container } = render(<Lantern type="chun" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('80');
    expect(svg?.getAttribute('height')).toBe('150');
  });

  it('applies custom className', () => {
    const { container } = render(<Lantern type="fu" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies delay animation when delay prop is true', () => {
    const { container } = render(<Lantern type="fu" delay />);
    expect(container.firstChild).toHaveClass('animate-sway-delayed');
  });

  it('applies normal animation when delay prop is false', () => {
    const { container } = render(<Lantern type="fu" delay={false} />);
    expect(container.firstChild).toHaveClass('animate-sway');
  });
});
