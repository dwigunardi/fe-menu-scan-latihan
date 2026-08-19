import { describe, it, expect } from 'vitest';
import { formatRupiah } from './format-currency';

describe('formatRupiah', () => {
  it('formats positive numbers correctly into Rupiah format', () => {
    const result = formatRupiah(25000).replace(/\s/g, ' ');
    expect(result).toMatch(/Rp\s?25\.000/);
  });

  it('formats 0 correctly', () => {
    const result = formatRupiah(0).replace(/\s/g, ' ');
    expect(result).toMatch(/Rp\s?0/);
  });

  it('handles NaN gracefully by returning Rp 0', () => {
    expect(formatRupiah(NaN)).toBe('Rp 0');
  });

  it('formats large numbers correctly with thousands separators', () => {
    const result = formatRupiah(1500000).replace(/\s/g, ' ');
    expect(result).toMatch(/Rp\s?1\.500\.000/);
  });

  it('formats negative numbers correctly', () => {
    const result = formatRupiah(-5000).replace(/\s/g, ' ');
    expect(result).toMatch(/-Rp\s?5\.000|Rp\s?-5\.000/);
  });
});
