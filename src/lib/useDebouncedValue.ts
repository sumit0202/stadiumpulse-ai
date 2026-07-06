import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value (e.g. a search box) so downstream work only
 * runs after the user pauses. The pending timer is cleared on change/unmount to
 * avoid stale updates and wasted renders.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
