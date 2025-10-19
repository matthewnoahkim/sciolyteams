'use client'

import { useState, useEffect } from 'react'
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
import { Plus, X, AlertCircle } from 'lucide-react'

interface RosterTabProps {
  team: any
  currentMembership: any
  isCaptain: boolean
}

export function RosterTab({ team, currentMembership, isCaptain }: RosterTabProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedSubteam, setSelectedSubteam] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState<string>('')

  useEffect(() => {
    fetchEvents()
    fetchAssignments()
  }, [team.id])

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
    if (!selectedEvent || !selectedSubteam || !selectedMember) return

    setLoading(true)
    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subteamId: selectedSubteam,
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
      window.location.reload()
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

      window.location.reload()
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

  const getAssignmentsForEvent = (eventId: string) => {
    return assignments.filter((a) => a.eventId === eventId)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Roster - Division {team.division}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => {
              const eventAssignments = getAssignmentsForEvent(event.id)
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Subteam</Label>
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={selectedSubteam}
                onChange={(e) => {
                  setSelectedSubteam(e.target.value)
                  setSelectedMember('')
                }}
              >
                <option value="">Select subteam</option>
                {team.subteams.map((subteam: any) => (
                  <option key={subteam.id} value={subteam.id}>
                    {subteam.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSubteam && (
              <div>
                <Label>Member</Label>
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="">Select member</option>
                  {team.memberships
                    .filter((m: any) => m.subteamId === selectedSubteam)
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={loading || !selectedMember}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

