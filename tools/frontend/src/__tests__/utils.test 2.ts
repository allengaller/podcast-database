import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names and drops falsy values', () => {
    expect(cn('a', 'b', undefined, false, null, '', 'c')).toBe('a b c');
  });

  it('later Tailwind utilities win over earlier conflicting ones', () => {
    // tailwind-merge should resolve the conflict: `p-4` overridden by `p-2`.
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('keeps non-conflicting utilities from both inputs', () => {
    expect(cn('text-red-500', 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
  });

  it('returns empty string when no inputs', () => {
    expect(cn()).toBe('');
  });
});