'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Plus, X, Users } from 'lucide-react'

interface RosterTabProps {
  team: any
  currentMembership: any
  isCaptain: boolean
}

export function RosterTab({ team, currentMembership, isCaptain }: RosterTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [activeSubteamId, setActiveSubteamId] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState<string>('')

  // Set initial active subteam
  useEffect(() => {
    if (team.subteams.length > 0 && !activeSubteamId) {
      setActiveSubteamId(team.subteams[0].id)
    }
  }, [team.subteams, activeSubteamId])

  // Reset selected member when subteam changes
  useEffect(() => {
    setSelectedMember('')
  }, [activeSubteamId])

  useEffect(() => {
    fetchEvents()
  }, [team.id])

  // Update assignments whenever team memberships change
  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.memberships])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?division=${team.division}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchAssignments = async () => {
    // Get all assignments from memberships
    const allAssignments: any[] = []
    team.memberships.forEach((m: any) => {
      m.rosterAssignments.forEach((a: any) => {
        allAssignments.push({
          ...a,
          membership: m,
        })
      })
    })
    setAssignments(allAssignments)
  }

  const handleAddMember = async () => {
    if (!selectedEvent || !activeSubteamId || !selectedMember) return

    setLoading(true)
    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subteamId: activeSubteamId,
          membershipId: selectedMember,
          eventId: selectedEvent.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign member')
      }

      toast({
        title: 'Member assigned',
        description: `Added to ${selectedEvent.name}`,
      })

      // Refresh page to get updated data
      router.refresh()
      setAddDialogOpen(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (assignmentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/roster/${assignmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove member')

      toast({
        title: 'Member removed',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentsForEvent = (eventId: string, subteamId: string) => {
    return assignments.filter((a) => a.eventId === eventId && a.subteamId === subteamId)
  }

  const activeSubteam = team.subteams.find((s: any) => s.id === activeSubteamId)
  const activeSubteamMembers = team.memberships.filter((m: any) => m.subteamId === activeSubteamId)

  if (team.subteams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Roster - Division {team.division}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No teams yet. Create teams in the Teams tab to manage event rosters.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subteam Selector */}
      <div className="flex gap-2 flex-wrap">
        {team.subteams.map((subteam: any) => (
          <Button
            key={subteam.id}
            variant={activeSubteamId === subteam.id ? 'default' : 'outline'}
            onClick={() => setActiveSubteamId(subteam.id)}
          >
            {subteam.name}
            <Badge variant="secondary" className="ml-2">
              {subteam.members.length}
            </Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {activeSubteam?.name} Roster - Division {team.division}
            </CardTitle>
            <Badge variant="outline">
              {activeSubteamMembers.length} member{activeSubteamMembers.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const eventAssignments = getAssignmentsForEvent(event.id, activeSubteamId)
              const atCapacity = eventAssignments.length >= event.maxCompetitors

              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{event.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {eventAssignments.length}/{event.maxCompetitors}
                      </Badge>
                      {event.selfScheduled && (
                        <Badge variant="secondary" className="text-xs">
                          Self-Scheduled
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {eventAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-2 rounded-full bg-muted px-3 py-1"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignment.membership.user.image || ''} />
                            <AvatarFallback className="text-xs">
                              {assignment.membership.user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {assignment.membership.user.name || assignment.membership.user.email}
                          </span>
                          {isCaptain && (
                            <button
                              onClick={() => handleRemoveMember(assignment.id)}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {isCaptain && !atCapacity && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event)
                        setAddDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  {atCapacity && (
                    <Badge variant="secondary" className="mt-1">
                      Full
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog 
        open={addDialogOpen} 
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) setSelectedMember('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Member to {selectedEvent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">
                Team: <span className="font-semibold text-foreground">{activeSubteam?.name}</span>
              </Label>
            </div>
            <div>
              <Label>Select Member</Label>
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Choose a member...</option>
                {activeSubteamMembers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
              {activeSubteamMembers.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No members in this team. Assign members in the Teams tab.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={loading || !selectedMember}
            >
              {loading ? 'Adding...' : 'Add to Roster'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

