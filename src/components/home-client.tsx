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
import { Logo } from '@/components/logo'
import { signOut } from 'next-auth/react'
import { useFaviconBadge } from '@/hooks/use-favicon-badge'

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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  // Update favicon badge with total unread count
  useFaviconBadge(totalUnreadCount)

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
    setTeamNotifications(prev => {
      const updated = { ...prev, [teamId]: false }
      // Recalculate total count
      const newCount = Object.values(updated).filter(Boolean).length
      setTotalUnreadCount(newCount)
      return updated
    })
  }

  // Check for new content in each team
  useEffect(() => {
    const checkForNewContent = async () => {
      const notifications: Record<string, boolean> = {}
      let totalUnreadItems = 0

      for (const membership of memberships) {
        const teamId = membership.team.id
        const lastCleared = getLastClearedTime(teamId)
        let hasNew = false
        let teamUnreadCount = 0

        try {
          // Check announcements
          const streamResponse = await fetch(`/api/announcements?teamId=${teamId}`)
          if (streamResponse.ok) {
            const streamData = await streamResponse.json()
            const newAnnouncements = streamData.announcements?.filter((announcement: any) => {
              const isNew = new Date(announcement.createdAt) > lastCleared
              const isFromOtherUser = announcement.author?.user?.id !== user.id
              return isNew && isFromOtherUser
            }) || []
            if (newAnnouncements.length > 0) {
              hasNew = true
              teamUnreadCount += newAnnouncements.length
            }
          }

          // Check calendar events
          const calendarResponse = await fetch(`/api/calendar?teamId=${teamId}`)
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json()
            const events = calendarData.events || []
            const newEvents = events.filter((event: any) => {
              const isNew = new Date(event.createdAt) > lastCleared
              const isFromOtherUser = event.creator?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            if (newEvents.length > 0) {
              hasNew = true
              teamUnreadCount += newEvents.length
            }
          }

          // Check purchase requests
          const financeResponse = await fetch(`/api/purchase-requests?teamId=${teamId}`)
          if (financeResponse.ok) {
            const financeData = await financeResponse.json()
            const purchaseRequests = financeData.purchaseRequests || []
            const newRequests = purchaseRequests.filter((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.requesterId !== membership.id
              return isNew && isFromOtherUser
            })
            if (newRequests.length > 0) {
              hasNew = true
              teamUnreadCount += newRequests.length
            }
          }

          // Check expenses
          const expensesResponse = await fetch(`/api/expenses?teamId=${teamId}`)
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json()
            const expenses = expensesData.expenses || []
            const newExpenses = expenses.filter((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.addedById !== membership.id
              return isNew && isFromOtherUser
            })
            if (newExpenses.length > 0) {
              hasNew = true
              teamUnreadCount += newExpenses.length
            }
          }

          // Check tests
          const testsResponse = await fetch(`/api/tests?teamId=${teamId}`)
          if (testsResponse.ok) {
            const testsData = await testsResponse.json()
            const newTests = testsData.tests?.filter((test: any) => {
              const isNew = new Date(test.createdAt) > lastCleared
              const isFromOtherUser = test.createdById !== membership.id
              return isNew && isFromOtherUser
            }) || []
            if (newTests.length > 0) {
              hasNew = true
              teamUnreadCount += newTests.length
            }
          }

          notifications[teamId] = hasNew
          totalUnreadItems += teamUnreadCount
        } catch (error) {
          console.error(`Failed to check notifications for team ${teamId}:`, error)
        }
      }

      setTeamNotifications(notifications)
      setTotalUnreadCount(totalUnreadItems)
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
      <header className="glass-effect-light dark:glass-effect-dark sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Logo size="lg" />
            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground">Team Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-10 w-10 cursor-pointer apple-button-hover ring-2 ring-primary/10"
                onClick={() => setEditNameOpen(true)}
              >
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-gradient-primary-light dark:bg-gradient-primary-dark text-primary-foreground">
                  {currentUserName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-foreground">{currentUserName || user.email}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-primary/10"
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
              className="apple-button-hover"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-10">
        <div className="mb-16">
          <h2 className="mb-4 text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
            Your <span className="gradient-text dark:gradient-text-dark">Clubs</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Manage your teams, events, and schedules
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-dashed border-2 glass-effect-light dark:glass-effect-dark">
            <CardHeader className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-primary-light dark:bg-gradient-primary-dark mx-auto mb-4">
                <Users className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-4xl mb-3">No Clubs Yet</CardTitle>
              <CardDescription className="text-lg">
                Create your first club or join an existing one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-center gap-4 pb-12">
              <Button onClick={() => setCreateOpen(true)} size="lg" className="apple-button-hover text-base px-8">
                <Plus className="mr-2 h-5 w-5" />
                Create Club
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg" className="apple-button-hover text-base px-8">
                Join Club
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-12 flex justify-end gap-4">
              <Button onClick={() => setCreateOpen(true)} size="lg" className="apple-button-hover text-base px-8">
                <Plus className="mr-2 h-5 w-5" />
                Create Club
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg" className="apple-button-hover text-base px-8">
                Join Club
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="cursor-pointer apple-hover group relative overflow-hidden glass-effect-light dark:glass-effect-dark border-2"
                  onClick={() => {
                    clearTeamNotification(membership.team.id)
                    router.push(`/teams/${membership.team.id}`)
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {teamNotifications[membership.team.id] && (
                    <div className="absolute right-4 top-4 z-10">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">{membership.team.name}</CardTitle>
                        <CardDescription className="text-base flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                            Division {membership.team.division}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-3">
                    {membership.subteam && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Team: <span className="font-semibold text-foreground">{membership.subteam.name}</span></span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {membership.role === 'ADMIN' && (
                        <Badge variant="outline" className="text-xs uppercase font-semibold border-primary/30 bg-primary/5">Admin</Badge>
                      )}
                      {Array.isArray(membership.roles) && membership.roles.includes('COACH') && (
                        <Badge variant="outline" className="text-xs uppercase font-semibold border-purple-500/30 bg-purple-500/5">Coach</Badge>
                      )}
                      {Array.isArray(membership.roles) && membership.roles.includes('CAPTAIN') && (
                        <Badge variant="outline" className="text-xs uppercase font-semibold border-blue-500/30 bg-blue-500/5">Captain</Badge>
                      )}
                    </div>
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

