'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Users, Pencil, Trash2, ArrowLeft, X } from 'lucide-react'

interface PeopleTabProps {
  team: any
  currentMembership: any
  isCaptain: boolean
}

export function PeopleTab({ team, currentMembership, isCaptain }: PeopleTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Team management state
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [selectedMembership, setSelectedMembership] = useState<string>('')
  const [selectedTeamForAssign, setSelectedTeamForAssign] = useState<string>('')
  
  // Roster state
  const [events, setEvents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<string>('')

  useEffect(() => {
    fetchEvents()
    fetchAssignments()
  }, [team.id])

  useEffect(() => {
    setSelectedMember('')
  }, [selectedTeam])

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

  const fetchAssignments = () => {
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      })

      if (!response.ok) throw new Error('Failed to create team')

      toast({
        title: 'Team created',
        description: newTeamName,
      })

      setNewTeamName('')
      setCreateOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignMember = async () => {
    if (!selectedMembership) return

    setLoading(true)

    try {
      const response = await fetch(`/api/memberships/${selectedMembership}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subteamId: selectedTeamForAssign || null }),
      })

      if (!response.ok) throw new Error('Failed to assign member')

      toast({
        title: 'Member assigned',
      })

      setAssignOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeam) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams/${editingTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTeamName }),
      })

      if (!response.ok) throw new Error('Failed to update team')

      toast({
        title: 'Team updated',
        description: editTeamName,
      })

      setEditOpen(false)
      setEditingTeam(null)
      setEditTeamName('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async (subteam: any) => {
    if (!confirm(`Are you sure you want to delete "${subteam.name}"? Members will be unassigned but not removed from the club.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams/${subteam.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete team')

      toast({
        title: 'Team deleted',
        description: subteam.name,
      })

      if (selectedTeam?.id === subteam.id) {
        setSelectedTeam(null)
      }
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (subteam: any) => {
    setEditingTeam(subteam)
    setEditTeamName(subteam.name)
    setEditOpen(true)
  }

  const handleAddMemberToEvent = async () => {
    if (!selectedEvent || !selectedTeam || !selectedMember) return

    setLoading(true)
    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subteamId: selectedTeam.id,
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

  const handleRemoveMemberFromEvent = async (assignmentId: string) => {
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

  const teamMembers = selectedTeam ? team.memberships.filter((m: any) => m.subteamId === selectedTeam.id) : []
  const unassignedMembers = team.memberships.filter((m: any) => !m.subteamId)

  // Team Grid View
  if (!selectedTeam) {
    return (
      <div className="space-y-6">
        {isCaptain && (
          <div className="flex gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Assignments
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {team.subteams.map((subteam: any) => (
            <Card 
              key={subteam.id}
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
              onClick={() => setSelectedTeam(subteam)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {subteam.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({subteam.members.length} / 15)
                    </span>
                  </CardTitle>
                  {isCaptain && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(subteam)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTeam(subteam)
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subteam.members.slice(0, 5).map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || ''} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm">
                        <p className="font-medium truncate">{member.user.name || member.user.email}</p>
                      </div>
                    </div>
                  ))}
                  {subteam.members.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      +{subteam.members.length - 5} more
                    </p>
                  )}
                  {subteam.members.length === 0 && (
                    <p className="text-sm text-muted-foreground">No members assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {unassignedMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unassignedMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-full border px-3 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.user.image || ''} />
                      <AvatarFallback className="text-xs">
                        {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.user.name || member.user.email}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Team Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <form onSubmit={handleCreateTeam}>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Team A"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !newTeamName}>
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Member Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Member Assignments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Member</Label>
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={selectedMembership}
                  onChange={(e) => setSelectedMembership(e.target.value)}
                >
                  <option value="">Select member</option>
                  {team.memberships.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.user.name || m.user.email} {m.subteam && `(${m.subteam.name})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Assign to Team</Label>
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={selectedTeamForAssign}
                  onChange={(e) => setSelectedTeamForAssign(e.target.value)}
                >
                  <option value="">No team (unassign)</option>
                  {team.subteams.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignMember} disabled={loading || !selectedMembership}>
                {loading ? 'Updating...' : 'Update Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <form onSubmit={handleEditTeam}>
              <DialogHeader>
                <DialogTitle>Edit Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Team Name</Label>
                  <Input
                    id="edit-name"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="e.g., Team A"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !editTeamName}>
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Roster View for Selected Team
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{selectedTeam.name} Roster</h2>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} • Division {team.division}
          </p>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No members in this team yet.</p>
            <p className="text-sm mt-2">Assign members from the Teams view or use "Manage Assignments".</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Event Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => {
                const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
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
                                onClick={() => handleRemoveMemberFromEvent(assignment.id)}
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
      )}

      {/* Add Member to Event Dialog */}
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
                Team: <span className="font-semibold text-foreground">{selectedTeam?.name}</span>
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
                {teamMembers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
              {teamMembers.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No members in this team. Assign members in the Teams view.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMemberToEvent}
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

