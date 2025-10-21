'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogOut, MessageSquare, Users, Calendar, Settings, Pencil } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { StreamTab } from '@/components/tabs/stream-tab'
import { PeopleTab } from '@/components/tabs/people-tab'
import { CalendarTab } from '@/components/tabs/calendar-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'
import { ThemeToggle } from '@/components/theme-toggle'
import { EditUsernameDialog } from '@/components/edit-username-dialog'

interface TeamPageProps {
  team: any
  currentMembership: any
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
}

export function TeamPage({ team, currentMembership, user }: TeamPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'stream')
  const [editUsernameOpen, setEditUsernameOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState(user.name)
  const isCaptain = currentMembership.role === 'CAPTAIN'

  // Sync local state when user prop changes (e.g., after navigation)
  useEffect(() => {
    setCurrentUserName(user.name)
  }, [user.name])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <header className="border-b glass-effect-light dark:glass-effect-dark">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="apple-button-hover">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-foreground leading-tight">{team.name}</h1>
                <Badge variant="outline">Division {team.division}</Badge>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {team.memberships.length} member{team.memberships.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback>
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{currentUserName || user.email}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditUsernameOpen(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <Badge variant={isCaptain ? 'default' : 'secondary'} className="text-xs">
                  {currentMembership.role}
                </Badge>
              </div>
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <div className="flex gap-8">
          {/* Vertical Navigation Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="sticky top-8 space-y-2">
              <Button
                variant={activeTab === 'stream' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleTabChange('stream')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Stream
              </Button>
              <Button
                variant={activeTab === 'people' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleTabChange('people')}
              >
                <Users className="mr-2 h-4 w-4" />
                People
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleTabChange('calendar')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleTabChange('settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'stream' && (
              <StreamTab
                teamId={team.id}
                currentMembership={currentMembership}
                subteams={team.subteams}
                isCaptain={isCaptain}
              />
            )}

            {activeTab === 'people' && (
              <PeopleTab
                team={team}
                currentMembership={currentMembership}
                isCaptain={isCaptain}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarTab
                teamId={team.id}
                currentMembership={currentMembership}
                isCaptain={isCaptain}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                team={team}
                currentMembership={currentMembership}
                isCaptain={isCaptain}
              />
            )}
          </div>
        </div>
      </main>

      <EditUsernameDialog
        open={editUsernameOpen}
        onOpenChange={setEditUsernameOpen}
        currentName={user.name ?? null}
        onNameUpdated={setCurrentUserName}
      />
    </div>
  )
}

