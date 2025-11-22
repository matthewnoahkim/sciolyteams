'use client'

import { useEffect } from 'react'
import { updateFaviconBadge } from '@/lib/favicon-badge'

/**
 * Component to ensure the favicon is set on initial page load
 * This ensures the logo shows up even before any notifications are checked
 */
export function FaviconLoader() {
  useEffect(() => {
    // Set the initial favicon with logo (no badge)
    updateFaviconBadge(0)
  }, [])

  return null
}

