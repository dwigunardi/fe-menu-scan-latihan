import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/lib/utils/format-currency';

describe('formatRupiah', () => {
  it('formats positive numbers correctly into Rupiah format', () => {
    expect(formatRupiah(15000).replace(/\s/g, ' ')).toBe('Rp 15.000');
    expect(formatRupiah(1500000).replace(/\s/g, ' ')).toBe('Rp 1.500.000');
  });

  it('handles zero amount', () => {
    expect(formatRupiah(0).replace(/\s/g, ' ')).toBe('Rp 0');
  });

  it('handles negative numbers properly', () => {
    expect(formatRupiah(-5000).replace(/\s/g, ' ')).toBe('-Rp 5.000');
  });

  it('handles NaN gracefully', () => {
    expect(formatRupiah(NaN)).toBe('Rp 0');
  });
});
