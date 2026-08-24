import { describe, it, expect, beforeEach } from 'vitest';
import { useTableStore } from '@/store/use-table-store';

describe('useTableStore', () => {
  beforeEach(() => {
    useTableStore.getState().clearTableSession();
  });

  it('should save table session and validate table matching', () => {
    const { setTableSession, validateWithCurrentTable } = useTableStore.getState();

    setTableSession({
      tableNumber: '01',
      customerName: 'Dewi',
      tableSessionToken: 'mock-token-01',
      isConfirmed: true,
    });

    expect(useTableStore.getState().session?.tableNumber).toBe('01');
    expect(useTableStore.getState().session?.customerName).toBe('Dewi');

    // Validating with same table number returns true
    expect(validateWithCurrentTable('01')).toBe(true);

    // Validating with different table number clears session and returns false
    expect(validateWithCurrentTable('05')).toBe(false);
    expect(useTableStore.getState().session).toBeNull();
  });
});
