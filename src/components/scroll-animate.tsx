'use client'
import { useEffect, useRef, useState, ReactNode } from 'react'

interface ScrollAnimateProps {
  children: ReactNode
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in' | 'fade-scale' | 'slide-up-rotate' | 'bounce-in' | 'elegant'
  delay?: number
  duration?: number
  threshold?: number
  className?: string
}

export function ScrollAnimate({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = ''
}: ScrollAnimateProps) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Use requestAnimationFrame for smoother animation start
          requestAnimationFrame(() => {
            setTimeout(() => {
              setIsVisible(true)
            }, delay)
          })
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -80px 0px' // Trigger slightly earlier for better feel
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [delay, threshold])

  return (
    <div
      ref={elementRef}
      className={`scroll-animate scroll-animate-${animation} ${isVisible ? 'scroll-animate-visible' : ''} ${className}`}
      style={{
        '--animation-duration': `${duration}ms`
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

