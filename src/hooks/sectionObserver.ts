import { type RefObject, useEffect } from 'react'

import { getById } from '@/utils/general'

type TSectionObserverProps = {
  triggerRef: RefObject<HTMLElement | null>
  targetId: string
  threshold?: number
}

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
