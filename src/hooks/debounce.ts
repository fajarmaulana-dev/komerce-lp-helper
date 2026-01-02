/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useDebounce is a React hook that returns a debounced version of a value.
 * It updates the returned value only after a specified delay has passed
 * without any changes to the input value.
 *
 * Useful for delaying expensive operations such as API calls,
 * especially while the user is typing.
 *
 * @param value - The input value to debounce.
 * @param delay - The debounce delay in milliseconds.
 * @returns The debounced value.
 *
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * useDebounceFunc returns a debounced version of a callback function.
 * The function will only be executed after the specified delay has passed
 * without being called again. This is helpful for limiting function execution
 * in response to frequent user actions like typing or resizing.
 *
 * @param callback - The original function to debounce.
 * @param delay - Delay in milliseconds before the callback is executed.
 * @returns A debounced function that delays execution of the callback.
 *
 * @example
 * const debouncedSearch = useDebounceFunc((q) => fetchResults(q), 300);
 * debouncedSearch('hello'); // Will wait 300ms before calling fetchResults
 */
export function useDebounceFunc<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFunction = (...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return debouncedFunction
}

/**
 * A React hook that conditionally executes a callback function after a specified debounce delay.
 *
 * Unlike a standard debounce, `useConditionalDebounce` only triggers the callback if a given condition is `true`.
 * It automatically clears any pending timeouts when the component unmounts or when the condition changes before the delay expires.
 *
 * @param {number} [delay=500] - The debounce delay in milliseconds before executing the callback.
 */
export function useConditionalDebounce(delay: number = 500) {
  const timeoutRef = useRef<number | null>(null)

  const run = useCallback(
    (condition: boolean, callback: () => void) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (!condition) return
      timeoutRef.current = window.setTimeout(callback, delay)
    },
    [delay],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return run
}
