import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../../lib/useDebouncedValue';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 200));
    expect(result.current).toBe('a');
  });

  it('updates only after the delay elapses', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 200), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });

  it('cancels the pending update when the value changes again', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 200), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ v: 'c' });
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('c');
  });

  it('uses the default delay when none is provided', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe('b');
  });
});
