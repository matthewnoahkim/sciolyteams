'use client'

import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string
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
  size = 'md',
  href
}: LogoProps) {
  const sizes = sizeMap[size]
  
  const content = (
    <div className={cn('flex items-center gap-3', href && 'cursor-pointer hover:opacity-80 transition-opacity', className)}>
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

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

