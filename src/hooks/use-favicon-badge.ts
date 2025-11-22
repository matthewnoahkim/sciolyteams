'use client'

import { useEffect } from 'react'
import { updateFaviconBadgeWithImage, updateFaviconBadge } from '@/lib/favicon-badge'

/**
 * Hook to update the favicon badge based on unread count
 * 
 * @param count - Number of unread items (0 to hide badge)
 * @param faviconUrl - Optional custom favicon URL (defaults to /favicon.svg)
 */
export function useFaviconBadge(count: number, faviconUrl?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Always use the drawn logo for consistency and reliability
    // The canvas-drawn version ensures it works everywhere
    updateFaviconBadge(count)

    // Cleanup: reset favicon when component unmounts or count becomes 0
    return () => {
      if (count === 0) {
        updateFaviconBadge(0)
      }
    }
  }, [count, faviconUrl])
}

