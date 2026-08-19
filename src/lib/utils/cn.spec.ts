import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional class names properly', () => {
    const isActive = true;
    const isHidden = false;
    expect(cn('base', isActive && 'active', isHidden && 'hidden')).toBe('base active');
  });

  it('resolves conflicting Tailwind CSS utility classes intelligently', () => {
    // p-4 should override p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');
    // text-red-500 should override text-blue-500
    expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500');
  });

  it('handles falsy values, null, and undefined without throwing', () => {
    expect(cn('base', null, undefined, false, 0 as any)).toBe('base');
  });

  it('handles arrays and nested inputs', () => {
    expect(cn(['flex', 'items-center'], ['gap-2'])).toBe('flex items-center gap-2');
  });
});
