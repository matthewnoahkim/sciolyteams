'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Users, Pencil, Trash2, ArrowLeft, X, Grid3x3, Layers, MoreVertical, FileSpreadsheet } from 'lucide-react'
import { groupEventsByCategory, categoryOrder, type EventCategory } from '@/lib/event-categories'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [editTeamName, setEditTeamName] = useState('')
  
  // Roster state
  const [events, setEvents] = useState<any[]>([])
  const [conflictGroups, setConflictGroups] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [sortBy, setSortBy] = useState<'category' | 'conflict'>('category')
  const [contextMenuMember, setContextMenuMember] = useState<any>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<any>(null)
  const [memberSortBy, setMemberSortBy] = useState<'alphabetical' | 'events' | 'team' | 'role'>('alphabetical')
  const [memberSortDirection, setMemberSortDirection] = useState<'low-to-high' | 'high-to-low'>('low-to-high')

  useEffect(() => {
    fetchEvents()
    fetchConflictGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id])

  // Update assignments whenever team memberships change
  useEffect(() => {
    fetchAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.memberships])

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

  const fetchConflictGroups = async () => {
    try {
      const response = await fetch(`/api/conflicts?division=${team.division}`)
      if (response.ok) {
        const data = await response.json()
        setConflictGroups(data.conflictGroups || [])
      }
    } catch (error) {
      console.error('Failed to fetch conflict groups:', error)
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

  const openDeleteDialog = (subteam: any) => {
    setTeamToDelete(subteam)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams/${teamToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete team')
      }

      toast({
        title: 'Team deleted',
        description: `${teamToDelete.name} has been deleted`,
      })

      // If current selected team was deleted, go back to grid view
      if (selectedTeam && selectedTeam.id === teamToDelete.id) {
        setSelectedTeam(null)
      }

      setTeamToDelete(null)
      setDeleteDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
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

  const getAvailableEventsForMember = (member: any) => {
    if (!selectedTeam) return []
    
    const memberAssignments = assignments.filter((a) => a.membership.id === member.id && a.subteamId === selectedTeam.id)
    const assignedEventIds = memberAssignments.map((a) => a.eventId)
    
    // Get conflict groups that the member's assigned events belong to
    const memberConflictEventIds = new Set<string>()
    
    memberAssignments.forEach((assignment) => {
      conflictGroups.forEach((group) => {
        const eventInGroup = group.events.find((e: any) => e.eventId === assignment.eventId)
        if (eventInGroup) {
          // Add all events in this conflict group
          group.events.forEach((e: any) => {
            if (e.eventId !== assignment.eventId) {
              memberConflictEventIds.add(e.eventId)
            }
          })
        }
      })
    })
    
    // Filter available events
    return events.filter((event) => {
      // Already assigned
      if (assignedEventIds.includes(event.id)) return false
      
      // Would conflict with existing assignment
      if (memberConflictEventIds.has(event.id)) return false
      
      // Check capacity
      const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
      if (eventAssignments.length >= event.maxCompetitors) return false
      
      return true
    })
  }

  const getAvailableMembersForEvent = (event: any) => {
    if (!selectedTeam) return []
    
    const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
    const assignedMemberIds = eventAssignments.map((a) => a.membership.id)
    
    // Get conflict group for this event
    const eventConflictGroup = conflictGroups.find((group) =>
      group.events.some((e: any) => e.eventId === event.id)
    )
    
    return teamMembers.filter((member: any) => {
      // Already assigned to this event
      if (assignedMemberIds.includes(member.id)) return false
      
      // Check if member has conflicts
      if (eventConflictGroup) {
        const memberAssignments = assignments.filter(
          (a) => a.membership.id === member.id && a.subteamId === selectedTeam.id
        )
        
        // Check if any of member's assignments conflict with this event
        for (const assignment of memberAssignments) {
          const hasConflict = eventConflictGroup.events.some(
            (e: any) => e.eventId === assignment.eventId
          )
          if (hasConflict) return false
        }
      }
      
      return true
    })
  }

  const handleAssignToTeamFromMenu = async (membershipId: string, subteamId: string | null, memberName: string) => {
    // Check if target team is at capacity (15 members)
    if (subteamId) {
      const targetTeam = team.subteams.find((s: any) => s.id === subteamId)
      if (targetTeam && targetTeam.members.length >= 15) {
        toast({
          title: 'Team at capacity',
          description: `${targetTeam.name} already has 15 members`,
          variant: 'destructive',
        })
        setContextMenuOpen(false)
        return
      }
    }

    setLoading(true)
    setContextMenuOpen(false)

    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subteamId }),
      })

      if (!response.ok) throw new Error('Failed to assign member')

      const teamName = subteamId 
        ? team.subteams.find((s: any) => s.id === subteamId)?.name 
        : 'Unassigned'

      toast({
        title: 'Member assigned',
        description: `${memberName} moved to ${teamName}`,
      })

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

  const handleAssignToEventFromMenu = async (membershipId: string, eventId: string, memberName: string, eventName: string) => {
    if (!selectedTeam) return

    setLoading(true)
    setContextMenuOpen(false)

    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subteamId: selectedTeam.id,
          membershipId,
          eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign member')
      }

      toast({
        title: 'Member assigned',
        description: `${memberName} added to ${eventName}`,
      })

      router.refresh()
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

  const handleExportToGoogleSheet = () => {
    // Generate CSV data for rosters
    let csvContent = "data:text/csv;charset=utf-8,"
    
    // Add header
    csvContent += `${team.name} - Event Rosters\n\n`
    
    // For each subteam
    team.subteams.forEach((subteam: any) => {
      csvContent += `\nTeam: ${subteam.name}\n`
      csvContent += "Event,Member 1,Member 2,Member 3\n"
      
      // Get events and assignments for this subteam
      events.forEach((event: any) => {
        const eventAssignments = assignments.filter(
          (a) => a.eventId === event.id && a.subteamId === subteam.id
        )
        
        if (eventAssignments.length > 0) {
          const memberNames = eventAssignments.map(
            (a) => a.membership.user.name || a.membership.user.email
          )
          csvContent += `"${event.name}",${memberNames.join(',')}\n`
        }
      })
    })
    
    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${team.name}-rosters.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Rosters exported',
      description: 'CSV file downloaded. You can import this into Google Sheets.',
    })
  }

  const teamMembers = selectedTeam ? team.memberships.filter((m: any) => m.subteamId === selectedTeam.id) : []
  const unassignedMembers = team.memberships.filter((m: any) => !m.subteamId)

  // Get event counts for all members
  const getAllMemberEventCounts = () => {
    const counts: Record<string, number> = {}
    team.memberships.forEach((member: any) => {
      counts[member.id] = member.rosterAssignments?.length || 0
    })
    return counts
  }

  // Sort all members
  const getSortedMembers = () => {
    const eventCounts = getAllMemberEventCounts()
    let sorted = [...team.memberships]
    const isReversed = memberSortDirection === 'high-to-low'

    switch (memberSortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => {
          const nameA = (a.user.name || a.user.email).toLowerCase()
          const nameB = (b.user.name || b.user.email).toLowerCase()
          const result = nameA.localeCompare(nameB)
          return isReversed ? -result : result
        })
        break
      case 'events':
        sorted.sort((a, b) => {
          const result = (eventCounts[a.id] || 0) - (eventCounts[b.id] || 0)
          return isReversed ? -result : result
        })
        break
      case 'team':
        // Sort by team creation order (using subteam array index as proxy for creation order)
        sorted.sort((a, b) => {
          const getTeamOrder = (member: any) => {
            if (!member.subteamId) return team.subteams.length // Unassigned goes last
            return team.subteams.findIndex((st: any) => st.id === member.subteamId)
          }
          const result = getTeamOrder(a) - getTeamOrder(b)
          return isReversed ? -result : result
        })
        break
      case 'role':
        sorted.sort((a, b) => {
          const getRoleOrder = (role: string) => {
            const upperRole = role?.toUpperCase()
            if (upperRole === 'CAPTAIN') return 0
            if (upperRole === 'MEMBER') return 1
            return 2
          }
          const result = getRoleOrder(a.role) - getRoleOrder(b.role)
          return isReversed ? -result : result
        })
        break
    }

    return sorted
  }

  // Render Team Grid View
  const renderGridView = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {isCaptain && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          )}
          <Button variant="outline" onClick={handleExportToGoogleSheet} className="ml-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {team.subteams.map((subteam: any) => (
            <Card 
              key={subteam.id}
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) {
                  setSelectedTeam(subteam)
                }
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {subteam.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({subteam.members.length} / 15)
                  </span>
                </CardTitle>
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
            ))
          }
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>All Club Members</CardTitle>
                {isCaptain && (
                  <p className="text-sm text-muted-foreground">
                    Click members to assign them to teams
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Sort by:</Label>
                  <select
                    className="rounded-md border p-2 text-sm"
                    value={memberSortBy}
                    onChange={(e) => setMemberSortBy(e.target.value as any)}
                  >
                    <option value="alphabetical">Alphabetical</option>
                    <option value="role">Role</option>
                    <option value="team">Team</option>
                    <option value="events">Number of Events</option>
                  </select>
                </div>
                <select
                  className="rounded-md border p-2 text-sm"
                  value={memberSortDirection}
                  onChange={(e) => setMemberSortDirection(e.target.value as any)}
                >
                  <option value="low-to-high">Low to High</option>
                  <option value="high-to-low">High to Low</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getSortedMembers().map((member: any) => {
                const eventCount = member.rosterAssignments?.length || 0
                return (
                  <DropdownMenu key={member.id} open={contextMenuMember?.id === member.id && contextMenuOpen} onOpenChange={(open: boolean) => {
                    if (!open) setContextMenuMember(null)
                    setContextMenuOpen(open)
                  }}>
                    <DropdownMenuTrigger asChild>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          if (isCaptain && !loading) {
                            e.preventDefault()
                            setContextMenuMember(member)
                            setContextMenuOpen(true)
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user.image || ''} />
                            <AvatarFallback>
                              {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name || member.user.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant={member.role === 'CAPTAIN' ? 'default' : 'secondary'} className="text-xs">
                                {member.role === 'CAPTAIN' ? 'Captain' : 'Member'}
                              </Badge>
                              {member.subteam ? (
                                <span>• {member.subteam.name}</span>
                              ) : (
                                <span>• Unassigned</span>
                              )}
                              <span>• {eventCount} event{eventCount !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    {isCaptain && contextMenuMember?.id === member.id && (
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Assign to Team</DropdownMenuLabel>
                        {team.subteams
                          .filter((s: any) => s.id !== member.subteamId && s.members.length < 15)
                          .map((subteam: any) => (
                            <DropdownMenuItem
                              key={subteam.id}
                              onClick={() => handleAssignToTeamFromMenu(member.id, subteam.id, member.user.name || member.user.email)}
                            >
                              {subteam.name} ({subteam.members.length}/15)
                            </DropdownMenuItem>
                          ))
                        }
                        {team.subteams.filter((s: any) => s.id !== member.subteamId && s.members.length < 15).length === 0 && (
                          <DropdownMenuItem disabled>
                            No available teams
                          </DropdownMenuItem>
                        )}
                        {member.subteamId && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAssignToTeamFromMenu(member.id, null, member.user.name || member.user.email)}
                            >
                              Unassign from team
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )

  // Calculate event participation counts
  const getMemberEventCounts = () => {
    const counts: Record<string, number> = {}
    teamMembers.forEach((member: any) => {
      counts[member.id] = assignments.filter(
        (a) => a.membership.id === member.id && a.subteamId === selectedTeam.id
      ).length
    })
    return counts
  }

  const groupedEvents = sortBy === 'category' 
    ? groupEventsByCategory(events, team.division)
    : null

  const groupedByConflict = sortBy === 'conflict'
    ? (() => {
        const grouped = conflictGroups.reduce((acc: any, group: any) => {
          acc[group.name] = events.filter((e: any) => 
            group.events.some((ge: any) => ge.eventId === e.id)
          )
          return acc
        }, {})
        
        // Add self-scheduled events as a separate group
        const selfScheduledEvents = events.filter((e: any) => e.selfScheduled)
        if (selfScheduledEvents.length > 0) {
          grouped['Self-Scheduled Events'] = selfScheduledEvents
        }
        
        return grouped
      })()
    : null

  const eventCounts = getMemberEventCounts()

  // Render Roster View for Selected Team
  const renderRosterView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
            <p className="text-sm text-muted-foreground">
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} • Division {team.division}
            </p>
          </div>
          {isCaptain && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(selectedTeam)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Name
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openDeleteDialog(selectedTeam)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('category')}
          >
            <Layers className="mr-2 h-4 w-4" />
            Categories
          </Button>
          <Button
            variant={sortBy === 'conflict' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('conflict')}
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            Conflict Blocks
          </Button>
        </div>
      </div>

      {/* Team Members Section */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {isCaptain ? 'Click members to assign them to events' : `${teamMembers.length} members on this team`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member: any) => {
                const availableEvents = getAvailableEventsForMember(member)
                
                return (
                  <DropdownMenu key={member.id} open={contextMenuMember?.id === member.id && contextMenuOpen} onOpenChange={(open: boolean) => {
                    if (!open) setContextMenuMember(null)
                    setContextMenuOpen(open)
                  }}>
                    <DropdownMenuTrigger asChild>
                      <div
                        className="flex items-center gap-2 rounded-full border px-3 py-1 cursor-pointer hover:bg-accent"
                        onClick={(e) => {
                          if (isCaptain && !loading) {
                            e.preventDefault()
                            setContextMenuMember(member)
                            setContextMenuOpen(true)
                          }
                        }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.user.image || ''} />
                          <AvatarFallback className="text-xs">
                            {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.user.name || member.user.email}</span>
                        <Badge variant="secondary" className="text-xs">
                          {eventCounts[member.id] || 0} events
                        </Badge>
                      </div>
                    </DropdownMenuTrigger>
                    {isCaptain && contextMenuMember?.id === member.id && (
                      <DropdownMenuContent className="max-h-80 overflow-y-auto">
                        <DropdownMenuLabel>Assign to Event</DropdownMenuLabel>
                        {availableEvents.length > 0 ? (
                          availableEvents.map((event: any) => (
                            <DropdownMenuItem
                              key={event.id}
                              onClick={() => handleAssignToEventFromMenu(member.id, event.id, member.user.name || member.user.email, event.name)}
                            >
                              {event.name}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled>
                            No available events
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events by Category */}
      {sortBy === 'category' && groupedEvents && (
        <div className="space-y-6">
          {categoryOrder.map((category) => {
            const categoryEvents = groupedEvents[category as EventCategory]
            if (!categoryEvents || categoryEvents.length === 0) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryEvents.map((event: any) => {
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
                                      disabled={loading}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          {isCaptain && !atCapacity ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                                <DropdownMenuLabel>Add Member</DropdownMenuLabel>
                                {getAvailableMembersForEvent(event).length > 0 ? (
                                  getAvailableMembersForEvent(event).map((member: any) => (
                                    <DropdownMenuItem
                                      key={member.id}
                                      onClick={() => handleAssignToEventFromMenu(member.id, event.id, member.user.name || member.user.email, event.name)}
                                    >
                                      <Avatar className="h-5 w-5 mr-2">
                                        <AvatarImage src={member.user.image || ''} />
                                        <AvatarFallback className="text-xs">
                                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.user.name || member.user.email}
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <DropdownMenuItem disabled>
                                    No available members
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            atCapacity && (
                              <Badge variant="secondary" className="mt-1">
                                Full
                              </Badge>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Events by Conflict Block */}
      {sortBy === 'conflict' && groupedByConflict && (
        <div className="space-y-6">
          {Object.entries(groupedByConflict).map(([groupName, groupEvents]: [string, any]) => {
            if (!groupEvents || groupEvents.length === 0) return null

            const isSelfScheduled = groupName === 'Self-Scheduled Events'

            return (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle className="text-lg">{groupName}</CardTitle>
                  <CardDescription>
                    {isSelfScheduled 
                      ? 'Members can be assigned to multiple self-scheduled events'
                      : 'Events in this conflict block cannot be assigned to the same member'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupEvents.map((event: any) => {
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
                                      disabled={loading}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          {isCaptain && !atCapacity ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                                <DropdownMenuLabel>Add Member</DropdownMenuLabel>
                                {getAvailableMembersForEvent(event).length > 0 ? (
                                  getAvailableMembersForEvent(event).map((member: any) => (
                                    <DropdownMenuItem
                                      key={member.id}
                                      onClick={() => handleAssignToEventFromMenu(member.id, event.id, member.user.name || member.user.email, event.name)}
                                    >
                                      <Avatar className="h-5 w-5 mr-2">
                                        <AvatarImage src={member.user.image || ''} />
                                        <AvatarFallback className="text-xs">
                                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.user.name || member.user.email}
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <DropdownMenuItem disabled>
                                    No available members
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            atCapacity && (
                              <Badge variant="secondary" className="mt-1">
                                Full
                              </Badge>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
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

  // Main return with conditional view rendering and all dialogs
  return (
    <>
      {!selectedTeam ? renderGridView() : renderRosterView()}

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

      {/* Delete Team Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{teamToDelete?.name}</strong>? This team has {teamToDelete?.members?.length || 0} member{teamToDelete?.members?.length !== 1 ? 's' : ''} who will be unassigned but not removed from the club.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setTeamToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

