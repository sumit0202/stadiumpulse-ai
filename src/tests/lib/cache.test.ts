import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../../lib/cache';

describe('TtlCache', () => {
  it('returns undefined on miss', () => {
    const cache = new TtlCache<number>();
    expect(cache.get('nope')).toBeUndefined();
  });

  it('stores and retrieves values before expiry', () => {
    let now = 1000;
    const cache = new TtlCache<string>(500, () => now);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
    expect(cache.has('k')).toBe(true);
    now = 1400;
    expect(cache.get('k')).toBe('v');
  });

  it('expires values after the TTL', () => {
    let now = 0;
    const cache = new TtlCache<string>(100, () => now);
    cache.set('k', 'v');
    now = 200;
    expect(cache.get('k')).toBeUndefined();
    expect(cache.has('k')).toBe(false);
  });

  it('expires exactly at the TTL boundary (expiresAt <= now)', () => {
    let now = 0;
    const cache = new TtlCache<string>(100, () => now);
    cache.set('k', 'v');
    now = 100;
    expect(cache.get('k')).toBeUndefined();
  });

  it('supports delete, clear and size', () => {
    const cache = new TtlCache<number>();
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('a')).toBe(false);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('remembers a computed value and reuses it', async () => {
    const cache = new TtlCache<number>();
    const factory = vi.fn().mockResolvedValue(7);
    expect(await cache.remember('x', factory)).toBe(7);
    expect(await cache.remember('x', factory)).toBe(7);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
