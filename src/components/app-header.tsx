'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, Pencil, ArrowLeft } from 'lucide-react'
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
  const [editUsernameOpen, setEditUsernameOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState(user.name)

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && backHref && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(backHref)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Logo size="md" />
            {title && (
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden md:block">
                {title}
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all"
                onClick={() => setEditUsernameOpen(true)}
              >
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUserName || user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditUsernameOpen(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
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

