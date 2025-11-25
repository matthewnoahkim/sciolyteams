'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Home, MessageSquare, Users, Calendar, Settings, ClipboardCheck, DollarSign, FileText, Pencil, Image, File, Menu } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { HomePageTab } from '@/components/tabs/homepage-tab'
import { StreamTab } from '@/components/tabs/stream-tab'
import { PeopleTab } from '@/components/tabs/people-tab'
import { CalendarTab } from '@/components/tabs/calendar-tab'
import { AttendanceTab } from '@/components/tabs/attendance-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'
import FinanceTab from '@/components/tabs/finance-tab'
import TestsTab from '@/components/tabs/tests-tab'
import { GalleryTab } from '@/components/tabs/gallery-tab'
import { PaperworkTab } from '@/components/tabs/paperwork-tab'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useFaviconBadge } from '@/hooks/use-favicon-badge'

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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home')
  const [editClubNameOpen, setEditClubNameOpen] = useState(false)
  const [currentClubName, setCurrentClubName] = useState(team.name)
  const [newClubName, setNewClubName] = useState(team.name)
  const [updatingClubName, setUpdatingClubName] = useState(false)
  const [tabNotifications, setTabNotifications] = useState<Record<string, boolean>>({})
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = currentMembership.role === 'ADMIN'

  // Update favicon badge with total unread count across all tabs
  useFaviconBadge(totalUnreadCount)

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
    setTabNotifications(prev => {
      const updated = { ...prev, [tab]: false }
      // Recalculate total count
      const totalCount = Object.values(updated).filter(Boolean).length
      setTotalUnreadCount(totalCount)
      return updated
    })
  }

  // Check for new content in each tab (from anyone, not just other users)
  useEffect(() => {
    const checkForNewContent = async () => {
      const notifications: Record<string, boolean> = {}

      // Stream: Check for new announcements
      // Also check calendar events that were posted to stream (have calendarEventId in announcement)
      if (activeTab !== 'stream') {
        try {
          const streamResponse = await fetch(`/api/announcements?teamId=${team.id}`)
          if (streamResponse.ok) {
            const streamData = await streamResponse.json()
            const lastCleared = getLastClearedTime('stream')
            const hasNewAnnouncement = streamData.announcements?.some((announcement: any) => {
              const isNew = new Date(announcement.createdAt) > lastCleared
              const isFromOtherUser = announcement.author?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            
            // Also check if any calendar events were posted to stream (announcements with calendarEventId)
            const hasNewCalendarPost = streamData.announcements?.some((announcement: any) => {
              const announcementCreated = new Date(announcement.createdAt)
              const isNew = announcementCreated > lastCleared
              const isFromOtherUser = announcement.author?.user?.id !== user.id
              // If announcement has calendarEventId, it means a calendar event was posted to stream
              return isNew && announcement.calendarEventId && isFromOtherUser
            })
            
            notifications.stream = !!(hasNewAnnouncement || hasNewCalendarPost)
          }
        } catch (error) {
          console.error('Failed to check stream notifications:', error)
        }
      }

      // Calendar: Check for new events
      // Also check announcements that are linked to calendar events (RSVP events posted to stream)
      if (activeTab !== 'calendar') {
        try {
          const calendarResponse = await fetch(`/api/calendar?teamId=${team.id}`)
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json()
            const lastCleared = getLastClearedTime('calendar')
            const events = calendarData.events || []
            const hasNewEvent = events.some((event: any) => {
              const isNew = new Date(event.createdAt) > lastCleared
              const isFromOtherUser = event.creator?.user?.id !== user.id
              return isNew && isFromOtherUser
            })
            
            // Also check announcements - if a new announcement has a calendarEventId, it means an event was posted
            let hasNewEventFromAnnouncement = false
            try {
              const announcementsResponse = await fetch(`/api/announcements?teamId=${team.id}`)
              if (announcementsResponse.ok) {
                const announcementsData = await announcementsResponse.json()
                hasNewEventFromAnnouncement = announcementsData.announcements?.some((announcement: any) => {
                  const announcementCreated = new Date(announcement.createdAt)
                  const isNew = announcementCreated > lastCleared
                  const isFromOtherUser = announcement.author?.user?.id !== user.id
                  // If announcement has calendarEventId, it's linked to a calendar event
                  return isNew && announcement.calendarEventId && isFromOtherUser
                })
              }
            } catch (error) {
              // Ignore announcement check errors for calendar
            }
            
            notifications.calendar = !!(hasNewEvent || hasNewEventFromAnnouncement)
          }
        } catch (error) {
          console.error('Failed to check calendar notifications:', error)
        }
      }

      // Attendance: Check for new attendance records
      // Also check calendar events since creating a calendar event creates an attendance record
      if (activeTab !== 'attendance') {
        try {
          const attendanceResponse = await fetch(`/api/attendance?teamId=${team.id}`)
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json()
            const lastCleared = getLastClearedTime('attendance')
            const hasNewAttendance = attendanceData.attendance?.some((record: any) => {
              const isNew = new Date(record.createdAt) > lastCleared
              const isFromOtherUser = record.createdById !== currentMembership.id
              return isNew && isFromOtherUser
            })
            
            // Also check calendar events - if a new calendar event was created, it likely created an attendance record
            let hasNewCalendarEvent = false
            try {
              const calendarResponse = await fetch(`/api/calendar?teamId=${team.id}`)
              if (calendarResponse.ok) {
                const calendarData = await calendarResponse.json()
                const events = calendarData.events || []
                hasNewCalendarEvent = events.some((event: any) => {
                  const isNew = new Date(event.createdAt) > lastCleared
                  const isFromOtherUser = event.creator?.user?.id !== user.id
                  return isNew && isFromOtherUser
                })
              }
            } catch (error) {
              // Ignore calendar check errors for attendance
            }
            
            notifications.attendance = !!(hasNewAttendance || hasNewCalendarEvent)
          }
        } catch (error) {
          console.error('Failed to check attendance notifications:', error)
        }
      }

      // Finance: Check for new purchase requests or expenses
      // Also check when purchase requests are approved (they become expenses)
      if (activeTab !== 'finance') {
        try {
          const lastCleared = getLastClearedTime('finance')
          
          // Check purchase requests
          const financeResponse = await fetch(`/api/purchase-requests?teamId=${team.id}`)
          let hasNewRequest = false
          if (financeResponse.ok) {
            const financeData = await financeResponse.json()
            const purchaseRequests = financeData.purchaseRequests || []
            hasNewRequest = purchaseRequests.some((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.requesterId !== currentMembership.id
              return isNew && isFromOtherUser
            })
          }
          
          // Check expenses (including those created from approved purchase requests)
          const expensesResponse = await fetch(`/api/expenses?teamId=${team.id}`)
          let hasNewExpense = false
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json()
            const expenses = expensesData.expenses || []
            hasNewExpense = expenses.some((item: any) => {
              const isNew = new Date(item.createdAt) > lastCleared
              const isFromOtherUser = item.addedById !== currentMembership.id
              return isNew && isFromOtherUser
            })
          }
          
          // Check for purchase requests that were recently approved (status change)
          let hasNewApproval = false
          if (financeResponse.ok) {
            const financeData = await financeResponse.json()
            const purchaseRequests = financeData.purchaseRequests || []
            hasNewApproval = purchaseRequests.some((request: any) => {
              // If request is approved and has a reviewedAt date after last cleared
              if (request.status === 'APPROVED' && request.reviewedAt) {
                const isNew = new Date(request.reviewedAt) > lastCleared
                const isFromOtherUser = request.requesterId !== currentMembership.id
                return isNew && isFromOtherUser
              }
              return false
            })
          }
          
          notifications.finance = !!(hasNewRequest || hasNewExpense || hasNewApproval)
        } catch (error) {
          console.error('Failed to check finance notifications:', error)
        }
      }

      // Tests: Check for new tests
      if (activeTab !== 'tests') {
        try {
          const testsResponse = await fetch(`/api/tests?teamId=${team.id}`)
          if (testsResponse.ok) {
            const testsData = await testsResponse.json()
            const lastCleared = getLastClearedTime('tests')
            const hasNew = testsData.tests?.some((test: any) => {
              const isNew = new Date(test.createdAt) > lastCleared
              const isFromOtherUser = test.createdById !== currentMembership.id
              return isNew && isFromOtherUser
            })
            notifications.tests = !!hasNew
          }
        } catch (error) {
          console.error('Failed to check tests notifications:', error)
        }
      }

      // People: Check for new members
      if (activeTab !== 'people') {
        try {
          const lastCleared = getLastClearedTime('people')
          const hasNew = team.memberships?.some((membership: any) => {
            const isNew = new Date(membership.createdAt) > lastCleared
            // New members are always from other users (you can't add yourself)
            return isNew
          })
          notifications.people = !!hasNew
        } catch (error) {
          console.error('Failed to check people notifications:', error)
        }
      }

      setTabNotifications(prev => {
        const updated = { ...prev, ...notifications }
        // Calculate total unread count across all tabs
        const totalCount = Object.values(updated).filter(Boolean).length
        setTotalUnreadCount(totalCount)
        return updated
      })
    }

    checkForNewContent()
    // Poll every 30 seconds for new content
    const interval = setInterval(checkForNewContent, 30000)
    return () => clearInterval(interval)
  }, [team.id, team.memberships, user.id, currentMembership.id, activeTab])

  // Clear notification when tab is opened
  useEffect(() => {
    if (activeTab) {
      clearTabNotification(activeTab)
    }
  }, [activeTab, team.id, user.id])

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
    setMobileMenuOpen(false) // Close mobile menu when tab changes
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newTab)
    router.replace(url.pathname + url.search, { scroll: false })
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

      // Update local state immediately (optimistic update)
      setCurrentClubName(newClubName.trim())
      setEditClubNameOpen(false)
      
      // Update team name in props if needed - the state is already updated
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

  // Get background style based on team settings
  const getBackgroundStyle = () => {
    const bgType = team.backgroundType || 'grid'
    
    if (bgType === 'solid' && team.backgroundColor) {
      return {
        background: team.backgroundColor,
        backgroundAttachment: 'fixed',
      }
    } else if (bgType === 'gradient' && team.gradientStartColor && team.gradientEndColor) {
      return {
        background: `linear-gradient(135deg, ${team.gradientStartColor} 0%, ${team.gradientEndColor} 100%)`,
        backgroundAttachment: 'fixed',
      }
    }
    
    // Default grid pattern - will be handled by the overlay div
    return {}
  }

  const bgType = team.backgroundType || 'grid'
  const showGridPattern = bgType === 'grid'
  const showAnimatedBlobs = bgType === 'grid' // Only show animated blobs with grid

  // Render navigation buttons (reusable for sidebar and mobile menu)
  const renderNavigationButtons = () => (
    <>
      <Button
        variant={activeTab === 'home' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('home')}
      >
        <Home className="mr-3 h-4 w-4" />
        Home
      </Button>
      <Button
        variant={activeTab === 'stream' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('stream')}
      >
        <MessageSquare className="mr-3 h-4 w-4" />
        Stream
        {tabNotifications.stream && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'people' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('people')}
      >
        <Users className="mr-3 h-4 w-4" />
        People
        {tabNotifications.people && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'calendar' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('calendar')}
      >
        <Calendar className="mr-3 h-4 w-4" />
        Calendar
        {tabNotifications.calendar && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'attendance' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('attendance')}
      >
        <ClipboardCheck className="mr-3 h-4 w-4" />
        Attendance
        {tabNotifications.attendance && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'finance' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('finance')}
      >
        <DollarSign className="mr-3 h-4 w-4" />
        Finance
        {tabNotifications.finance && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'tests' ? 'default' : 'ghost'}
        className="w-full justify-start relative text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('tests')}
      >
        <FileText className="mr-3 h-4 w-4" />
        Tests
        {tabNotifications.tests && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        )}
      </Button>
      <Button
        variant={activeTab === 'gallery' ? 'default' : 'ghost'}
        className="w-full justify-start text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('gallery')}
      >
        <Image className="mr-3 h-4 w-4" />
        Gallery
      </Button>
      <Button
        variant={activeTab === 'paperwork' ? 'default' : 'ghost'}
        className="w-full justify-start text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('paperwork')}
      >
        <File className="mr-3 h-4 w-4" />
        Paperwork
      </Button>
      <div className="h-px bg-border my-2" />
      <Button
        variant={activeTab === 'settings' ? 'default' : 'ghost'}
        className="w-full justify-start text-sm font-semibold h-11 rounded-2xl"
        onClick={() => handleTabChange('settings')}
      >
        <Settings className="mr-3 h-4 w-4" />
        Settings
      </Button>
    </>
  )

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      {/* Animated background elements - only show for grid */}
      {showAnimatedBlobs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
      )}
      
      {/* Grid pattern overlay - only show for grid */}
      {showGridPattern && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
        </div>
      )}

      <AppHeader user={user} showBackButton={true} backHref="/dashboard" title={currentClubName} />

      <main className="relative z-10 container mx-auto px-4 py-6 md:py-8 max-w-full overflow-x-hidden">
        <div className="flex gap-6 lg:gap-8">
          {/* Vertical Navigation Sidebar */}
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <nav className="sticky top-24 space-y-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 p-3 rounded-2xl shadow-lg">
              {renderNavigationButtons()}
            </nav>
          </aside>

          {/* Mobile Menu Button */}
          <div className="md:hidden fixed top-20 left-2 z-40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:bg-white dark:hover:bg-gray-900"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>

          {/* Mobile Navigation Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              <SheetHeader className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-100px)]">
                {renderNavigationButtons()}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 md:pl-0 pl-12">
            {/* Team Info Header - Only visible on settings tab */}
            {activeTab === 'settings' && (
              <div className="mb-6 p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{currentClubName}</h2>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewClubName(currentClubName)
                            setEditClubNameOpen(true)
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold">
                        Division {team.division}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {team.memberships.length} member{team.memberships.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'home' && (
              <HomePageTab
                teamId={team.id}
                team={team}
                isAdmin={isAdmin}
                user={user}
              />
            )}

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

            {activeTab === 'gallery' && (
              <GalleryTab
                teamId={team.id}
                user={user}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'paperwork' && (
              <PaperworkTab
                teamId={team.id}
                user={user}
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

