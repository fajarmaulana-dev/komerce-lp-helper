import { memo } from 'react'

import { useLazyBackground } from './hooks'
import type { TLazyBackgroundProps } from './types'

/**
 * A wrapper component that lazily loads a background image when it enters the viewport.
 *
 * Uses the `useLazyBackground` hook to observe the element via the Intersection Observer API
 * and apply the background image only when visible.
 * This helps improve performance by deferring image loading until needed.
 *
 * Props for the `LazyBackground` component.
 *
 * @property {string} url - The image URL to be lazily loaded as the background.
 * @property {React.ReactNode} [children] - Optional elements or content rendered inside the container.
 * @property {string} [className] - Additional CSS class names applied to the outer container.
 *
 * @remarks
 * The component renders a `<div>` with a `ref` attached for the lazy observer.
 * The `url` is passed to `useLazyBackground`, which handles loading behavior internally.
 */
const LazyBackground = ({ url, children, className }: TLazyBackgroundProps) => {
  const { ref } = useLazyBackground({ url })
  return (
    <div ref={ref} className={className || ''}>
      {children}
    </div>
  )
}

export default memo(LazyBackground)
