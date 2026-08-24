import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('merges tailwind conflict classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('ignores falsy values properly', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'active')).toBe('base active');
  });
});
