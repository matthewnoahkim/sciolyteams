"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: 'default' | 'header'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Wait for client to mount so the icon matches the hydrated theme
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const currentTheme = mounted ? (resolvedTheme || theme) : undefined
  const showMoon = !currentTheme || currentTheme === 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9 transition-all hover:scale-105 group"
      suppressHydrationWarning
    >
      {showMoon ? (
        <Moon className="h-4 w-4 text-white" />
      ) : (
        <Sun className="h-4 w-4 group-hover:text-white transition-colors" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
