import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../components/Header';

describe('Header Component', () => {
  it('renders title correctly', () => {
    render(<Header />);
    expect(screen.getByText('新春祝福')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('画廊')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
  });

  it('renders login button', () => {
    render(<Header />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });
});
