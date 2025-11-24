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
import { Plus, Users, Pencil, Trash2, ArrowLeft, X, FileSpreadsheet, Mail, Grid3x3, Layers } from 'lucide-react'
import { groupEventsByCategory, categoryOrder, type EventCategory } from '@/lib/event-categories'

interface PeopleTabProps {
  team: any
  currentMembership: any
  isAdmin: boolean
}

export function PeopleTab({ team, currentMembership, isAdmin }: PeopleTabProps) {
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
  const [rosterViewMode, setRosterViewMode] = useState<'category' | 'conflict'>('category')
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
      // Data will update on next navigation - no refresh needed
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

      // Update the selectedTeam state if it's the one being edited
      if (selectedTeam && selectedTeam.id === editingTeam.id) {
        setSelectedTeam({
          ...selectedTeam,
          name: editTeamName
        })
      }

      setEditOpen(false)
      setEditingTeam(null)
      setEditTeamName('')
      // Data will update on next navigation - no refresh needed
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
      // Data will update on next navigation - no refresh needed
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

  const handleAddMemberToEvent = async (eventId: string, membershipId: string) => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subteamId: selectedTeam.id,
          membershipId: membershipId,
          eventId: eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign member')
      }

      const event = events.find(e => e.id === eventId)
      toast({
        title: 'Member assigned',
        description: event ? `Added to ${event.name}` : 'Added to event',
      })

      // Optimistically update assignments - refetch assignments
      fetchAssignments()
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

      // Optimistically update assignments - refetch assignments
      fetchAssignments()
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
    
    // Filter available events
    return events.filter((event) => {
      // Already assigned
      if (assignedEventIds.includes(event.id)) return false
      
      // Check capacity
      const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
      if (eventAssignments.length >= event.maxCompetitors) return false
      
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
        return
      }
    }

    setLoading(true)

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

      // Data will update on next navigation - no refresh needed
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

      // Optimistically update assignments - refetch assignments
      fetchAssignments()
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

  const handleUpdateRole = async (membershipId: string, role: 'COACH' | 'CAPTAIN' | null) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: role ? [role] : [] }),
      })

      if (!response.ok) throw new Error('Failed to update role')

      toast({
        title: 'Role updated',
        description: role ? `Assigned ${role.toLowerCase()} role` : 'Removed roles',
      })

      // Data will update on next navigation - no refresh needed
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
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
            if (upperRole === 'ADMIN') return 0
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

  const handleEmailAll = () => {
    const allMembers = team.memberships
    const admins = allMembers.filter((m: any) => String(m.role).toUpperCase() === 'ADMIN')
    const regularMembers = allMembers.filter((m: any) => String(m.role).toUpperCase() !== 'ADMIN')
    
    const bccEmails = regularMembers.map((m: any) => m.user.email).join(',')
    const ccEmails = admins.map((m: any) => m.user.email).join(',')
    
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(bccEmails)}&cc=${encodeURIComponent(ccEmails)}&subject=${encodeURIComponent(`${team.name} Team Communication`)}`
    window.location.href = mailtoLink
  }

  // Render Team Grid View
  const renderGridView = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" onClick={handleEmailAll}>
                <Mail className="mr-2 h-4 w-4" />
                Email All
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={handleExportToGoogleSheet}>
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {String(member.role).toUpperCase() === 'ADMIN' && (
                              <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
                            )}
                            {Array.isArray(member.roles) && member.roles.includes('COACH') && (
                              <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
                            )}
                            {Array.isArray(member.roles) && member.roles.includes('CAPTAIN') && (
                              <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
                            )}
                          </div>
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
            )
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>All Club Members</CardTitle>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Use the actions menu to manage teams and roles
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
                const memberRoles: string[] = Array.isArray(member.roles) ? member.roles : []
  return (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.user.image || ''} />
            <AvatarFallback>
              {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{member.user.name || member.user.email}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {String(member.role).toUpperCase() === 'ADMIN' && (
                            <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
              )}
              {memberRoles.includes('COACH') && (
                <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
              )}
              {memberRoles.includes('CAPTAIN') && (
                <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
              )}
              <span>• {eventCount} event{eventCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `mailto:${member.user.email}`
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
          {isAdmin && (
                        <select
                          className="rounded-md border p-2 text-sm"
                          value={member.subteamId || ''}
                          onChange={(e) => handleAssignToTeamFromMenu(member.id, e.target.value || null, member.user.name || member.user.email)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Unassigned</option>
                          {team.subteams.map((subteam: any) => (
                            <option 
                              key={subteam.id} 
                              value={subteam.id}
                              disabled={subteam.id !== member.subteamId && subteam.members.length >= 15}
                            >
                              {subteam.name} ({subteam.members.length}/15)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )

  // Render Team Detail View (roster) - adapted from roster-tab
  const renderTeamView = () => {
    if (!selectedTeam) return null

    const teamMembers = team.memberships.filter((m: any) => m.subteamId === selectedTeam.id)

    const handleEmailTeam = () => {
      const teamMembersForEmail = teamMembers
      const allAdmins = team.memberships.filter((m: any) => String(m.role).toUpperCase() === 'ADMIN')
      
      const bccEmails = teamMembersForEmail.map((m: any) => m.user.email).join(',')
      const ccEmails = allAdmins.map((m: any) => m.user.email).join(',')
      
      const mailtoLink = `mailto:?bcc=${encodeURIComponent(bccEmails)}&cc=${encodeURIComponent(ccEmails)}&subject=${encodeURIComponent(`${selectedTeam.name} Team Communication`)}`
      window.location.href = mailtoLink
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
              </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedTeam)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Team
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDeleteDialog(selectedTeam)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </Button>
            </div>
          )}
        </div>

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {teamMembers.length} / 15 members
                </Badge>
                <Button variant="outline" size="sm" onClick={handleEmailTeam}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Team
                </Button>
      </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member: any) => {
                const memberEventAssignments = assignments.filter(
                  (a) => a.membership.id === member.id && a.subteamId === selectedTeam.id
                )
                return (
                  <div key={member.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.image || ''} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.user.name || member.user.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memberEventAssignments.length > 0 ? (
                            memberEventAssignments.map((assignment: any) => {
                              const event = events.find((e) => e.id === assignment.eventId)
                              return event ? (
                                <Badge key={assignment.id} variant="secondary" className="text-[10px]">
                                  {event.name}
                                </Badge>
                              ) : null
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">No events assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members in this team yet. Assign members using the dropdown in the &quot;All Club Members&quot; section below.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Event Roster - Division {team.division}
                </CardTitle>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a member from dropdown to assign to events
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={rosterViewMode === 'category' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRosterViewMode('category')}
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  By Category
                </Button>
                <Button
                  variant={rosterViewMode === 'conflict' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRosterViewMode('conflict')}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  By Conflicts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rosterViewMode === 'category' ? (
              // Group by Category
              <div className="space-y-6">
                {Object.entries(groupEventsByCategory(events, team.division))
                  .sort(([a], [b]) => 
                    categoryOrder.indexOf(a as EventCategory) - categoryOrder.indexOf(b as EventCategory)
                  )
                  .map(([category, categoryEvents]) => (
                    <div key={category}>
                      <h3 className="mb-3 text-lg font-semibold">{category}</h3>
                      <div className="space-y-3">
                        {(categoryEvents as any[]).map((event: any) => {
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
                                      {isAdmin && (
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
                              {isAdmin && !atCapacity && (
                                <select
                                  className="rounded-md border p-2 text-sm"
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddMemberToEvent(event.id, e.target.value)
                                      e.target.value = '' // Reset dropdown
                                    }
                                  }}
                                >
                                  <option value="">Add member...</option>
                                  {teamMembers
                                    .filter((member: any) => {
                                      // Filter out already assigned members
                                      const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
                                      const assignedMemberIds = eventAssignments.map((a) => a.membership.id)
                                      return !assignedMemberIds.includes(member.id)
                                    })
                                    .map((member: any) => (
                                      <option key={member.id} value={member.id}>
                                        {member.user.name || member.user.email}
                                      </option>
                                    ))}
                                </select>
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
                    </div>
                  ))}
              </div>
            ) : (
              // Group by Conflict Blocks
              <div className="space-y-6">
                {conflictGroups.map((group: any, index: number) => {
                  const groupEvents = events.filter((e) => 
                    group.events.some((ge: any) => ge.eventId === e.id)
                  )
                  return (
                    <div key={group.id}>
                      <h3 className="mb-3 text-lg font-semibold">Conflict Block {index + 1}</h3>
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
                                      {isAdmin && (
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
                              {isAdmin && !atCapacity && (
                                <select
                                  className="rounded-md border p-2 text-sm"
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddMemberToEvent(event.id, e.target.value)
                                      e.target.value = '' // Reset dropdown
                                    }
                                  }}
                                >
                                  <option value="">Add member...</option>
                                  {teamMembers
                                    .filter((member: any) => {
                                      // Filter out already assigned members
                                      const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
                                      const assignedMemberIds = eventAssignments.map((a) => a.membership.id)
                                      return !assignedMemberIds.includes(member.id)
                                    })
                                    .map((member: any) => (
                                      <option key={member.id} value={member.id}>
                                        {member.user.name || member.user.email}
                                      </option>
                                    ))}
                                </select>
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
                    </div>
                  )
                })}
                {/* Show ungrouped events */}
                {(() => {
                  const groupedEventIds = new Set(
                    conflictGroups.flatMap((g: any) => g.events.map((e: any) => e.eventId))
                  )
                  const ungroupedEvents = events.filter((e) => !groupedEventIds.has(e.id))
                  
                  return ungroupedEvents.length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">Other Events</h3>
                      <div className="space-y-3">
                        {ungroupedEvents.map((event: any) => {
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
                                      {isAdmin && (
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
                              {isAdmin && !atCapacity && (
                                <select
                                  className="rounded-md border p-2 text-sm"
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddMemberToEvent(event.id, e.target.value)
                                      e.target.value = '' // Reset dropdown
                                    }
                                  }}
                                >
                                  <option value="">Add member...</option>
                                  {teamMembers
                                    .filter((member: any) => {
                                      // Filter out already assigned members
                                      const eventAssignments = getAssignmentsForEvent(event.id, selectedTeam.id)
                                      const assignedMemberIds = eventAssignments.map((a) => a.membership.id)
                                      return !assignedMemberIds.includes(member.id)
                                    })
                                    .map((member: any) => (
                                      <option key={member.id} value={member.id}>
                                        {member.user.name || member.user.email}
                                      </option>
                                    ))}
                                </select>
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
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {selectedTeam ? renderTeamView() : renderGridView()}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new subteam for roster management
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Team A, Varsity, JV"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team name
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeam}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTeamName">Team Name</Label>
                <Input
                  id="editTeamName"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Team'}
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
              Are you sure you want to delete {teamToDelete?.name}? This will remove all event assignments for this team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
