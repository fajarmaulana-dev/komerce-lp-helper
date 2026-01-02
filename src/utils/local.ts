/**
 * Clear localStorage.
 */
export const clearLocals = () => localStorage.clear()

/**
 * Removes an item from localStorage by key.
 *
 * @param key - The key of the item to remove.
 */
export const removeLocal = (key: string) => localStorage.removeItem(key)

/**
 * Sets an item in localStorage after serializing it to JSON.
 *
 * @param key - The key under which to store the value.
 * @param value - The value to store (will be JSON-stringified).
 */
export const setLocal = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value))

/**
 * Sets multiple items in localStorage after serializing it to JSON.
 *
 * @param items - Array of local storage items to set.
 */
export const setLocals = <T extends Record<string, unknown>>(
  items: { [K in keyof T]: { key: K & string; value: T[K] } }[keyof T][],
): void => {
  items.forEach(item => setLocal(item.key, item.value))
}

/**
 * Retrieves and parses a JSON item from localStorage by key.
 *
 * @param key - The key of the item to retrieve.
 * @returns The parsed value from localStorage, or null if not found.
 */
export const getLocal = <T>(key: string) => {
  const item = localStorage.getItem(key)
  try {
    if (item) return JSON.parse(item) as T
    return null
  } catch {
    return item as T
  }
}

/**
 * Retrieves and parses multiple JSON items from localStorage by key.
 *
 * @param keys - The keys of the items to retrieve.
 * @returns The parsed values from localStorage.
 */
export const getLocals = <T extends Record<string, unknown>, K extends keyof T = keyof T>(
  keys: readonly K[],
): { [P in K]: T[P] | null } => {
  return keys.reduce(
    (acc, key) => {
      acc[key] = getLocal<T[K]>(key as string)
      return acc
    },
    {} as { [P in K]: T[P] | null },
  )
}
