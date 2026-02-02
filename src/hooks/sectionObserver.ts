import { type RefObject, useEffect } from 'react'

import { getById } from '@/utils/general'

type TSectionObserverProps = {
  triggerRef: RefObject<HTMLElement | null>
  targetId: string
  threshold?: number
}

/**
 * A React hook that uses the Intersection Observer API to detect when a trigger element
 * comes into view and updates the `data-visible` attribute of a target element.
 *
 * This is useful for implementing scroll-triggered animations or lazy loading effects.
 *
 * @param props - Configuration properties for the observer.
 * @param props.triggerRef - A ref object pointing to the element that triggers the observation.
 * @param props.targetId - The ID of the target element whose `data-visible` attribute will be toggled.
 * @param [props.threshold=0.8] - A number between 0 and 1 indicating the percentage of the trigger element's visibility needed to activate the effect.
 *
 * @example
 * ```tsx
 * const triggerRef = useRef(null)
 * useSectionObserver({ triggerRef, targetId: 'my-section', threshold: 0.5 })
 *
 * return (
 *   <>
 *     <div ref={triggerRef} />
 *     <div id="my-section" className="section">Content</div>
 *   </>
 * )
 * ```
 */
export const useSectionObserver = ({ triggerRef, targetId, threshold = 0.8 }: TSectionObserverProps) => {
  useEffect(() => {
    const container = getById(targetId)
    const trigger = triggerRef.current

    if (!trigger || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          container.setAttribute('data-visible', 'true')
          return
        }

        if (entry.boundingClientRect.top > 0) {
          container.setAttribute('data-visible', 'false')
        }
      },
      { threshold },
    )

    observer.observe(trigger)

    return () => {
      observer.disconnect()
    }
  }, [triggerRef, targetId, threshold])
}
