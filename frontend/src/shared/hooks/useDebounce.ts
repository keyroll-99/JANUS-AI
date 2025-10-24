import { useEffect, useState } from 'react';

/**
 * Returns a debounced value that updates after the specified delay.
 * Useful for deferring expensive operations (e.g. API calls) until the user stops typing.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
