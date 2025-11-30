'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AppHeader } from '@/components/app-header'
import { useToast } from '@/components/ui/use-toast'
import { PageLoading } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Settings, Trophy, CheckCircle2, Plus, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { groupEventsByCategory, categoryOrder, type EventCategory } from '@/lib/event-categories'

interface Tournament {
  id: string
  name: string
  division: 'B' | 'C'
  description: string | null
  price: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  registrations?: Array<{
    id: string
    team: {
      id: string
      name: string
    } | null
  }>
  _count: {
    registrations: number
  }
  isAdmin: boolean
}

interface Team {
  id: string
  name: string
  division: 'B' | 'C'
  teams?: Array<{
    id: string
    name: string
  }>
}

interface Event {
  id: string
  name: string
  slug: string
}

interface TournamentDetailClientProps {
  tournamentId: string
  userTeams: Team[]
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function TournamentDetailClient({ tournamentId, userTeams, user }: TournamentDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [signupDialogOpen, setSignupDialogOpen] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<Array<{ clubId: string; subclubId?: string; subclubIds?: string[]; eventIds: string[] }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [registeredTeams, setRegisteredTeams] = useState<Array<{ id: string; clubId: string; subclubId?: string | null; teamName: string | null }>>([])
  const [totalRegisteredSubteams, setTotalRegisteredSubteams] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [deregisterDialogOpen, setDeregisterDialogOpen] = useState(false)
  const [registrationToDeregister, setRegistrationToDeregister] = useState<{ id: string; teamName: string | null } | null>(null)
  const [deregistering, setDeregistering] = useState(false)

  useEffect(() => {
    loadTournament()
    loadEvents()
  }, [])

  const loadTournament = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      if (!response.ok) throw new Error('Failed to load tournament')
      
      const data = await response.json()
      // Ensure registrations array is included
      const tournamentData = {
        ...data.tournament,
        registrations: data.tournament.registrations || [],
      }
      setTournament(tournamentData)
      // Track which of user's teams are registered
      const userRegisteredTeams = (tournamentData.registrations || [])
        .filter((r: any) => userTeams.some(t => t.id === r.clubId))
        .map((r: any) => ({
          id: r.id,
          clubId: r.clubId,
          subclubId: r.subclubId || null,
          teamName: r.team?.name || null,
        }))
      setRegisteredTeams(userRegisteredTeams)
      
      // Calculate total teams registered and total cost
      const totalSubteams = userRegisteredTeams.length
      const calculatedCost = totalSubteams * (data.tournament.price || 0)
      setTotalRegisteredSubteams(totalSubteams)
      setTotalCost(calculatedCost)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load tournament',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      if (!tournament) return
      const response = await fetch(`/api/events?division=${tournament.division}`)
      if (!response.ok) throw new Error('Failed to load events')
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error: any) {
      console.error('Failed to load events:', error)
    }
  }

  useEffect(() => {
    if (tournament) {
      loadEvents()
    }
  }, [tournament])

  const addTeam = () => {
    setSelectedTeams([...selectedTeams, { clubId: '', subclubId: undefined, subclubIds: undefined, eventIds: [] }])
  }

  const removeTeam = (index: number) => {
    setSelectedTeams(selectedTeams.filter((_, i) => i !== index))
  }

  const updateTeam = (index: number, updates: Partial<{ clubId: string; subclubId?: string; subclubIds?: string[]; eventIds: string[] }>) => {
    const updated = [...selectedTeams]
    updated[index] = { ...updated[index], ...updates }
    setSelectedTeams(updated)
  }

  const handleSignup = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one team to register',
        variant: 'destructive',
      })
      return
    }

    // Validate all teams have clubId, subclubId (if team has teams), and at least one event
    for (const team of selectedTeams) {
      if (!team.clubId) {
        toast({
          title: 'Error',
          description: 'Please select a team for all entries',
          variant: 'destructive',
        })
        return
      }
      
      // Check if team has teams - teams are required for tournament registration
      const teamData = filteredTeams.find(t => t.id === team.clubId)
      if (!teamData?.teams || teamData.teams.length === 0) {
        toast({
          title: 'Error',
          description: `${teamData?.name || 'This team'} must have at least one team to register for tournaments. Please create a team first.`,
          variant: 'destructive',
        })
        return
      }
      
      // Require at least one subclubId in subclubIds
      if (!team.subclubIds || team.subclubIds.length === 0) {
        toast({
          title: 'Error',
          description: `Please select at least one team for ${teamData.name}`,
          variant: 'destructive',
        })
        return
      }
      
      if (team.eventIds.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one event for each team',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setSubmitting(true)
      
      // Build registrations array - one per team/team combination
      const registrations: Array<{ clubId: string; subclubId?: string; eventIds: string[] }> = []
      
      for (const team of selectedTeams) {
        const teamData = filteredTeams.find(t => t.id === team.clubId)
        
        if (teamData?.teams && teamData.teams.length > 0 && team.subclubIds && team.subclubIds.length > 0) {
          // Has teams selected - create one registration per selected team
          for (const subclubId of team.subclubIds) {
            registrations.push({
              clubId: team.clubId,
              subclubId: subclubId,
              eventIds: team.eventIds,
            })
          }
        } else {
          // No teams or no teams selected - single registration without subclubId
          registrations.push({
            clubId: team.clubId,
            subclubId: undefined, // Explicitly set to undefined for teams without teams
            eventIds: team.eventIds,
          })
        }
      }
      
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrations,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to register')
      }

      const totalRegistrations = registrations.length
      toast({
        title: 'Success',
        description: `${totalRegistrations} registration${totalRegistrations > 1 ? 's' : ''} created successfully!`,
      })
      setSignupDialogOpen(false)
      setSelectedTeams([])
      loadTournament()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
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

  const filteredTeams = userTeams.filter(t => !tournament || t.division === tournament.division)
  const groupedEvents = tournament ? groupEventsByCategory(events, tournament.division) : {} as Record<EventCategory, any[]>

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader user={user} />
        <PageLoading title="Loading tournament" description="Fetching tournament details..." />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Tournament not found</h3>
              <Button onClick={() => router.push('/tournaments')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournaments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button onClick={() => router.push('/tournaments')} variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{tournament.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={tournament.division === 'B' ? 'default' : 'secondary'}>
                        Division {tournament.division}
                      </Badge>
                      {tournament.isAdmin && (
                        <Link href={`/tournaments/${tournamentId}/manage`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">{tournament.description}</p>
                )}
                
                <div className="grid gap-4 pt-4 border-t">
                  {(() => {
                    const formatted = formatDateTime(
                      tournament.startDate,
                      tournament.endDate,
                      tournament.startTime,
                      tournament.endTime
                    )
                    
                    return (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          {formatted.isMultiDay ? (
                            <div className="space-y-0.5">
                              <p className="font-medium leading-tight">{formatted.startDateTime}</p>
                              <p className="font-medium leading-tight">{formatted.endDateTime}</p>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium leading-tight">{formatted.dateStr}</p>
                              <p className="text-sm text-muted-foreground">{formatted.timeStr}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                  
                  {tournament.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">{tournament.location}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">
                      {tournament.price === 0 ? 'Free' : `$${tournament.price.toFixed(2)}`}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        {tournament._count.registrations} team{tournament._count.registrations !== 1 ? 's' : ''} registered
                      </p>
                      {tournament.registrations && tournament.registrations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tournament.registrations.map((reg) => (
                            <Badge key={reg.id} variant="secondary" className="text-xs">
                              {reg.team?.name || 'Unknown Team'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTeams.length === 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You don&apos;t have admin access to any {tournament.division} division teams. Only team admins can register teams for tournaments.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registeredTeams.length > 0 && (
                      <>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Registered Teams:</p>
                          {registeredTeams.map((reg, idx) => (
                            <div key={reg.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>
                                  {reg.teamName}
                                  {reg.teamName && ` - ${reg.teamName}`}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRegistrationToDeregister({
                                    id: reg.id,
                                    teamName: reg.teamName || null,
                                  })
                                  setDeregisterDialogOpen(true)
                                }}
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Subteams:</span>
                            <span className="font-medium">{totalRegisteredSubteams}</span>
                          </div>
                          {tournament.price > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Total Cost:</span>
                              <span className="font-medium">${totalCost.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    <Button 
                      onClick={() => {
                        // Pre-populate with teams that aren't registered yet
                        const unregisteredTeams = filteredTeams.filter(t => 
                          !registeredTeams.some(r => r.clubId === t.id && !r.subclubId)
                        )
                        if (unregisteredTeams.length > 0) {
                          setSelectedTeams([{ clubId: unregisteredTeams[0].id, subclubId: undefined, subclubIds: undefined, eventIds: [] }])
                        } else {
                          setSelectedTeams([{ clubId: '', subclubId: undefined, subclubIds: undefined, eventIds: [] }])
                        }
                        setSignupDialogOpen(true)
                      }} 
                      className="w-full"
                      variant={registeredTeams.length > 0 ? 'outline' : 'default'}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      {registeredTeams.length > 0 ? 'Register More Teams' : `Sign Up Your Team${filteredTeams.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signup Dialog */}
        <Dialog open={signupDialogOpen} onOpenChange={setSignupDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register for {tournament.name}</DialogTitle>
              <DialogDescription>
                Register one or more teams and select the events for each team.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {selectedTeams.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No teams added yet</p>
                  <Button onClick={addTeam} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                  </Button>
                </div>
              )}

              {selectedTeams.map((teamReg, index) => {
                const selectedTeam = filteredTeams.find(t => t.id === teamReg.clubId)
                const hasSubteams = selectedTeam?.teams && selectedTeam.teams.length > 0
                
                // Get already registered team IDs for this team
                const alreadyRegisteredSubclubIds = new Set(
                  tournament.registrations
                    ?.filter((r: any) => r.clubId === teamReg.clubId && r.subclubId)
                    .map((r: any) => r.subclubId) || []
                )

                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold">Team {index + 1}</h3>
                      {selectedTeams.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeam(index)}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Select Team</label>
                        <Select
                          value={teamReg.clubId}
                          onValueChange={(value) => {
                            updateTeam(index, { clubId: value, subclubId: undefined, eventIds: [] })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a team" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredTeams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {teamReg.clubId && (
                        <div>
                          {hasSubteams ? (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium block">
                                  Select Subteam{selectedTeam?.teams && selectedTeam.teams.length > 1 ? 's' : ''} <span className="text-destructive">*</span>
                                </label>
                                {selectedTeam?.teams && selectedTeam.teams.length > 1 && (() => {
                                  // Only get teams that aren't already registered
                                  const availableSubclubIds = selectedTeam.teams
                                    ?.filter(s => !alreadyRegisteredSubclubIds.has(s.id))
                                    .map(s => s.id) || []
                                  const allSelected = availableSubclubIds.every(id => teamReg.subclubIds?.includes(id))
                                  return (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        updateTeam(index, { 
                                          subclubIds: allSelected ? [] : availableSubclubIds,
                                          subclubId: undefined
                                        })
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      {allSelected ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  )
                                })()}
                              </div>
                              {alreadyRegisteredSubclubIds.size > 0 && (
                                <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                      {alreadyRegisteredSubclubIds.size} team{alreadyRegisteredSubclubIds.size !== 1 ? 's' : ''} already registered for this tournament
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2 border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                                {selectedTeam?.teams?.map(team => {
                                  const isSelected = teamReg.subclubIds?.includes(team.id) || false
                                  const isAlreadyRegistered = alreadyRegisteredSubclubIds.has(team.id)
                                  return (
                                    <div key={team.id} className="flex items-center justify-between space-x-2">
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Checkbox
                                          id={`${index}-team-${team.id}`}
                                          checked={isSelected}
                                          disabled={isAlreadyRegistered}
                                          onCheckedChange={(checked) => {
                                            if (isAlreadyRegistered) return
                                            const currentSubclubIds = teamReg.subclubIds || []
                                            const newSubclubIds = checked
                                              ? [...currentSubclubIds, team.id]
                                              : currentSubclubIds.filter(id => id !== team.id)
                                            updateTeam(index, { subclubIds: newSubclubIds, subclubId: undefined })
                                          }}
                                        />
                                        <label
                                          htmlFor={`${index}-team-${team.id}`}
                                          className={`text-sm font-medium leading-none cursor-pointer ${
                                            isAlreadyRegistered 
                                              ? 'opacity-50 cursor-not-allowed' 
                                              : 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                          }`}
                                        >
                                          {team.name}
                                        </label>
                                      </div>
                                      {isAlreadyRegistered && (
                                        <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Already Registered
                                        </Badge>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="border rounded-lg p-4 bg-destructive/10 border-destructive/20">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1 text-destructive">Subteams Required</p>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    This team must have at least one team to register for tournaments. Please create a team first.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      router.push(`/club/${teamReg.clubId}?tab=people`)
                                      setSignupDialogOpen(false)
                                    }}
                                  >
                                    Create Subteam
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {teamReg.clubId && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium block">Select Events for This Team</label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const allEventIds = events.map(e => e.id)
                                const allSelected = allEventIds.every(id => teamReg.eventIds.includes(id))
                                updateTeam(index, { 
                                  eventIds: allSelected ? [] : allEventIds 
                                })
                              }}
                              className="h-7 text-xs"
                            >
                              {events.every(e => teamReg.eventIds.includes(e.id)) ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                            {categoryOrder.map(category => {
                              const categoryEvents = groupedEvents[category] || []
                              if (categoryEvents.length === 0) return null
                              
                              return (
                                <div key={category}>
                                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
                                  <div className="space-y-2">
                                    {categoryEvents.map(event => (
                                      <div key={event.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`${index}-${event.id}`}
                                          checked={teamReg.eventIds.includes(event.id)}
                                          onCheckedChange={(checked) => {
                                            const newEventIds = checked
                                              ? [...teamReg.eventIds, event.id]
                                              : teamReg.eventIds.filter(id => id !== event.id)
                                            updateTeam(index, { eventIds: newEventIds })
                                          }}
                                        />
                                        <label
                                          htmlFor={`${index}-${event.id}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          {event.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}

              <Button onClick={addTeam} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Team
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSignupDialogOpen(false)
                setSelectedTeams([])
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleSignup}
                disabled={
                  submitting || 
                  selectedTeams.length === 0 || 
                  selectedTeams.some(t => {
                    if (!t.clubId || t.eventIds.length === 0) return true
                    // Check if team has teams - teams are required
                    const teamData = filteredTeams.find(team => team.id === t.clubId)
                    // Team must have teams to register
                    if (!teamData?.teams || teamData.teams.length === 0) return true
                    // Require at least one team in subclubIds
                    if (!t.subclubIds || t.subclubIds.length === 0) return true
                    return false
                  })
                }
              >
                {submitting ? 'Registering...' : `Register ${selectedTeams.length} Team${selectedTeams.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deregister Confirmation Dialog */}
        <Dialog open={deregisterDialogOpen} onOpenChange={setDeregisterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deregister Team</DialogTitle>
              <DialogDescription>
                Are you sure you want to deregister{' '}
                <span className="font-medium">
                  {registrationToDeregister?.teamName}
                  {registrationToDeregister?.teamName && ` - ${registrationToDeregister.teamName}`}
                </span>{' '}
                from this tournament? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeregisterDialogOpen(false)
                  setRegistrationToDeregister(null)
                }}
                disabled={deregistering}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!registrationToDeregister) return

                  try {
                    setDeregistering(true)
                    const response = await fetch(`/api/tournaments/${tournamentId}/register/${registrationToDeregister.id}`, {
                      method: 'DELETE',
                    })

                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.error || 'Failed to deregister')
                    }

                    toast({
                      title: 'Success',
                      description: 'Team deregistered successfully',
                    })
                    
                    setDeregisterDialogOpen(false)
                    setRegistrationToDeregister(null)
                    
                    // Reload tournament data to update the list
                    loadTournament()
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.message || 'Failed to deregister',
                      variant: 'destructive',
                    })
                  } finally {
                    setDeregistering(false)
                  }
                }}
                disabled={deregistering}
              >
                {deregistering ? 'Deregistering...' : 'Deregister'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

