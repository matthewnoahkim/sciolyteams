"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignInThemeToggleProps {
  variant?: 'default' | 'header'
}

export function SignInThemeToggle({ variant = 'default' }: SignInThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // Read theme synchronously from DOM (set by blocking script in layout)
  // Use lazy initializer to only read on client
  const [initialTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  const isHeader = variant === 'header'
  const currentTheme = resolvedTheme || initialTheme
  const showMoon = currentTheme === 'light'

  return (
    <Button
      variant={isHeader ? "ghost" : "outline"}
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "h-10 w-10 transition-all hover:scale-105",
        isHeader && "border-0"
      )}
      suppressHydrationWarning
    >
      {showMoon ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
