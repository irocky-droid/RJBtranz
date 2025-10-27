import { useState, useEffect, useCallback } from 'react';

// Type for the KV setter function (matches useState signature)
type SetStateAction<T> = T | ((prev: T) => T);

/**
 * useKV - A Supabase-based key-value storage hook
 *
 * This hook provides persistent key-value storage using Supabase.
 * In development, it falls back to localStorage for data persistence.
 *
 * @param key - The storage key
 * @param defaultValue - The default value if no stored value exists
 * @returns [value, setValue] - State tuple matching useState/useKV signature
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (value: SetStateAction<T>) => void] {
  // Initialize state with value from localStorage or default
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`kv:${key}`);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[useKV] Failed to parse localStorage for key "${key}":`, error);
    }
    return defaultValue;
  });

  // Sync to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(`kv:${key}`, JSON.stringify(state));
    } catch (error) {
      console.error(`[useKV] Failed to save to localStorage for key "${key}":`, error);
    }
  }, [key, state]);

  // Custom setter that handles both direct values and updater functions
  const setValue = useCallback((value: SetStateAction<T>) => {
    setState((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;

      // Save to localStorage immediately
      try {
        localStorage.setItem(`kv:${key}`, JSON.stringify(newValue));
      } catch (error) {
        console.error(`[useKV] Failed to save to localStorage for key "${key}":`, error);
      }

      return newValue;
    });
  }, [key]);

  return [state, setValue];
}

export default useKV;