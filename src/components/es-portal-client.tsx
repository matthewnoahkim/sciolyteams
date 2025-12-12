'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ClipboardList,
  LogOut, 
  Calendar,
  FileText,
  Plus,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ExternalLink,
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import Link from 'next/link'

interface StaffMembership {
  id: string
  email: string
  name: string | null
  role: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  invitedAt: string
  acceptedAt: string | null
  tournament: {
    id: string
    name: string
    division: 'B' | 'C'
    startDate: string
  }
  events: Array<{
    event: {
      id: string
      name: string
      division: 'B' | 'C'
    }
  }>
  tests: Array<{
    id: string
    name: string
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    eventId: string | null
    event?: {
      id: string
      name: string
    } | null
    questions: Array<{
      id: string
      type: string
      promptMd: string
      points: number
      order: number
      options: Array<{
        id: string
        label: string
        isCorrect: boolean
        order: number
      }>
    }>
  }>
}

interface TimelineItem {
  id: string
  name: string
  description: string | null
  dueDate: string
  type: string
}

interface ESPortalClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  staffMemberships: StaffMembership[]
}

export function ESPortalClient({ user, staffMemberships }: ESPortalClientProps) {
  const [activeTab, setActiveTab] = useState<string>(staffMemberships[0]?.tournament.id || '')
  const [timelines, setTimelines] = useState<Record<string, TimelineItem[]>>({})
  const [loadingTimelines, setLoadingTimelines] = useState<Set<string>>(new Set())

  const handleSignOut = () => {
    signOut({ callbackUrl: '/es' })
  }

  // Fetch timeline for a tournament
  const fetchTimeline = async (tournamentId: string) => {
    if (loadingTimelines.has(tournamentId) || timelines[tournamentId]) return
    
    setLoadingTimelines(prev => new Set([...prev, tournamentId]))
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/timeline`)
      if (res.ok) {
        const data = await res.json()
        setTimelines(prev => ({ ...prev, [tournamentId]: data.timeline }))
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoadingTimelines(prev => {
        const next = new Set(prev)
        next.delete(tournamentId)
        return next
      })
    }
  }

  useEffect(() => {
    if (activeTab) {
      fetchTimeline(activeTab)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const getTimelineStatus = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" variant="light" />
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white font-semibold">Event Supervisor Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/30">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block max-w-[120px] md:max-w-none">
              <p className="text-xs sm:text-sm font-medium truncate text-white">
                {user.name || user.email}
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 truncate">{user.email}</p>
            </div>
            <ThemeToggle variant="header" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="px-2 sm:px-3 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.name?.split(' ')[0] || 'Event Supervisor'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your tournament assignments and create tests for your events.
          </p>
        </div>

        {staffMemberships.length === 0 ? (
          <Card className="bg-card/90 backdrop-blur border border-white/10">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Assignments</h3>
              <p className="text-muted-foreground">
                You don&apos;t have any tournament assignments yet. Contact a Tournament Director to get invited.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-white/10">
              {staffMemberships.map(membership => (
                <TabsTrigger 
                  key={membership.tournament.id} 
                  value={membership.tournament.id}
                  className="data-[state=active]:bg-teamy-primary data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {membership.tournament.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {staffMemberships.map(membership => (
              <TabsContent key={membership.tournament.id} value={membership.tournament.id} className="space-y-6">
                {/* Tournament Info */}
                <Card className="bg-card/90 backdrop-blur border border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{membership.tournament.name}</CardTitle>
                        <CardDescription>
                          Division {membership.tournament.division} • {format(new Date(membership.tournament.startDate), 'MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge className="bg-teamy-primary/10 text-teamy-primary border-teamy-primary/20">
                        {membership.role === 'EVENT_SUPERVISOR' ? 'Event Supervisor' : 'Tournament Director'}
                      </Badge>
                    </div>
                  </CardHeader>
                  {membership.events.length > 0 && (
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Your Assigned Events:</h4>
                      <div className="flex flex-wrap gap-2">
                        {membership.events.map(e => (
                          <Badge key={e.event.id} variant="secondary" className="bg-teamy-primary/5 dark:bg-white/5">
                            {e.event.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Timeline */}
                {timelines[membership.tournament.id] && timelines[membership.tournament.id].length > 0 && (
                  <Card className="bg-card/90 backdrop-blur border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-teamy-primary" />
                        Timeline & Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {timelines[membership.tournament.id].map(item => {
                          const status = getTimelineStatus(item.dueDate)
                          return (
                            <div 
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                status === 'overdue' 
                                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30' 
                                  : status === 'today'
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {status === 'overdue' ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : status === 'today' ? (
                                  <Clock className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="h-5 w-5 text-teamy-primary" />
                                )}
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  status === 'overdue' ? 'text-red-600' : status === 'today' ? 'text-amber-600' : ''
                                }`}>
                                  {format(new Date(item.dueDate), 'MMM d, yyyy')}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {item.type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tests Section */}
                <Card className="bg-card/90 backdrop-blur border border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teamy-primary" />
                        Your Tests
                      </CardTitle>
                      <Link 
                        href={`/es/tests/new?staffId=${membership.id}${membership.events[0] ? `&eventId=${membership.events[0].event.id}` : ''}`}
                      >
                        <Button className="bg-teamy-primary text-white hover:bg-teamy-primary-dark">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Test
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membership.tests.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No tests created yet. Click &ldquo;Create Test&rdquo; to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {membership.tests.map(test => (
                          <div 
                            key={test.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/60 dark:bg-slate-900/60"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{test.name}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    test.status === 'PUBLISHED' 
                                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                      : test.status === 'CLOSED'
                                        ? 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  }
                                >
                                  {test.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {test.event?.name || 'No event assigned'} • {test.questions.length} question{test.questions.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/es/tests/${test.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-card/80 dark:bg-slate-900/80 backdrop-blur py-4 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
