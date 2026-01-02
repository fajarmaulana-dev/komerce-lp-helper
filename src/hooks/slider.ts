/* eslint-disable @typescript-eslint/no-explicit-any */
import { type MouseEvent, type TouchEvent, useMemo, useRef, useState } from 'react'

import { MOBILE_BOUND } from '@/constants'

type TSlider = {
  e: MouseEvent | TouchEvent
  mobile?: boolean
  axis: 'X' | 'Y'
}

type TSlide = {
  data: any[]
  mobileOnly?: boolean
  infiniteSlide?: boolean
  isLoading?: boolean
  mobileBound?: number
  onNext?: () => void
  onBack?: () => void
}

/**
 * Get slider position from an event, supports mobile touch events.
 *
 * @param e - The event object of MouseEvent or TouchEvent.
 * @param mobile - Whether the event is from a mobile touch (default: false).
 * @param axis - The axis to get position from, either 'X' or 'Y' (default: 'X').
 * @returns The page X or Y coordinate from the event.
 */
export function slider({ e, mobile, axis }: TSlider) {
  return mobile ? (e as TouchEvent).changedTouches[0][`page${axis}`] : (e as MouseEvent)[`page${axis}`]
}

/**
 * useSlider is a custom hook to manage the logic for the slider component.
 *
 * @param data - An array of data to display in the slider.
 * @param mobileOnly - Boolean indicating whether the slider is showed on mobile only or not.
 * @param infiniteSlide - Boolean indicating whether the slider can be slided infinitely or not.
 * @param isLoading - Boolean indicating whether the data is still loading.
 * @param mobileBound - Number as bound for mobile only mode
 * @param onNext - Emited method to override the next function.
 * @param onBack - Emited method to override the back function.
 * @returns An object containing state values and handlers for slider control and interaction.
 */
export function useSlider({ data, mobileOnly, infiniteSlide, isLoading, mobileBound, onBack, onNext }: TSlide) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [movement, setMovement] = useState(0)
  const [grab, setGrab] = useState(false)
  const startRef = useRef(0)
  const endRef = useRef(0)
  const throttleRef = useRef(false)

  /**
   * Determines whether the left navigation arrow should be disabled.
   */
  const disableLeftArrow = useMemo(() => {
    return currentSlide === 0 || data.length === 0 || isLoading
  }, [currentSlide, data, isLoading])

  /**
   * Determines whether the right navigation arrow should be disabled.
   */
  const disableRightArrow = useMemo(() => {
    return currentSlide === data.length - 1 || data.length === 0 || isLoading
  }, [currentSlide, data, isLoading])

  /**
   * Begins drag or swipe interaction for the slider.
   *
   * @param e - Mouse or touch event.
   * @param param - Optional parameter to indicate a mobile event. Defaults to `true`.
   */
  const startSlide = (param: TSlider) => {
    if (mobileOnly && window.innerWidth >= (mobileBound || MOBILE_BOUND)) return
    startRef.current = slider(param)
    setGrab(true)
  }

  /**
   * Handles the ongoing drag/swipe movement of the slider.
   *
   * @param e - Mouse or touch event.
   * @param param - Optional parameter to indicate a mobile event.
   */
  const moveSlide = (param: TSlider) => {
    if (mobileOnly && window.innerWidth >= (mobileBound || MOBILE_BOUND)) return
    const diff = slider(param) - startRef.current
    const move = param.mobile && Math.abs(diff) <= 24 ? 0 : diff
    if (!onNext || !onBack) {
      const len = data.length - 1
      if (currentSlide === 0 && move > 0) setCurrentSlide(0)
      if (currentSlide === len && move < 0) setCurrentSlide(len)
    }
    setMovement(move)
  }

  /**
   * Throttle call of next and back function.
   */
  const throttle = (callback: () => void, delay = 100) => {
    if (throttleRef.current) return
    throttleRef.current = true
    callback()
    setTimeout(() => {
      throttleRef.current = false
    }, delay)
  }

  /**
   * Navigates to the next slide if possible.
   */
  const next = () => {
    if (disableRightArrow && !infiniteSlide) return
    throttle(() => {
      if (disableRightArrow) {
        setCurrentSlide(0)
        return
      }
      setCurrentSlide(prev => prev + 1)
    })
  }

  /**
   * Navigates to the previous slide if possible.
   */
  const back = () => {
    if (disableLeftArrow && !infiniteSlide) return
    throttle(() => {
      if (disableLeftArrow) {
        setCurrentSlide(data.length - 1)
        return
      }
      setCurrentSlide(prev => prev - 1)
    })
  }

  /**
   * Ends the drag or swipe interaction and determines if a slide change should occur.
   *
   * @param e - Mouse or touch event.
   * @param param - Optional parameter to indicate a mobile event.
   */
  const endSlide = (param: TSlider) => {
    if (mobileOnly && window.innerWidth >= (mobileBound || MOBILE_BOUND)) return
    setGrab(false)
    endRef.current = slider(param)
    if (startRef.current > endRef.current && startRef.current - endRef.current > 64) onNext ? onNext() : next()
    if (startRef.current < endRef.current && endRef.current - startRef.current > 64) onBack ? onBack() : back()
    setMovement(0)
  }

  return {
    currentSlide,
    movement,
    grab,
    disableLeftArrow,
    disableRightArrow,
    setCurrentSlide,
    startSlide,
    moveSlide,
    endSlide,
    next,
    back,
  }
}
