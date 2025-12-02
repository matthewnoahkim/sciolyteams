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
  variant?: 'default' | 'light'
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
  href,
  variant = 'default'
}: LogoProps) {
  const sizes = sizeMap[size]
  const [imageError, setImageError] = useState(false)
  
  // Light variant = white text with cyan glow (for blue headers)
  // Default variant = teamy-primary blue text
  const textStyle = variant === 'light' 
    ? {
        color: 'white',
        textShadow: '0 0 10px rgba(111, 214, 255, 0.8), 0 0 20px rgba(111, 214, 255, 0.5), 2px 2px 0 rgba(0, 86, 199, 0.3)'
      }
    : {
        color: '#0056C7'
      }
  
  const content = (
    <div className={cn(
      'flex items-center gap-3 flex-shrink-0', 
      href && 'cursor-pointer hover:opacity-90 transition-opacity', 
      className
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-xl overflow-hidden',
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
          <div className="w-full h-full bg-teamy-primary flex items-center justify-center text-white font-bold text-xs rounded-xl">
            T
          </div>
        )}
      </div>
      {showText && (
        <span 
          className={cn(
            'font-logo font-bold whitespace-nowrap overflow-visible', 
            sizes.text, 
            textClassName
          )}
          style={textStyle}
        >
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
