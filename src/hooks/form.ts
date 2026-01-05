import { useRef } from 'react'

import type { TPrimitive } from '@/types'
import { getById } from '@/utils/general'

/**
 * Represents a single form field item, containing its value, element ID, and related helper elements.
 *
 * @template T - The type of the field value.
 * @property {T} field_value - The current value of the field (string, number, boolean, etc.).
 * @property {string} field_id - The ID attribute of the input element.
 * @property {HTMLElement | null} [field_error] - The element that displays the error message (e.g. `#field_error`).
 * @property {HTMLElement | null} [field_info] - The element that displays extra info (e.g. `#field_info`).
 */
export type TFieldItem<T> = {
  field_value: T
  field_id: string
  field_error?: HTMLElement | null
  field_info?: HTMLElement | null
}

/**
 * Represents a collection of fields keyed by their input names, where each key maps to a `TFieldItem`.
 *
 * @template T - The record type mapping field names to primitive values.
 */
type TFields<T extends Record<string, TPrimitive>> = {
  [K in keyof T & string]: TFieldItem<T[K]>
}

/**
 * A custom React hook for managing form fields and their associated elements.
 *
 * This hook provides access to both named form inputs (retrieved from an HTML `<form>`)
 * and standalone fields that do not belong to the form (`fieldsWithoutName`).
 *
 * It simplifies working with dynamic forms by returning structured data that includes
 * field values, IDs, and linked error/info elements.
 *
 * @template T - The type for form fields inside the `<form>`.
 * @template U - The type for standalone fields outside the `<form>`.
 *
 * @param {string[]} [fieldsWithoutNameIds=[]] - A list of field IDs that exist outside the form element.
 */
export function useForm<
  T extends Record<string, TPrimitive>,
  U extends Record<string, TPrimitive> = Record<string, TPrimitive>,
>(fieldsWithoutNameIds: (keyof U & string)[] = []) {
  const form = useRef<HTMLFormElement>(null)

  const fields = (): TFields<T> => {
    const result = {} as TFields<T>
    if (!form.current) return result

    const formData = new FormData(form.current)

    for (const [name, value] of formData.entries()) {
      const key = name as keyof T & string
      const input = form.current.querySelector(`[name="${key}"]`) as HTMLInputElement | null

      let fieldValue: unknown = value
      if (input?.type === 'checkbox') fieldValue = input.checked

      result[key] = {
        field_value: fieldValue as unknown as T[typeof key],
        field_id: input?.id || '',
        field_error: form.current.querySelector(`#${key}_error`) as HTMLElement | null,
        field_info: form.current.querySelector(`#${key}_info`) as HTMLElement | null,
      }
    }

    return result
  }

  const fieldsWithoutName = (): TFields<U> => {
    const result = {} as TFields<U>

    fieldsWithoutNameIds.forEach(id => {
      const field = getById<HTMLInputElement>(id)
      const key = id as keyof U & string

      const value = field.type === 'radio' || field.type === 'checkbox' ? field.checked : field.value

      result[key] = {
        field_value: value as unknown as U[typeof key],
        field_id: field.id,
        field_error: getById(`${key}_error`) as HTMLElement | null,
        field_info: getById(`${key}_info`) as HTMLElement | null,
      }
    })

    return result
  }

  return { form, fields, fieldsWithoutName }
}
