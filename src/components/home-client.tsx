'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateTeamDialog } from '@/components/create-team-dialog'
import { JoinTeamDialog } from '@/components/join-team-dialog'
import { AppHeader } from '@/components/app-header'
import { Users, Plus } from 'lucide-react'
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

export function HomeClient({ memberships: initialMemberships, user }: HomeClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [memberships, setMemberships] = useState(initialMemberships)
  const [teamNotifications, setTeamNotifications] = useState<Record<string, boolean>>({})
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Update favicon badge with total unread count
  useFaviconBadge(totalUnreadCount)

  // Refetch memberships
  const fetchMemberships = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setMemberships(data.memberships || [])
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch when pathname changes to dashboard (user navigates back)
  useEffect(() => {
    if (pathname === '/dashboard') {
      fetchMemberships()
    }
  }, [pathname, fetchMemberships])

  // Refetch when component becomes visible (user navigates back to tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/dashboard') {
        fetchMemberships()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, fetchMemberships])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
      </div>

      <AppHeader user={user} />

      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Clubs</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Manage your teams, events, and schedules
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center py-8 sm:py-10 md:py-12 px-4">
              <div className="inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mx-auto mb-3 sm:mb-4 shadow-lg">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 text-gray-900 dark:text-white">No Clubs Yet</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-2">
                Create your first club or join an existing one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-8 sm:pb-10 md:pb-12 px-4">
              <Button 
                onClick={() => setJoinOpen(true)} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                Join Club
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCreateOpen(true)} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create Club
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button 
                onClick={() => setJoinOpen(true)} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                Join Club
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCreateOpen(true)} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Create Club
              </Button>
            </div>

            <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="cursor-pointer group relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  onClick={() => {
                    clearTeamNotification(membership.team.id)
                    router.push(`/club/${membership.team.id}`)
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {teamNotifications[membership.team.id] && (
                    <div className="absolute right-4 top-4 z-10">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="relative pb-3 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-white break-words">
                          {membership.team.name}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold">
                            Division {membership.team.division}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-2.5 sm:space-y-3 pt-0">
                    {membership.subteam && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">Team: <span className="font-semibold text-gray-900 dark:text-white">{membership.subteam.name}</span></span>
                      </div>
                    )}
                    {membership.rosterAssignments && membership.rosterAssignments.length > 0 && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-medium mb-1.5 sm:mb-2 text-gray-900 dark:text-white">{membership.rosterAssignments.length} Event{membership.rosterAssignments.length !== 1 ? 's' : ''}:</p>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {membership.rosterAssignments.map((assignment: any) => (
                            <Badge 
                              key={assignment.id} 
                              variant="secondary" 
                              className="text-[9px] sm:text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5"
                            >
                              {assignment.event.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {membership.role === 'ADMIN' && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs uppercase font-semibold border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5">
                          Admin
                        </Badge>
                      )}
                      {Array.isArray(membership.roles) && membership.roles.includes('COACH') && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs uppercase font-semibold border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5">
                          Coach
                        </Badge>
                      )}
                      {Array.isArray(membership.roles) && membership.roles.includes('CAPTAIN') && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs uppercase font-semibold border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5">
                          Captain
                        </Badge>
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
      </main>
    </div>
  )
}

