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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isHeader = variant === 'header'

  if (!mounted) {
    return (
      <Button 
        variant={isHeader ? "ghost" : "outline"} 
        size="icon" 
        className={cn(
          "h-10 w-10",
          isHeader && "text-white hover:bg-white/10 border-0"
        )}
      >
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant={isHeader ? "ghost" : "outline"}
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "h-10 w-10 transition-all hover:scale-105",
        isHeader && "text-white hover:bg-white/10 border-0"
      )}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
