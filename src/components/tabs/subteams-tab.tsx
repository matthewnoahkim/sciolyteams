'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Users, Pencil, Trash2, Check } from 'lucide-react'

interface SubteamsTabProps {
  team: any
  isCaptain: boolean
}

export function SubteamsTab({ team, isCaptain }: SubteamsTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newSubteamName, setNewSubteamName] = useState('')
  const [editingSubteam, setEditingSubteam] = useState<any>(null)
  const [editSubteamName, setEditSubteamName] = useState('')
  const [selectedMembership, setSelectedMembership] = useState<string>('')
  const [selectedSubteam, setSelectedSubteam] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subteamsToDelete, setSubteamsToDelete] = useState<string[]>([])
  const [deleteMode, setDeleteMode] = useState(false)

  const handleCreateSubteam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubteamName }),
      })

      if (!response.ok) throw new Error('Failed to create subteam')

      toast({
        title: 'Team created',
        description: newSubteamName,
      })

      setNewSubteamName('')
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
        body: JSON.stringify({ subteamId: selectedSubteam || null }),
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

  const handleEditSubteam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubteam) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams/${editingSubteam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSubteamName }),
      })

      if (!response.ok) throw new Error('Failed to update subteam')

      toast({
        title: 'Team updated',
        description: editSubteamName,
      })

      setEditOpen(false)
      setEditingSubteam(null)
      setEditSubteamName('')
      
      // Force a more aggressive refresh
      router.refresh()
      // Also try a hard reload after a short delay to ensure all data is fresh
      setTimeout(() => {
        window.location.reload()
      }, 100)
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

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setSubteamsToDelete([])
  }

  const toggleSubteamSelection = (subteamId: string) => {
    setSubteamsToDelete(prev => 
      prev.includes(subteamId) 
        ? prev.filter(id => id !== subteamId)
        : [...prev, subteamId]
    )
  }

  const openDeleteConfirmation = () => {
    if (subteamsToDelete.length === 0) {
      toast({
        title: 'No teams selected',
        description: 'Please select at least one team to delete',
        variant: 'destructive',
      })
      return
    }
    setDeleteDialogOpen(true)
  }

  const handleDeleteSubteams = async () => {
    if (subteamsToDelete.length === 0) return

    setLoading(true)

    try {
      // Delete all selected teams
      const deletePromises = subteamsToDelete.map(subteamId =>
        fetch(`/api/teams/${team.id}/subteams/${subteamId}`, {
          method: 'DELETE',
        })
      )

      const responses = await Promise.all(deletePromises)
      const failedDeletes = responses.filter(r => !r.ok)

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} team(s)`)
      }

      toast({
        title: 'Teams deleted',
        description: `Successfully deleted ${subteamsToDelete.length} team(s)`,
      })

      setSubteamsToDelete([])
      setDeleteMode(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete teams',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const openEditDialog = (subteam: any) => {
    setEditingSubteam(subteam)
    setEditSubteamName(subteam.name)
    setEditOpen(true)
  }

  const unassignedMembers = team.memberships.filter((m: any) => !m.subteamId)

  return (
    <div className="space-y-6">
      {isCaptain && (
        <div className="flex gap-2 items-center">
          {!deleteMode ? (
            <>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Manage Assignments
              </Button>
              <Button 
                variant="destructive" 
                onClick={toggleDeleteMode}
                disabled={team.subteams.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Teams
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={toggleDeleteMode}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={openDeleteConfirmation}
                disabled={subteamsToDelete.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({subteamsToDelete.length})
              </Button>
              <p className="text-sm text-muted-foreground">
                Click teams to select them for deletion
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {team.subteams.map((subteam: any) => {
          const isSelected = subteamsToDelete.includes(subteam.id)
          return (
            <Card 
              key={subteam.id}
              className={`${deleteMode ? 'cursor-pointer' : ''} transition-all duration-200 ${
                deleteMode 
                  ? isSelected 
                    ? 'ring-2 ring-destructive bg-destructive/5' 
                    : 'hover:ring-2 hover:ring-muted-foreground/50'
                  : ''
              }`}
              onClick={() => {
                if (deleteMode) {
                  toggleSubteamSelection(subteam.id)
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {deleteMode && (
                      <div className={`flex items-center justify-center h-5 w-5 rounded border-2 ${
                        isSelected 
                          ? 'bg-destructive border-destructive' 
                          : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-destructive-foreground" />}
                      </div>
                    )}
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {subteam.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({subteam.members.length} / 15)
                      </span>
                    </CardTitle>
                  </div>
                  {isCaptain && !deleteMode && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openEditDialog(subteam)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subteam.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || ''} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{member.user.name || member.user.email}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  {subteam.members.length === 0 && (
                    <p className="text-sm text-muted-foreground">No members assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubteam}>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={newSubteamName}
                  onChange={(e) => setNewSubteamName(e.target.value)}
                  placeholder="e.g., Team A"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newSubteamName}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                value={selectedSubteam}
                onChange={(e) => setSelectedSubteam(e.target.value)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubteam}>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Team Name</Label>
                <Input
                  id="edit-name"
                  value={editSubteamName}
                  onChange={(e) => setEditSubteamName(e.target.value)}
                  placeholder="e.g., Team A"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !editSubteamName}>
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {subteamsToDelete.length} Team{subteamsToDelete.length !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the following team{subteamsToDelete.length !== 1 ? 's' : ''}? Members will be unassigned but not removed from the club.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-1">
              {subteamsToDelete.map(subteamId => {
                const subteam = team.subteams.find((s: any) => s.id === subteamId)
                return subteam ? (
                  <li key={subteamId} className="text-sm font-medium">
                    {subteam.name} ({subteam.members.length} member{subteam.members.length !== 1 ? 's' : ''})
                  </li>
                ) : null
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubteams}
              disabled={loading}
            >
              {loading ? 'Deleting...' : `Delete ${subteamsToDelete.length} Team${subteamsToDelete.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

