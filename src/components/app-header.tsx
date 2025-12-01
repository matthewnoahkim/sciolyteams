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
  
  // Determine if we're on tournaments page or dashboard
  const isOnTournamentsPage = pathname?.startsWith('/tournaments')
  const buttonText = isOnTournamentsPage ? 'Clubs' : 'Tournaments'
  const buttonHref = isOnTournamentsPage ? '/dashboard' : '/tournaments'
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
      <header className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {showBackButton && backHref && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(backHref)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <Logo size="md" />
            {title && (
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white hidden md:block truncate">
                {title}
              </h1>
            )}
            <div className="hidden md:block h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
            <Button
              onClick={() => router.push(buttonHref)}
              size="sm"
              className="hidden md:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ButtonIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">{buttonText}</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <Button
              onClick={() => router.push(buttonHref)}
              size="sm"
              className="md:hidden flex items-center gap-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ButtonIcon className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar 
                className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all"
                onClick={() => setEditUsernameOpen(true)}
              >
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right max-w-[120px] md:max-w-none">
                <div className="flex items-center gap-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUserName || user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditUsernameOpen(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 px-2 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs sm:text-sm">Sign Out</span>
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

