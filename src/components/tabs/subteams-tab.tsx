'use client'

import { useState } from 'react'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Users } from 'lucide-react'

interface SubteamsTabProps {
  team: any
  isCaptain: boolean
}

export function SubteamsTab({ team, isCaptain }: SubteamsTabProps) {
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newSubteamName, setNewSubteamName] = useState('')
  const [selectedMembership, setSelectedMembership] = useState<string>('')
  const [selectedSubteam, setSelectedSubteam] = useState<string>('')

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
        title: 'Subteam created',
        description: newSubteamName,
      })

      setNewSubteamName('')
      setCreateOpen(false)
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subteam',
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
      window.location.reload()
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

  const unassignedMembers = team.memberships.filter((m: any) => !m.subteamId)

  return (
    <div className="space-y-6">
      {isCaptain && (
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Subteam
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
              <CardTitle className="flex items-center justify-between text-lg">
                {subteam.name}
                <span className="text-sm font-normal text-muted-foreground">
                  {subteam.members.length} member{subteam.members.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
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
              <DialogTitle>Create Subteam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Subteam Name</Label>
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
              <Label>Assign to Subteam</Label>
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={selectedSubteam}
                onChange={(e) => setSelectedSubteam(e.target.value)}
              >
                <option value="">No subteam (unassign)</option>
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
    </div>
  )
}

