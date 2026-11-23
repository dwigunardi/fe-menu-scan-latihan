import { describe, it, expect } from 'vitest';
import { getInitials } from '@/lib/utils/get-initials';

describe('getInitials Utility', () => {
  it('extracts initials properly from multi-word names with slashes', () => {
    expect(getInitials('Manager / Owner')).toBe('MO');
    expect(getInitials('Head Chef / Barista')).toBe('HC');
    expect(getInitials('Floor Staff / Waiter')).toBe('FS');
  });

  it('extracts initials properly from standard multi-word names', () => {
    expect(getInitials('Ahmad Syahripudin')).toBe('AS');
    expect(getInitials('Kasir Front POS')).toBe('KF');
    expect(getInitials('Siti Rahmawati')).toBe('SR');
  });

  it('extracts initials from single-word names', () => {
    expect(getInitials('Budi')).toBe('BU');
    expect(getInitials('Admin')).toBe('AD');
    expect(getInitials('A')).toBe('AA');
  });

  it('handles empty, null, or punctuation-only strings gracefully', () => {
    expect(getInitials('')).toBe('ST');
    expect(getInitials(null)).toBe('ST');
    expect(getInitials(undefined)).toBe('ST');
    expect(getInitials('/ - &')).toBe('ST');
  });
});
