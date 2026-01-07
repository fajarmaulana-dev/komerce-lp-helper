/**
 * Get a DOM element by its ID.
 *
 * @param id - The ID of the element to get.
 */
export const getById = <T = HTMLElement>(id: string) => document.getElementById(id) as T

/**
 * Get a DOM element by any valid CSS selector.
 *
 * @param str - A string containing a CSS selector to match an element in the document.
 */
export const getByAny = <T = HTMLElement>(str: string) => document.querySelector(str) as T

/**
 * Trigger a click event on an element by its ID.
 *
 * @param id - The ID of the element to click.
 */
export const clickById = (id: string) => {
  const el = getById(id)
  if (el) {
    el.click()
  }
}

/**
 * Focus an element by its ID.
 *
 * @param id - The ID of the element to focus.
 */
export const focusById = (id: string) => {
  const el = getById(id)
  if (el) {
    el.focus()
  }
}

/**
 * Smoothly scrolls the window to an element's position when click on active Link.
 *
 * @param hash - Hash of the link.
 * @param currentHash - Current hash in URL.
 * @param func - Optional function to triggered before main logic.
 */
export const handleHashLink = (hash: string, currentHash: string, func?: () => void) => {
  if (func) func()
  if (hash === currentHash) {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const target = getByAny(hash)
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

/**
 * Get acronym (max 2 characters) from a full name string.
 *
 * @param name - Full name string.
 */
export const acronym = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '.'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Check primitive data type status of a value
 *
 * @param value
 * @returns - data type status
 */
export const isNotPrimitive = (value: unknown) => {
  return typeof value === 'object' && value !== null
}

/**
 * Get WhatsApp url by message and phone number if urlOnly = true, or open the url in new window.
 *
 * @param message - message.
 * @param options - configuration options.
 */
export const toWA = (message = '', options: { urlOnly?: boolean; phoneNumber?: string } = {}) => {
  const { urlOnly = true, phoneNumber = '6283129733705' } = options

  const whatsappUrl = `https://wa.me/${phoneNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`

  if (urlOnly) return whatsappUrl
  window.open(whatsappUrl, '_blank')
}
