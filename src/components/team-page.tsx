'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LogOut, MessageSquare, Users, Calendar, Settings, Pencil, ClipboardCheck, DollarSign, FileText } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { StreamTab } from '@/components/tabs/stream-tab'
import { PeopleTab } from '@/components/tabs/people-tab'
import { CalendarTab } from '@/components/tabs/calendar-tab'
import { AttendanceTab } from '@/components/tabs/attendance-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'
import FinanceTab from '@/components/tabs/finance-tab'
import TestsTab from '@/components/tabs/tests-tab'
import { ThemeToggle } from '@/components/theme-toggle'
import { EditUsernameDialog } from '@/components/edit-username-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface TeamPageProps {
  team: any
  currentMembership: any
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function TeamPage({ team, currentMembership, user }: TeamPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'stream')
  const [editUsernameOpen, setEditUsernameOpen] = useState(false)
  const [currentUserName, setCurrentUserName] = useState(user.name)
  const [editClubNameOpen, setEditClubNameOpen] = useState(false)
  const [currentClubName, setCurrentClubName] = useState(team.name)
  const [newClubName, setNewClubName] = useState(team.name)
  const [updatingClubName, setUpdatingClubName] = useState(false)
  const [tabNotifications, setTabNotifications] = useState<Record<string, boolean>>({})
  const isAdmin = currentMembership.role === 'ADMIN'

  // Get last cleared time for a tab from localStorage
  const getLastClearedTime = (tab: string): Date => {
    if (typeof window === 'undefined') return new Date(0)
    const key = `lastCleared_${team.id}_${tab}_${user.id}`
    const stored = localStorage.getItem(key)
    return stored ? new Date(stored) : new Date(0)
  }

  // Clear notification for a tab when it's opened
  const clearTabNotification = (tab: string) => {
    if (typeof window === 'undefined') return
    const key = `lastCleared_${team.id}_${tab}_${user.id}`
    localStorage.setItem(key, new Date().toISOString())
    setTabNotifications(prev => ({ ...prev, [tab]: false }))
  }

  // Check for new content created by OTHER users in each tab
  useEffect(() => {
    // Don't check if we're currently viewing a tab (it will be cleared when opened)
    const checkForNewContent = async () => {
      const notifications: Record<string, boolean> = {}

      // Stream: Check for new announcements by other users
      if (activeTab !== 'stream') {
        try {
          const streamResponse = await fetch(`/api/announcements?teamId=${team.id}`)
          if (streamResponse.ok) {
            const streamData = await streamResponse.json()
            const lastCleared = getLastClearedTime('stream')
            const hasNew = streamData.announcements?.some((announcement: any) => {
              const createdAt = new Date(announcement.createdAt)
              const isNew = createdAt > lastCleared
              const isFromOtherUser = announcement.author?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            notifications.stream = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check stream notifications:', error)
        }
      }

      // Calendar: Check for new events by other users
      if (activeTab !== 'calendar') {
        try {
          const calendarResponse = await fetch(`/api/calendar?teamId=${team.id}`)
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json()
            const lastCleared = getLastClearedTime('calendar')
            const events = calendarData.events || []
            const hasNew = events.some((event: any) => {
              const createdAt = new Date(event.createdAt)
              const isNew = createdAt > lastCleared
              const isFromOtherUser = event.creator?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            notifications.calendar = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check calendar notifications:', error)
        }
      }

      // Finance: Check for new purchase requests or expenses by other users
      if (activeTab !== 'finance') {
        try {
          const financeResponse = await fetch(`/api/purchase-requests?teamId=${team.id}`)
          if (financeResponse.ok) {
            const financeData = await financeResponse.json()
            const lastCleared = getLastClearedTime('finance')
            const purchaseRequests = financeData.purchaseRequests || []
            const expensesResponse = await fetch(`/api/expenses?teamId=${team.id}`)
            let expenses: any[] = []
            if (expensesResponse.ok) {
              const expensesData = await expensesResponse.json()
              expenses = expensesData.expenses || []
            }
            const hasNew = [
              ...purchaseRequests,
              ...expenses
            ].some((item: any) => {
              const createdAt = new Date(item.createdAt)
              const isNew = createdAt > lastCleared
              // Check if it's from another user
              const isFromOtherUser = item.requesterId !== currentMembership.id && 
                                     item.addedById !== currentMembership.id
              return isNew && isFromOtherUser
            })
            notifications.finance = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check finance notifications:', error)
        }
      }

      // Tests: Check for new tests by other users
      if (activeTab !== 'tests') {
        try {
          const testsResponse = await fetch(`/api/tests?teamId=${team.id}`)
          if (testsResponse.ok) {
            const testsData = await testsResponse.json()
            const lastCleared = getLastClearedTime('tests')
            const hasNew = testsData.tests?.some((test: any) => {
              const createdAt = new Date(test.createdAt)
              const isNew = createdAt > lastCleared
              const isFromOtherUser = test.createdById !== currentMembership.id
              return isNew && isFromOtherUser
            })
            notifications.tests = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check tests notifications:', error)
        }
      }

      // People: Check for new members (added by admins/other users)
      if (activeTab !== 'people') {
        try {
          const lastCleared = getLastClearedTime('people')
          const hasNew = team.memberships?.some((membership: any) => {
            const createdAt = new Date(membership.createdAt)
            const isNew = createdAt > lastCleared
            // New members are always from other users (you can't add yourself)
            return isNew
          })
          notifications.people = !!hasNew
        } catch (error) {
          console.error('Failed to check people notifications:', error)
        }
      }

      // Attendance: Check for new attendance records by other users
      if (activeTab !== 'attendance') {
        try {
          const attendanceResponse = await fetch(`/api/attendance?teamId=${team.id}`)
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json()
            const lastCleared = getLastClearedTime('attendance')
            const hasNew = attendanceData.attendance?.some((record: any) => {
              const createdAt = new Date(record.createdAt)
              const isNew = createdAt > lastCleared
              // Check if created by another user
              const isFromOtherUser = record.createdById !== currentMembership.id
              return isNew && isFromOtherUser
            })
            notifications.attendance = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check attendance notifications:', error)
        }
      }

      setTabNotifications(prev => ({ ...prev, ...notifications }))
    }

    checkForNewContent()
    // Poll every 30 seconds for new content
    const interval = setInterval(checkForNewContent, 30000)
    return () => clearInterval(interval)
  }, [team.id, user.id, currentMembership.id, activeTab])

  // Clear notification when tab is opened
  useEffect(() => {
    if (activeTab) {
      clearTabNotification(activeTab)
    }
  }, [activeTab, team.id, user.id])

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
    // Clear notification when tab is clicked
    clearTabNotification(newTab)
    setActiveTab(newTab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    router.replace(url.pathname + url.search, { scroll: false })
  }

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

  const handleUpdateClubName = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClubName.trim()) {
      toast({
        title: 'Error',
        description: 'Club name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setUpdatingClubName(true)

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClubName.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update club name')
      }

      toast({
        title: 'Club name updated',
        description: `Club name changed to "${newClubName.trim()}"`,
      })

      // Update local state immediately
      setCurrentClubName(newClubName.trim())
      setEditClubNameOpen(false)
      
      // Refresh to get updated data
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update club name',
        variant: 'destructive',
      })
    } finally {
      setUpdatingClubName(false)
    }
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
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground leading-tight">{currentClubName}</h1>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewClubName(currentClubName)
                        setEditClubNameOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                <div className="flex items-center gap-2">
                  {currentMembership.role === 'ADMIN' && (
                    <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
                  )}
                  {Array.isArray(currentMembership.roles) && currentMembership.roles.includes('COACH') && (
                    <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
                  )}
                  {Array.isArray(currentMembership.roles) && currentMembership.roles.includes('CAPTAIN') && (
                    <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
                  )}
                </div>
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

      <main className="container mx-auto p-8">
        <div className="flex gap-8">
          {/* Vertical Navigation Sidebar */}
          <aside className="w-48 flex-shrink-0">
            <nav className="sticky top-8 space-y-2">
              <Button
                variant={activeTab === 'stream' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('stream')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Stream
                {tabNotifications.stream && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button
                variant={activeTab === 'people' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('people')}
              >
                <Users className="mr-2 h-4 w-4" />
                People
                {tabNotifications.people && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('calendar')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
                {tabNotifications.calendar && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button
                variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('attendance')}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Attendance
                {tabNotifications.attendance && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button
                variant={activeTab === 'finance' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('finance')}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Finance
                {tabNotifications.finance && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button
                variant={activeTab === 'tests' ? 'default' : 'ghost'}
                className="w-full justify-start relative"
                onClick={() => handleTabChange('tests')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Tests
                {tabNotifications.tests && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500"></span>
                )}
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
                isAdmin={isAdmin}
                user={user}
              />
            )}

            {activeTab === 'people' && (
              <PeopleTab
                team={team}
                currentMembership={currentMembership}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarTab
                teamId={team.id}
                currentMembership={currentMembership}
                isAdmin={isAdmin}
                user={user}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceTab
                teamId={team.id}
                isAdmin={isAdmin}
                user={user}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceTab
                teamId={team.id}
                isAdmin={isAdmin}
                currentMembershipId={currentMembership.id}
                currentMembershipSubteamId={currentMembership.subteamId}
                division={team.division}
              />
            )}

            {activeTab === 'tests' && (
              <TestsTab
                teamId={team.id}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                team={team}
                currentMembership={currentMembership}
                isAdmin={isAdmin}
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

      {/* Edit Club Name Dialog */}
      <Dialog open={editClubNameOpen} onOpenChange={setEditClubNameOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateClubName}>
            <DialogHeader>
              <DialogTitle>Edit Club Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="Enter club name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditClubNameOpen(false)}
                disabled={updatingClubName}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingClubName || !newClubName.trim()}>
                {updatingClubName ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

