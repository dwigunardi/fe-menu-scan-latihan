import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './pagination';

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
});
