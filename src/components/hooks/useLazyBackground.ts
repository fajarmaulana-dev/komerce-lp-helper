import { useEffect, useRef } from 'react'

/**
 * Props for the `useLazyBackground` hook.
 *
 * @property url - The URL of the background image to load lazily.
 */
export type TLazyBackground = {
  url: string
}

/**
 * `useLazyBackground` is a custom React hook that applies a background image
 * to a `<div>` element only when it enters the viewport (lazy-loading).
 *
 * @param {TLazyBackground} props - The props object containing the image URL.
 */
export const useLazyBackground = ({ url }: TLazyBackground) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) {
        el.style.backgroundImage = `url(${url})`
        obs.unobserve(el)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [url])

  return {
    ref,
  }
}
