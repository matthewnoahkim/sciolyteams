'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

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
    container: 'h-8 w-8',
    text: 'text-lg',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-xl',
  },
  lg: {
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
  const [imageError, setImageError] = useState(false)
  
  const content = (
    <div className={cn('flex items-center gap-3 flex-shrink-0', href && 'cursor-pointer hover:opacity-80 transition-opacity', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-xl overflow-hidden shadow-lg',
        sizes.container,
        iconClassName
      )}>
        {!imageError ? (
          <Image
            src="/logo.png"
            alt="Teamy Logo"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            priority
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
            T
          </div>
        )}
      </div>
      {showText && (
        <span className={cn('font-bold text-gray-900 dark:text-white whitespace-nowrap overflow-visible', sizes.text, textClassName)}>
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

