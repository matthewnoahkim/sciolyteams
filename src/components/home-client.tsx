'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreateTeamDialog } from '@/components/create-team-dialog'
import { JoinTeamDialog } from '@/components/join-team-dialog'
import { EditUsernameDialog } from '@/components/edit-username-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Users, Plus, LogOut, Pencil } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface HomeClientProps {
  memberships: any[]
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function HomeClient({ memberships, user }: HomeClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState(user.name)
  const [teamNotifications, setTeamNotifications] = useState<Record<string, boolean>>({})

  // Get last cleared time for a team from localStorage
  const getLastClearedTime = (teamId: string): Date => {
    if (typeof window === 'undefined') return new Date(0)
    const key = `lastCleared_team_${teamId}_${user.id}`
    const stored = localStorage.getItem(key)
    return stored ? new Date(stored) : new Date(0)
  }

  // Clear notification for a team when it's clicked
  const clearTeamNotification = (teamId: string) => {
    if (typeof window === 'undefined') return
    const key = `lastCleared_team_${teamId}_${user.id}`
    localStorage.setItem(key, new Date().toISOString())
    setTeamNotifications(prev => ({ ...prev, [teamId]: false }))
  }

  // Check for new content in each team
  useEffect(() => {
    const checkForNewContent = async () => {
      const notifications: Record<string, boolean> = {}

      for (const membership of memberships) {
        const teamId = membership.team.id
        const lastCleared = getLastClearedTime(teamId)
        let hasNew = false

        try {
          // Check announcements
          const streamResponse = await fetch(`/api/announcements?teamId=${teamId}`)
          if (streamResponse.ok) {
            const streamData = await streamResponse.json()
            const hasNewAnnouncement = streamData.announcements?.some((announcement: any) => {
              const isNew = new Date(announcement.createdAt) > lastCleared
              const isFromOtherUser = announcement.author?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            if (hasNewAnnouncement) hasNew = true
          }

          // Check calendar events
          const calendarResponse = await fetch(`/api/calendar?teamId=${teamId}`)
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json()
            const events = calendarData.events || []
            const hasNewEvent = events.some((event: any) => {
              const isNew = new Date(event.createdAt) > lastCleared
              const isFromOtherUser = event.creator?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            if (hasNewEvent) hasNew = true
          }

          // Check purchase requests
          const financeResponse = await fetch(`/api/purchase-requests?teamId=${teamId}`)
          if (financeResponse.ok) {
            const financeData = await financeResponse.json()
            const purchaseRequests = financeData.purchaseRequests || []
            const hasNewRequest = purchaseRequests.some((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.requesterId !== membership.id
              return isNew && isFromOtherUser
            })
            if (hasNewRequest) hasNew = true
          }

          // Check expenses
          const expensesResponse = await fetch(`/api/expenses?teamId=${teamId}`)
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json()
            const expenses = expensesData.expenses || []
            const hasNewExpense = expenses.some((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.addedById !== membership.id
              return isNew && isFromOtherUser
            })
            if (hasNewExpense) hasNew = true
          }

          // Check tests
          const testsResponse = await fetch(`/api/tests?teamId=${teamId}`)
          if (testsResponse.ok) {
            const testsData = await testsResponse.json()
            const hasNewTest = testsData.tests?.some((test: any) => {
              const isNew = new Date(test.createdAt) > lastCleared
              const isFromOtherUser = test.createdById !== membership.id
              return isNew && isFromOtherUser
            })
            if (hasNewTest) hasNew = true
          }

          notifications[teamId] = hasNew
        } catch (error) {
          console.error(`Failed to check notifications for team ${teamId}:`, error)
        }
      }

      setTeamNotifications(notifications)
    }

    checkForNewContent()
    // Poll every 30 seconds for new content
    const interval = setInterval(checkForNewContent, 30000)
    return () => clearInterval(interval)
  }, [memberships, user.id])

  // Sync local state when user prop changes (e.g., after navigation)
  useEffect(() => {
    setCurrentUserName(user.name)
  }, [user.name])

  const handleSignOut = async () => {
    try {
      const response = await signOut({
        callbackUrl: '/auth/signin',
        redirect: false,
      })

      const targetUrl = response?.url ?? '/auth/signin'
      router.push(targetUrl)
      router.refresh()
    } catch (error) {
      console.error('Sign out error', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <header className="border-b glass-effect-light dark:glass-effect-dark">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary-light dark:bg-gradient-primary-dark text-white shadow-xl apple-transition">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">Teamy</h1>
              <p className="text-base text-muted-foreground leading-relaxed">Team Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-10 w-10 cursor-pointer apple-transition hover:scale-105"
                onClick={() => setEditNameOpen(true)}
              >
                <AvatarImage src={user.image || ''} />
                <AvatarFallback>
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-foreground">{currentUserName || user.email}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditNameOpen(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-12">
          <h2 className="mb-4 text-5xl font-bold text-foreground leading-tight">Your Clubs</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Manage your teams, events, and schedules
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">No Clubs Yet</CardTitle>
              <CardDescription className="text-lg">
                Create your first club or join an existing one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-6">
              <Button onClick={() => setCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Club
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg">
                Join Club
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-10 flex justify-end gap-6">
              <Button onClick={() => setCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Club
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg">
                Join Club
              </Button>
            </div>

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="cursor-pointer apple-hover group relative"
                  onClick={() => {
                    clearTeamNotification(membership.team.id)
                    router.push(`/teams/${membership.team.id}`)
                  }}
                >
                  {teamNotifications[membership.team.id] && (
                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-red-500 z-10"></span>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{membership.team.name}</CardTitle>
                        <CardDescription>
                          Division {membership.team.division}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {membership.role === 'ADMIN' && (
                          <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('COACH') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('CAPTAIN') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membership.subteam && (
                      <div className="text-sm text-muted-foreground">
                        Team: <span className="font-medium">{membership.subteam.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
        <JoinTeamDialog open={joinOpen} onOpenChange={setJoinOpen} />
        <EditUsernameDialog 
          open={editNameOpen} 
          onOpenChange={setEditNameOpen}
          currentName={user.name ?? null}
          onNameUpdated={setCurrentUserName}
        />
      </main>
    </div>
  )
}

