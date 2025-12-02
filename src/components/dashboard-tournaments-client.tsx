'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppHeader } from '@/components/app-header'
import { useToast } from '@/components/ui/use-toast'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Search, Calendar, MapPin, Users, DollarSign, Trophy, Settings, Monitor, Info } from 'lucide-react'
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

interface DashboardTournamentsClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function DashboardTournamentsClient({ user }: DashboardTournamentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize with default values (same on server and client to avoid hydration errors)
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const [sortField, setSortField] = useState<'date' | 'price' | 'popularity'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  
  // Helper to get localStorage key
  const getStorageKey = () => `dashboard-tournaments-filters`
  
  // Load filters from localStorage (client-side only)
  const loadFiltersFromStorage = () => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(getStorageKey())
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          search: parsed.search || '',
          divisionFilter: parsed.divisionFilter || 'all',
          upcomingOnly: parsed.upcomingOnly !== undefined ? parsed.upcomingOnly : true,
          sortField: parsed.sortField || 'date',
          sortDirection: parsed.sortDirection || 'asc',
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return null
  }
  
  // Load filters from localStorage on mount (client-side only)
  useEffect(() => {
    if (!filtersLoaded) {
      const storedFilters = loadFiltersFromStorage()
      if (storedFilters) {
        setSearch(storedFilters.search)
        setDivisionFilter(storedFilters.divisionFilter)
        setUpcomingOnly(storedFilters.upcomingOnly)
        setSortField(storedFilters.sortField)
        setSortDirection(storedFilters.sortDirection)
      }
      setFiltersLoaded(true)
    }
  }, [filtersLoaded])
  
  // Save filters to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (filtersLoaded && typeof window !== 'undefined') {
      const filters = {
        search,
        divisionFilter,
        upcomingOnly,
        sortField,
        sortDirection,
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(filters))
    }
  }, [search, divisionFilter, upcomingOnly, sortField, sortDirection, filtersLoaded])

  useEffect(() => {
    loadTournaments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionFilter, upcomingOnly, sortField, sortDirection])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (divisionFilter !== 'all') {
        params.append('division', divisionFilter)
      }
      // Only add upcoming filter when it's true
      if (upcomingOnly) {
        params.append('upcoming', 'true')
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
    // Only show approved tournaments
    if (!t.approved) {
      return false
    }
    // Apply upcoming filter client-side as well
    if (upcomingOnly) {
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

  // Helper function to highlight search terms in text
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern">
      <AppHeader user={user} />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tournaments</h1>
            <p className="text-muted-foreground">
              Discover and register for upcoming Science Olympiad tournaments
            </p>
          </div>
        </div>

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
                {search || divisionFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No upcoming tournaments at this time'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        Division {tournament.division}
                      </Badge>
                    </div>
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
                          <Info className="h-3 w-3 mr-1" />
                          More Info
                        </Button>
                      </Link>
                    )}
                  </div>
                  <Link href={`/tournaments/${tournament.id}`} className="block">
                    <CardTitle className="text-xl hover:underline break-words leading-snug">
                      {search ? highlightText(cleanText(tournament.name), search) : cleanText(tournament.name)}
                    </CardTitle>
                  </Link>
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

