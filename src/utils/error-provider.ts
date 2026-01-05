import { ANY_LOWERCASE, ANY_NUMBER, ANY_SYMBOL, ANY_UPPERCASE, NO_SPACE } from '@/constants/regex'
import type { TFieldItem } from '@/hooks/form'

import { getByAny } from './general'

/**
 * Validates a generic input field and updates its associated error element and label styling based on defined rules.
 *
 * @template T - The type of the input field value.
 *
 * @param {TFieldItem<T> & { rules: Record<string, boolean> }} params - The field metadata and validation rules.
 * @param {string} params.field_id - The ID of the input element being validated.
 * @param {T} params.field_value - The current value of the input field.
 * @param {HTMLElement | null} params.field_error - The error message element associated with this field.
 * @param {Record<string, boolean>} params.rules - A mapping of error messages to their boolean validation results (`true` = invalid).
 *
 *
 * @example
 * ```tsx
 * provideFieldError({
 *   field_id: 'email',
 *   field_value: 'invalid-email',
 *   field_error: document.getElementById('email_error'),
 *   rules: {
 *     'Email is required': !email,
 *     'Email format is invalid': !email.includes('@')
 *   }
 * })
 * ```
 *
 * @remarks
 * - If a rule evaluates to `true`, its message is displayed in the error element.
 * - The function automatically applies a red border style (`!border-error-main`) to the associated `<label>`.
 * - When all rules pass, the error text is cleared and the border style is removed.
 */
export const provideFieldError = <T>({
  field_id,
  field_value,
  field_error,
  rules,
}: TFieldItem<T> & { rules: Record<string, boolean> }) => {
  let error = false
  const label = getByAny(`label[for="${field_id}"]`)

  Object.entries(rules).forEach(([message, isError]) => {
    if (isError && (!error || !!field_value)) {
      field_error!.textContent = message
      error = true
      label?.classList.add('!border-error-main')
    }
  })

  if (!error) {
    field_error!.textContent = ''
    label?.classList.remove('!border-error-main')
  }
}

/**
 * Performs advanced password validation and updates the error message and styling accordingly.
 *
 * This function enforces password strength requirements such as:
 * - Minimum length (8 characters)
 * - Presence of uppercase letters, lowercase letters, numbers, and symbols
 * - No spaces allowed
 *
 * It dynamically generates an error message that lists missing requirements and adjusts the label border color to indicate errors.
 *
 * @template T - The type of the input field value.
 *
 * @param {TFieldItem<T>} params - The password field metadata.
 * @param {string} params.field_id - The ID of the password input field.
 * @param {T} params.field_value - The current value of the password field.
 * @param {HTMLElement | null} params.field_error - The element where password validation messages will appear.
 *
 *
 * @example
 * ```tsx
 * providePasswordFieldError({
 *   field_id: 'password',
 *   field_value: 'weakPass',
 *   field_error: document.getElementById('password_error')
 * })
 * ```
 *
 * @remarks
 * - Displays context-aware feedback such as “add numbers or symbols to strengthen your password.”
 * - Automatically applies or removes the red border class (`!border-error-main`) on the associated `<label>`.
 * - Uses predefined regex constants from `@/constants/regex` for validation checks.
 */
export const providePasswordFieldError = <T>({ field_id, field_value, field_error }: TFieldItem<T>) => {
  let error = false
  const value = field_value as string
  const label = getByAny(`label[for="${field_id}"]`)

  const firstRules = {
    'password harus diisi': !value,
    'panjang password minimal adalah 8 karakter': value.length < 8,
  }

  Object.entries(firstRules).forEach(([message, isError]) => {
    if (isError && (!error || !!value)) {
      field_error!.textContent = message
      error = true
      label?.classList.add('!border-error-main')
    }
  })

  const nextRules = {
    ['huruf kapital']: !ANY_UPPERCASE.re.test(value),
    ['huruf kecil']: !ANY_LOWERCASE.re.test(value),
    ['angka']: !ANY_NUMBER.re.test(value),
    ['simbol']: !ANY_SYMBOL.re.test(value),
  }

  const nextError = Object.entries(nextRules).filter(([_, rule]) => rule)
  const nextMessage =
    'tambahkan ' +
    nextError
      .map(([message], idx) => {
        const len = nextError.length
        if (len > 1 && idx >= len - 1) {
          if (len <= 2) return ` dan ${message}`
          return `, dan ${message}`
        }
        if (idx > 0) return `, ${message}`
        return message
      })
      .join('')

  if (nextError.length > 0 && (!error || !!value)) {
    field_error!.textContent = nextMessage + ' untuk memperkuat passwordmu.'
    if (nextError.length >= Object.keys(nextError).length - 1) {
      field_error!.textContent = 'password  terlalu lemah. ' + nextMessage + '.'
    }
    error = true
    label?.classList.add('!border-error-main')
  }

  if (!NO_SPACE.re.test(value) && (!error || !!value)) {
    field_error!.textContent = `password ${NO_SPACE.text}`
    error = true
    label?.classList.add('!border-error-main')
  }

  if (!error) {
    field_error!.textContent = ''
    label?.classList.remove('!border-error-main')
  }
}
