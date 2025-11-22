'use client'

import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: {
    icon: 'h-5 w-5',
    container: 'h-8 w-8',
    text: 'text-lg',
  },
  md: {
    icon: 'h-6 w-6',
    container: 'h-10 w-10',
    text: 'text-xl',
  },
  lg: {
    icon: 'h-8 w-8',
    container: 'h-14 w-14',
    text: 'text-3xl',
  },
}

export function Logo({ 
  className, 
  iconClassName, 
  textClassName,
  showText = true,
  size = 'md'
}: LogoProps) {
  const sizes = sizeMap[size]
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg',
        sizes.container,
        iconClassName
      )}>
        <Users className={cn(sizes.icon)} />
      </div>
      {showText && (
        <span className={cn('font-bold text-gray-900 dark:text-white', sizes.text, textClassName)}>
          Teamy
        </span>
      )}
    </div>
  )
}

