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
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'

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
  const [subteamToDelete, setSubteamToDelete] = useState<any>(null)

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

  const handleDeleteSubteamClick = (subteam: any) => {
    setSubteamToDelete(subteam)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSubteam = async () => {
    if (!subteamToDelete) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/subteams/${subteamToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete subteam')

      toast({
        title: 'Team deleted',
        description: subteamToDelete.name,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setSubteamToDelete(null)
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
          <Card key={subteam.id}>
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
                      onClick={() => openEditDialog(subteam)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubteamClick(subteam)}
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
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{subteamToDelete?.name}"? Members will be unassigned but not removed from the team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubteam}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

