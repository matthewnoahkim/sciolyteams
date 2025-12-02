'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AppHeader } from '@/components/app-header'
import { useToast } from '@/components/ui/use-toast'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Plus, Search, Calendar, MapPin, Users, DollarSign, Trophy, Settings, Monitor, UserPlus, Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  division: 'B' | 'C'
  description: string | null
  price: number
  isOnline: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string | null
  approved: boolean
  rejectionReason: string | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  registrations: Array<{
    id: string
    team: {
      id: string
      name: string
    } | null
    club?: {
      id: string
      name: string
    }
  }>
  _count: {
    registrations: number
  }
  isCreator?: boolean
  isAdmin?: boolean
}

interface TournamentsClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function TournamentsClient({ user }: TournamentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  
  // Initialize viewFilter from URL param, default to 'all'
  const tabParam = searchParams.get('tab')
  const validTabs = ['all', 'my', 'managed', 'team', 'pending'] as const
  const initialTab = (tabParam && validTabs.includes(tabParam as any)) ? tabParam as typeof validTabs[number] : 'all'
  const [viewFilter, setViewFilter] = useState<'all' | 'my' | 'managed' | 'team' | 'pending'>(initialTab)
  const [sortField, setSortField] = useState<'date' | 'price' | 'popularity'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Sync viewFilter with URL param when it changes (e.g., browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const validTabs = ['all', 'my', 'managed', 'team', 'pending'] as const
    const newTab = (tabParam && validTabs.includes(tabParam as any)) ? tabParam as typeof validTabs[number] : 'all'
    if (newTab !== viewFilter) {
      setViewFilter(newTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  
  // Update URL when tab changes (only if it doesn't already match)
  useEffect(() => {
    const currentTabParam = searchParams.get('tab') || 'all'
    if (currentTabParam !== viewFilter) {
      const params = new URLSearchParams(searchParams.toString())
      if (viewFilter === 'all') {
        params.delete('tab')
      } else {
        params.set('tab', viewFilter)
      }
      const newUrl = params.toString() ? `/tournaments?${params.toString()}` : '/tournaments'
      router.replace(newUrl, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewFilter])

  // Reset filters when switching tabs
  useEffect(() => {
    setSearch('')
    setDivisionFilter('all')
    // For pending tab, show all tournaments (not just upcoming)
    setUpcomingOnly(viewFilter !== 'pending')
    setSortField('date')
    setSortDirection('asc')
    // Clear tournaments to prevent showing old data from previous tab
    setTournaments([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewFilter])

  useEffect(() => {
    loadTournaments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionFilter, upcomingOnly, viewFilter, sortField, sortDirection])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (divisionFilter !== 'all') {
        params.append('division', divisionFilter)
      }
      // Only add upcoming filter when it's true, otherwise fetch all tournaments
      // Don't apply upcoming filter for pending tab (show all pending tournaments)
      if (upcomingOnly && viewFilter !== 'pending') {
        params.append('upcoming', 'true')
      }
      // Filter by creator if viewing "My Tournaments" (created by me)
      if (viewFilter === 'my') {
        params.append('createdBy', 'me')
      }
      // Filter by tournaments managed by user (creator or admin)
      if (viewFilter === 'managed') {
        params.append('managedBy', 'me')
      }
      // Filter by tournaments where user's team is registered
      if (viewFilter === 'team') {
        params.append('teamRegistered', 'me')
      }
      // Filter by pending approval tournaments (created by user but not approved)
      if (viewFilter === 'pending') {
        params.append('pendingApproval', 'me')
      }
      // Add sort parameter
      params.append('sortBy', `${sortField}-${sortDirection}`)
      // Add cache busting to ensure fresh data
      params.append('_t', Date.now().toString())

      const response = await fetch(`/api/tournaments?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Failed to load tournaments')
      
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load tournaments',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTournaments = tournaments.filter(t => {
    // For pending tab, only show tournaments that are not approved
    if (viewFilter === 'pending') {
      if (t.approved) {
        return false
      }
    }
    // For managed tab, only show approved tournaments
    if (viewFilter === 'managed') {
      if (!t.approved) {
        return false
      }
    }
    // Apply upcoming filter client-side as well (for managed, my, team, and all tabs)
    if (upcomingOnly && viewFilter !== 'pending') {
      const now = new Date()
      const startTime = new Date(t.startTime)
      if (startTime <= now) {
        return false
      }
    }
    if (search) {
      const searchLower = search.toLowerCase()
      const nameMatch = t.name.toLowerCase().includes(searchLower)
      const descriptionMatch = t.description?.toLowerCase().includes(searchLower) || false
      if (!nameMatch && !descriptionMatch) {
        return false
      }
    }
    return true
  })

  // Helper to clean text by removing newlines and extra whitespace
  const cleanText = (s: string | null | undefined): string => {
    return (s ?? "").replace(/\s*\n\s*/g, " ").trim()
  }

  // Helper function to highlight search terms in text (exact copy from dev panel)
  const highlightText = (text: string | null | undefined, searchQuery: string): string | (string | JSX.Element)[] => {
    if (!text || !searchQuery) return text || ''
    
    const query = searchQuery.trim()
    if (!query) return text
    
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 text-foreground px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDateTime = (startDate: string, endDate: string, startTime: string, endTime: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      const dateStr = formatDate(startDate)
      const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`
      return { dateStr, timeStr, isMultiDay: false }
    } else {
      // For multi-day events, show start date/time and end date/time separately
      const startDateTime = `${formatDate(startDate)}, ${formatTime(startTime)}`
      const endDateTime = `${formatDate(endDate)}, ${formatTime(endTime)}`
      return { startDateTime, endDateTime, isMultiDay: true }
    }
  }

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
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tournaments</h1>
            <p className="text-muted-foreground">
              {viewFilter === 'my' 
                ? 'Tournaments you created' 
                : viewFilter === 'managed'
                ? 'Tournaments you manage (created or admin)'
                : viewFilter === 'team'
                ? 'Tournaments your team is registered for'
                : viewFilter === 'pending'
                ? 'Tournaments pending approval'
                : 'Discover and register for upcoming Science Olympiad tournaments'}
            </p>
          </div>
          {viewFilter === 'team' ? (
            <Button onClick={() => setViewFilter('all')} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search for Tournaments
            </Button>
          ) : (
            <Button onClick={() => router.push('/tournaments/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          )}
        </div>

        {/* Tab Bar */}
        <Tabs value={viewFilter} onValueChange={(value) => setViewFilter(value as 'all' | 'my' | 'managed' | 'team' | 'pending')} className="mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All Tournaments</TabsTrigger>
            <TabsTrigger value="managed">My Managed</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            <TabsTrigger value="team">Team Registrations</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10 shrink-0 will-change-transform" />
              <Input
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12"
              />
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="B">Division B</SelectItem>
                <SelectItem value="C">Division C</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={upcomingOnly ? 'outline' : 'default'}
              onClick={() => setUpcomingOnly(!upcomingOnly)}
              className="w-full sm:w-auto"
            >
              {upcomingOnly ? 'Show All' : 'Upcoming Only'}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</Label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 flex-1 sm:flex-none">
              <Select value={sortField} onValueChange={(value) => setSortField(value as any)}>
                <SelectTrigger className="text-sm h-9 w-full sm:w-auto min-w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={sortDirection} 
                onValueChange={(value) => setSortDirection(value as any)}
                key={sortField} // Reset when sort field changes
              >
                <SelectTrigger className="text-sm h-9 w-full sm:w-auto min-w-[140px]">
                  <SelectValue>
                    {sortField === 'date' && sortDirection === 'asc' && 'Earliest to Latest'}
                    {sortField === 'date' && sortDirection === 'desc' && 'Latest to Earliest'}
                    {sortField === 'price' && sortDirection === 'asc' && 'Least to Most Expensive'}
                    {sortField === 'price' && sortDirection === 'desc' && 'Most to Least Expensive'}
                    {sortField === 'popularity' && sortDirection === 'asc' && 'Least to Most Popular'}
                    {sortField === 'popularity' && sortDirection === 'desc' && 'Most to Least Popular'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    {sortField === 'date' && 'Earliest to Latest'}
                    {sortField === 'price' && 'Least to Most Expensive'}
                    {sortField === 'popularity' && 'Least to Most Popular'}
                  </SelectItem>
                  <SelectItem value="desc">
                    {sortField === 'date' && 'Latest to Earliest'}
                    {sortField === 'price' && 'Most to Least Expensive'}
                    {sortField === 'popularity' && 'Most to Least Popular'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tournament List */}
        {loading ? (
          <PageLoading title="Loading tournaments" description="Fetching tournament data..." />
        ) : filteredTournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground mb-4">
                {viewFilter === 'my'
                  ? 'You haven\'t created any tournaments yet'
                  : viewFilter === 'managed'
                  ? 'You don\'t manage any tournaments'
                  : viewFilter === 'team'
                  ? 'Your team isn\'t registered for any tournaments'
                  : viewFilter === 'pending'
                  ? 'You don\'t have any tournaments pending approval'
                  : search || divisionFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Be the first to create a tournament!'}
              </p>
              {viewFilter === 'team' ? (
                <Button onClick={() => setViewFilter('all')} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search for Tournaments
                </Button>
              ) : (viewFilter === 'my' || (viewFilter === 'all' && !search && divisionFilter === 'all')) ? (
                <Button onClick={() => router.push('/tournaments/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <Link href={`/tournaments/${tournament.id}`} className="flex-1 min-w-0">
                      <CardTitle className="text-xl hover:underline whitespace-normal [hyphens:auto] leading-snug">
                        {search ? highlightText(cleanText(tournament.name), search) : cleanText(tournament.name)}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={tournament.division === 'B' ? 'default' : 'secondary'}>
                        Division {tournament.division}
                      </Badge>
                      {!tournament.approved && (
                        <Badge 
                          variant="outline" 
                          className={tournament.rejectionReason 
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" 
                            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {tournament.rejectionReason ? 'Rejected' : 'Pending'}
                        </Badge>
                      )}
                      {(tournament.isCreator || tournament.isAdmin) ? (
                        <Link href={`/tournaments/${tournament.id}/manage`} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/tournaments/${tournament.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-7"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Sign Up
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  {tournament.rejectionReason && (
                    <div className="p-3 mb-2 border border-red-500/50 bg-red-500/10 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700 dark:text-red-300 whitespace-normal [hyphens:auto] leading-snug">
                            {search ? highlightText(cleanText(tournament.rejectionReason), search) : cleanText(tournament.rejectionReason)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.description && (
                    <Link href={`/tournaments/${tournament.id}`}>
                      <CardDescription className="line-clamp-2 overflow-hidden text-ellipsis whitespace-normal [hyphens:auto] leading-snug">
                        {search ? highlightText(cleanText(tournament.description), search) : cleanText(tournament.description)}
                      </CardDescription>
                    </Link>
                  )}
                </CardHeader>
                <Link href={`/tournaments/${tournament.id}`}>
                  <CardContent className="space-y-3">
                    {(() => {
                      const formatted = formatDateTime(
                        tournament.startDate, 
                        tournament.endDate, 
                        tournament.startTime, 
                        tournament.endTime
                      )
                      
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1">
                              {formatted.isMultiDay ? (
                                <div className="space-y-0.5">
                                  <div className="font-medium">
                                    <span className="text-muted-foreground">From: </span>
                                    {formatted.startDateTime}
                                  </div>
                                  <div className="font-medium">
                                    <span className="text-muted-foreground">To: </span>
                                    {formatted.endDateTime}
                                  </div>
                                </div>
                              ) : (
                                <div className="font-medium">
                                  {formatted.dateStr}, {formatted.timeStr}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    {tournament.isOnline ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        <span>Online Tournament</span>
                      </div>
                    ) : tournament.location ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{tournament.location}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {tournament.price === 0 ? 'Free' : `$${tournament.price.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{tournament._count.registrations} team{tournament._count.registrations !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {tournament.registrations && tournament.registrations.length > 0 && (
                      <div className="pt-2 space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Registered teams:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {tournament.registrations.slice(0, 6).map((reg) => (
                            <Badge key={reg.id} variant="secondary" className="text-xs">
                              {reg.club?.name 
                                ? (reg.team?.name ? `${reg.club.name} - ${reg.team.name}` : reg.club.name)
                                : (reg.team?.name || 'Unknown Team')}
                            </Badge>
                          ))}
                          {tournament.registrations.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{tournament.registrations.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

