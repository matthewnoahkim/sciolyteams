'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Copy, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react'

interface SettingsTabProps {
  team: any
  isCaptain: boolean
}

export function SettingsTab({ team, isCaptain }: SettingsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [captainCode, setCaptainCode] = useState<string>('••••••••••••')
  const [memberCode, setMemberCode] = useState<string>('••••••••••••')
  const [showCaptainCode, setShowCaptainCode] = useState(false)
  const [showMemberCode, setShowMemberCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [codesFetched, setCodesFetched] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchCodes = async () => {
    if (codesFetched) return

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/codes`)
      
      if (!response.ok) throw new Error('Failed to fetch codes')

      const data = await response.json()
      
      if (data.needsRegeneration) {
        toast({
          title: 'Codes need regeneration',
          description: 'Please regenerate the invite codes',
          variant: 'destructive',
        })
        return
      }

      setCaptainCode(data.captainCode)
      setMemberCode(data.memberCode)
      setCodesFetched(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invite codes',
        variant: 'destructive',
      })
    }
  }

  const handleShowCaptainCode = async () => {
    if (!showCaptainCode && !codesFetched) {
      await fetchCodes()
    }
    setShowCaptainCode(!showCaptainCode)
  }

  const handleShowMemberCode = async () => {
    if (!showMemberCode && !codesFetched) {
      await fetchCodes()
    }
    setShowMemberCode(!showMemberCode)
  }

  const handleRegenerate = async (type: 'captain' | 'member') => {
    if (!confirm(`Are you sure you want to regenerate the ${type} invite code? The old code will no longer work.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) throw new Error('Failed to regenerate code')

      const data = await response.json()
      
      if (type === 'captain') {
        setCaptainCode(data.code)
        setShowCaptainCode(true)
      } else {
        setMemberCode(data.code)
        setShowMemberCode(true)
      }

      setCodesFetched(true) // Mark codes as fetched after regeneration

      toast({
        title: 'Code regenerated',
        description: `New ${type} invite code generated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (code: string, type: string) => {
    if (code === '••••••••••••') {
      toast({
        title: 'Error',
        description: 'Please reveal the code first',
        variant: 'destructive',
      })
      return
    }

    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: `${type} invite code copied to clipboard`,
    })
  }

  const handleDeleteTeam = async () => {
    if (deleteConfirmation !== team.name) {
      toast({
        title: 'Error',
        description: 'Team name does not match',
        variant: 'destructive',
      })
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete team')
      }

      toast({
        title: 'Team deleted',
        description: 'The team and all its data have been permanently removed',
      })

      // Redirect to home page after successful deletion
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Team Name</p>
            <p className="text-lg">{team.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Division</p>
            <Badge>{team.division}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Members</p>
            <p className="text-lg">{team.memberships.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Subteams</p>
            <p className="text-lg">{team.subteams.length}</p>
          </div>
        </CardContent>
      </Card>

      {isCaptain && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Captain Invite Code</CardTitle>
              <CardDescription>
                Share this code with users who should have captain permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-4 py-2 font-mono text-sm">
                  {showCaptainCode ? captainCode : '••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShowCaptainCode}
                >
                  {showCaptainCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(captainCode, 'Captain')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerate('captain')}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Invite Code</CardTitle>
              <CardDescription>
                Share this code with users who should join as regular members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-4 py-2 font-mono text-sm">
                  {showMemberCode ? memberCode : '••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShowMemberCode}
                >
                  {showMemberCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(memberCode, 'Member')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerate('member')}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isCaptain && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only team captains can view and manage invite codes.
            </p>
          </CardContent>
        </Card>
      )}

      {isCaptain && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this team and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Team
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the team, all subteams, 
              announcements, calendar events, roster assignments, and remove all members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-bold">{team.name}</span> to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmation('')
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleting || deleteConfirmation !== team.name}
            >
              {deleting ? 'Deleting...' : 'Delete Team Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

