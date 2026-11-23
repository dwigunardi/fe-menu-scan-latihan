import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/common/pagination';

describe('Pagination Component', () => {
  it('renders item range summary and navigates between pages', () => {
    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();

    render(
      <Pagination
        page={2}
        limit={10}
        totalItems={35}
        totalPages={4}
        hasNextPage={true}
        hasPrevPage={true}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemLabel="menu"
      />
    );

    expect(screen.getByText('11-20')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /Sebelumnya/i });
    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    const nextBtn = screen.getByRole('button', { name: /Selanjutnya/i });
    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page and next button on last page', () => {
    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();

    const { rerender } = render(
      <Pagination
        page={1}
        limit={10}
        totalItems={20}
        totalPages={2}
        hasNextPage={true}
        hasPrevPage={false}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    );

    expect(screen.getByRole('button', { name: /Sebelumnya/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Selanjutnya/i })).not.toBeDisabled();

    rerender(
      <Pagination
        page={2}
        limit={10}
        totalItems={20}
        totalPages={2}
        hasNextPage={false}
        hasPrevPage={true}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    );

    expect(screen.getByRole('button', { name: /Selanjutnya/i })).toBeDisabled();
  });

  it('renders numbered page buttons, handles direct page clicks, and renders ellipses for large page counts', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={5}
        limit={10}
        totalItems={100}
        totalPages={10}
        hasNextPage={true}
        hasPrevPage={true}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
      />
    );

    // Page 1, 4, 5, 6, 10 should be visible
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();

    // Ellipses should be rendered
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);

    // Click page 6
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('handles limit = -1 (All items) and totalItems = 0 correctly', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination
        page={1}
        limit={-1}
        totalItems={50}
        totalPages={1}
        hasNextPage={false}
        hasPrevPage={false}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getByText('1-50')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sebelumnya/i })).not.toBeInTheDocument();

    // Empty list
    rerender(
      <Pagination
        page={1}
        limit={10}
        totalItems={0}
        totalPages={0}
        hasNextPage={false}
        hasPrevPage={false}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
      />
    );

    expect(screen.getByText('0-0')).toBeInTheDocument();
  });
});
