import { type FormEvent, useImperativeHandle, useRef } from 'react'

import type { TFormProps } from './types'

/**
 * A reusable form component that simplifies form submission handling.
 *
 * ### Features:
 * - Prevents the default browser submit behavior.
 * - Collects form values into a `FormData` object.
 * - Passes the `FormData` to the `action` callback.
 * - Exposes the underlying `<form>` element via `ref`.
 *
 * Props for the `Form` component.
 *
 * @property {(formData: FormData) => void} action - Function called when the form is submitted.
 * @property {ComponentPropsWithRef<'form'>} - All attribute of form element.
 * @property {React.ReactNode} [children] - The form’s inner content (inputs, buttons, etc.).
 */
const Form = ({ action, ref, children, ...props }: TFormProps) => {
  const innerRef = useRef<HTMLFormElement>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLFormElement)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const activeEl = document.activeElement as HTMLElement
    activeEl.blur()
    if (!innerRef.current) return
    const formData = new FormData(innerRef.current)
    action(formData)
  }

  return (
    <form {...props} ref={innerRef} onSubmit={handleSubmit}>
      {children}
    </form>
  )
}

export default Form
