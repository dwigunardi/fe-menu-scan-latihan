import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

// Component that throws error on purpose
function ProblematicChild({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Crash from child component');
  }
  return <div>Konten Normal</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblematicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Konten Normal')).toBeInTheDocument();
  });

  it('renders fallback UI when child component crashes', () => {
    // Silence console error from React during intentional crash
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary moduleName="TestModule">
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Terjadi Kesalahan pada Tampilan')).toBeInTheDocument();
    expect(screen.getByText('Crash from child component')).toBeInTheDocument();
    expect(screen.getByText('Coba Muat Ulang Komponen')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom Error Display</div>}>
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error Display')).toBeInTheDocument();

    spy.mockRestore();
  });
});
