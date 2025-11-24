'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SaveIndicatorProps {
  show: boolean
  className?: string
}

export function SaveIndicator({ show, className }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!visible) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium transition-opacity duration-300',
        className
      )}
    >
      <Check className="h-3 w-3" />
      <span>Saved</span>
    </div>
  )
}

