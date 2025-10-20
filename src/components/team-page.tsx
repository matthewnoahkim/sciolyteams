'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { StreamTab } from '@/components/tabs/stream-tab'
import { RosterTab } from '@/components/tabs/roster-tab'
import { SubteamsTab } from '@/components/tabs/subteams-tab'
import { CalendarTab } from '@/components/tabs/calendar-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const [activeTab, setActiveTab] = useState('stream')
  const isCaptain = currentMembership.role === 'CAPTAIN'

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
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-10">
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="subteams">Subteams</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="stream" className="mt-6">
            <StreamTab
              teamId={team.id}
              currentMembership={currentMembership}
              subteams={team.subteams}
              isCaptain={isCaptain}
            />
          </TabsContent>

          <TabsContent value="roster" className="mt-6">
            <RosterTab
              team={team}
              currentMembership={currentMembership}
              isCaptain={isCaptain}
            />
          </TabsContent>

          <TabsContent value="subteams" className="mt-6">
            <SubteamsTab
              team={team}
              isCaptain={isCaptain}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarTab
              teamId={team.id}
              currentMembership={currentMembership}
              isCaptain={isCaptain}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              team={team}
              isCaptain={isCaptain}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

