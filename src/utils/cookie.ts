type TCookie<T> = {
  key: string
  value: T
  maxAge?: number
}

/**
 * Sets a cookie with the specified key, value, and optional max age.
 *
 * @param key - The cookie key.
 * @param value - The cookie value (will be JSON-stringified).
 * @param maxAge - Optional max age of the cookie in seconds.
 */
export const setCookie = <T>({ key, value, maxAge }: TCookie<T>): void => {
  const serializedValue = JSON.stringify(value)
  document.cookie = `${key}=${serializedValue}${maxAge ? `; Max-Age=${maxAge}` : ''}; Secure; SameSite=Strict; path=/`
}

/**
 * Sets multiple cookies from an array of cookie objects.
 *
 * @param items - Array of cookies to set.
 */
export const setCookies = (items: TCookie<unknown>[]): void => {
  items.forEach(item => setCookie(item))
}

/**
 * Gets the value of a cookie by key and parses it from JSON.
 *
 * @param key - The key of the cookie to get.
 * @returns The parsed cookie value, or null if not found.
 */
export const getCookie = <T>(key: string): T | null => {
  const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
  if (!match) return null

  try {
    return JSON.parse(decodeURIComponent(match[2])) as T
  } catch {
    return decodeURIComponent(match[2]) as T
  }
}

/**
 * Retrieves multiple cookies by keys.
 *
 * @param keys - Array of keys to retrieve.
 * @returns Object with keys and their corresponding parsed values.
 */
export const getCookies = <T extends Record<string, unknown>, K extends keyof T = keyof T>(
  keys: readonly K[],
): { [P in K]: T[P] | null } => {
  return keys.reduce(
    (acc, key) => {
      acc[key] = getCookie<T[K]>(key as string)
      return acc
    },
    {} as { [P in K]: T[P] | null },
  )
}

/**
 * Removes a cookie by key by setting its max age to 0.
 *
 * @param key - The key of the cookie to remove.
 */
export const removeCookie = (key: string): void => {
  document.cookie = `${key}=; Max-Age=0; Secure; SameSite=Strict; path=/`
}

/**
 * Removes multiple cookies by keys.
 *
 * @param keys - Array of keys to remove.
 */
export const removeCookies = (keys: string[]): void => {
  keys.forEach(key => removeCookie(key))
}

/**
 * Clears all cookies by setting their max age to 0.
 */
export const clearCookies = (): void => {
  document.cookie.split('; ').forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const key = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
    removeCookie(key)
  })
}
