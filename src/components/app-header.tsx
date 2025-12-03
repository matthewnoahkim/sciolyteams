'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, Pencil, ArrowLeft, Users, Trophy } from 'lucide-react'
import { Logo } from '@/components/logo'
import { signOut } from 'next-auth/react'
import { EditUsernameDialog } from '@/components/edit-username-dialog'
import { useState } from 'react'

interface AppHeaderProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  showBackButton?: boolean
  backHref?: string
  title?: string
}

export function AppHeader({ user, showBackButton = false, backHref, title }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [editUsernameOpen, setEditUsernameOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState(user.name ?? null)
  
  // Determine if we're on tournaments page or clubs page
  const isOnTournamentsPage = pathname?.startsWith('/dashboard/tournaments') || pathname?.startsWith('/tournaments')
  const buttonText = isOnTournamentsPage ? 'Clubs' : 'Tournaments'
  const buttonHref = isOnTournamentsPage ? '/dashboard/club' : '/dashboard/tournaments'
  const ButtonIcon = isOnTournamentsPage ? Users : Trophy

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error', error)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {showBackButton && backHref && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(backHref)}
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <Logo size="md" className="flex-shrink-0" href="/dashboard" variant="auto" />
            {title && (
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground hidden md:block truncate">
                {title}
              </h1>
            )}
            <div className="hidden md:block h-6 w-px bg-border mx-1" />
            <Button
              onClick={() => router.push(buttonHref)}
              size="sm"
              className="hidden md:flex items-center gap-2 px-4 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <ButtonIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{buttonText}</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={() => router.push(buttonHref)}
              size="icon"
              className="md:hidden bg-amber-500 hover:bg-amber-600 text-white h-9 w-9"
            >
              <ButtonIcon className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar 
                className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all"
                onClick={() => setEditUsernameOpen(true)}
              >
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right max-w-[120px] md:max-w-none">
                <div className="flex items-center gap-1">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {currentUserName || user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditUsernameOpen(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <ThemeToggle variant="header" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <EditUsernameDialog
        open={editUsernameOpen}
        onOpenChange={setEditUsernameOpen}
        currentName={currentUserName}
        onNameUpdated={setCurrentUserName}
      />
    </>
  )
}
