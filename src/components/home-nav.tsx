'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' }
]

interface HomeNavProps {
  variant?: 'default' | 'hero'
}

export function HomeNav({ variant = 'default' }: HomeNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHero = variant === 'hero'

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-semibold transition-colors",
              isHero 
                ? "text-white/80 hover:text-white" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "p-2 transition-colors",
            isHero 
              ? "text-white/80 hover:text-white" 
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        {mobileMenuOpen && (
          <div className={cn(
            "absolute top-full left-0 right-0 border-b backdrop-blur-xl",
            isHero 
              ? "bg-[#003A8C]/95 border-white/10" 
              : "bg-background/95 border-border"
          )}>
            <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-sm font-semibold py-2 transition-colors",
                    isHero 
                      ? "text-white/80 hover:text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
