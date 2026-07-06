import { DEFAULT_CACHE_TTL_MS } from './constants';

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Tiny in-memory TTL cache used to memoize adapter responses for a short window.
 * The clock is injectable so behaviour is fully deterministic under test.
 */
export class TtlCache<V> {
  private store = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly ttlMs: number = DEFAULT_CACHE_TTL_MS,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /**
   * Return a cached value or compute, store and return a fresh one.
   */
  async remember(key: string, factory: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await factory();
    this.set(key, value);
    return value;
  }
}
