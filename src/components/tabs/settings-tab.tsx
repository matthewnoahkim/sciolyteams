'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, RefreshCw, Eye, EyeOff, Trash2, UserX, X, Save, Link as LinkIcon } from 'lucide-react'

interface SettingsTabProps {
  team: any
  currentMembership: any
  isAdmin: boolean
}

export function SettingsTab({ team, currentMembership, isAdmin }: SettingsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [adminCode, setAdminCode] = useState<string>('••••••••••••')
  const [memberCode, setMemberCode] = useState<string>('••••••••••••')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [showMemberCode, setShowMemberCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [codesFetched, setCodesFetched] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [codeTypeToRegenerate, setCodeTypeToRegenerate] = useState<'admin' | 'member' | null>(null)
  
  // Background customization state
  const [backgroundType, setBackgroundType] = useState<string>(team.backgroundType || 'grid')
  const [backgroundColor, setBackgroundColor] = useState<string>(team.backgroundColor || '#f8fafc')
  const [gradientStartColor, setGradientStartColor] = useState<string>(team.gradientStartColor || '#e0e7ff')
  const [gradientEndColor, setGradientEndColor] = useState<string>(team.gradientEndColor || '#fce7f3')
  const [savingBackground, setSavingBackground] = useState(false)

  const openRemoveMemberDialog = (membershipId: string, memberName: string) => {
    setMemberToRemove({ id: membershipId, name: memberName })
    setRemoveMemberDialogOpen(true)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setRemovingMember(memberToRemove.id)

    try {
      const response = await fetch(`/api/memberships/${memberToRemove.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast({
        title: 'Member removed',
        description: `${memberToRemove.name} has been removed from the club`,
      })

      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
      // Data will update on next navigation - no refresh needed
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      })
    } finally {
      setRemovingMember(null)
    }
  }

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

      setAdminCode(data.adminCode)
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

  const handleShowAdminCode = async () => {
    if (!showAdminCode && !codesFetched) {
      await fetchCodes()
    }
    setShowAdminCode(!showAdminCode)
  }

  const handleShowMemberCode = async () => {
    if (!showMemberCode && !codesFetched) {
      await fetchCodes()
    }
    setShowMemberCode(!showMemberCode)
  }

  const handleRegenerateClick = (type: 'admin' | 'member') => {
    setCodeTypeToRegenerate(type)
    setRegenerateDialogOpen(true)
  }

  const handleRegenerate = async () => {
    if (!codeTypeToRegenerate) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: codeTypeToRegenerate }),
      })

      if (!response.ok) throw new Error('Failed to regenerate code')

      const data = await response.json()
      
      if (codeTypeToRegenerate === 'admin') {
        setAdminCode(data.code)
        setShowAdminCode(true)
      } else {
        setMemberCode(data.code)
        setShowMemberCode(true)
      }

      setCodesFetched(true) // Mark codes as fetched after regeneration

      toast({
        title: 'Code regenerated',
        description: `New ${codeTypeToRegenerate} invite code generated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRegenerateDialogOpen(false)
      setCodeTypeToRegenerate(null)
    }
  }

  const getInviteLink = (codeValue: string) => {
    if (typeof window === 'undefined') {
      return `/join?code=${encodeURIComponent(codeValue)}`
    }
    return `${window.location.origin}/join?code=${encodeURIComponent(codeValue)}`
  }

  const handleCopy = async (code: string, type: 'Admin' | 'Member', variant: 'code' | 'link' = 'code') => {
    let realCode = code
    // If code is hidden or codes not fetched, fetch codes first
    if (code === '••••••••••••' || !codesFetched) {
      try {
        const response = await fetch(`/api/teams/${team.id}/invite/codes`)
        if (!response.ok) throw new Error('Failed to fetch codes')
        const data = await response.json()
        if (type === 'Admin') {
          realCode = data.adminCode
          setAdminCode(data.adminCode)
        } else {
          realCode = data.memberCode
          setMemberCode(data.memberCode)
        }
        setCodesFetched(true)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch invite code',
          variant: 'destructive',
        })
        return
      }
    }
    const valueToCopy = variant === 'link' ? getInviteLink(realCode) : realCode

    try {
      await navigator.clipboard.writeText(valueToCopy)
      toast({
        title: 'Copied!',
        description:
          variant === 'link'
            ? `${type} invite link copied to clipboard`
            : `${type} invite code copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
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

  const handleLeaveTeam = async () => {
    setLeaving(true)

    try {
      const response = await fetch(`/api/memberships/${currentMembership.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave team')
      }

      toast({
        title: 'Left club',
        description: 'You have successfully left the club',
      })

      // Navigate to home - no refresh needed as we're going to a different page
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave team',
        variant: 'destructive',
      })
      setLeaving(false)
      setLeaveDialogOpen(false)
    }
  }

  const handleSaveBackground = async () => {
    setSavingBackground(true)

    try {
      // Validate color format if needed
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      if (backgroundType === 'solid' && backgroundColor && !hexColorRegex.test(backgroundColor)) {
        toast({
          title: 'Invalid color',
          description: 'Please enter a valid hex color (e.g., #ffffff)',
          variant: 'destructive',
        })
        setSavingBackground(false)
        return
      }
      if (backgroundType === 'gradient') {
        if (gradientStartColor && !hexColorRegex.test(gradientStartColor)) {
          toast({
            title: 'Invalid start color',
            description: 'Please enter a valid hex color (e.g., #ffffff)',
            variant: 'destructive',
          })
          setSavingBackground(false)
          return
        }
        if (gradientEndColor && !hexColorRegex.test(gradientEndColor)) {
          toast({
            title: 'Invalid end color',
            description: 'Please enter a valid hex color (e.g., #ffffff)',
            variant: 'destructive',
          })
          setSavingBackground(false)
          return
        }
      }

      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundType,
          backgroundColor: backgroundType === 'solid' && backgroundColor ? backgroundColor : null,
          gradientStartColor: backgroundType === 'gradient' && gradientStartColor ? gradientStartColor : null,
          gradientEndColor: backgroundType === 'gradient' && gradientEndColor ? gradientEndColor : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.details 
          ? `${data.error}: ${JSON.stringify(data.details)}`
          : data.message || data.error || 'Failed to update background'
        throw new Error(errorMessage)
      }

      toast({
        title: 'Background updated',
        description: 'The club background has been updated successfully',
      })

      // Refresh the page to apply the new background
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update background',
        variant: 'destructive',
      })
    } finally {
      setSavingBackground(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Club Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Club Name</p>
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
            <p className="text-sm font-medium">Teams</p>
            <p className="text-lg">{team.subteams.length}</p>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Background Customization</CardTitle>
            <CardDescription>
              Customize the background that all members will see when viewing this club
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="background-type">Background Type</Label>
              <Select value={backgroundType} onValueChange={setBackgroundType}>
                <SelectTrigger id="background-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Pattern (Default)</SelectItem>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backgroundType === 'solid' && (
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#f8fafc"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {backgroundType === 'gradient' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gradient-start">Start Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="gradient-start"
                      type="color"
                      value={gradientStartColor}
                      onChange={(e) => setGradientStartColor(e.target.value)}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={gradientStartColor}
                      onChange={(e) => setGradientStartColor(e.target.value)}
                      placeholder="#e0e7ff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradient-end">End Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="gradient-end"
                      type="color"
                      value={gradientEndColor}
                      onChange={(e) => setGradientEndColor(e.target.value)}
                      className="w-20 h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={gradientEndColor}
                      onChange={(e) => setGradientEndColor(e.target.value)}
                      placeholder="#fce7f3"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="h-32 rounded-lg border-2 border-border overflow-hidden"
                style={{
                  background:
                    backgroundType === 'grid'
                      ? 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)'
                      : backgroundType === 'solid'
                      ? backgroundColor
                      : `linear-gradient(135deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)`,
                  backgroundSize: backgroundType === 'grid' ? '24px 24px' : 'auto',
                }}
              />
            </div>

            <Button
              onClick={handleSaveBackground}
              disabled={savingBackground}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingBackground ? 'Saving...' : 'Save Background'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Club Members</CardTitle>
            <CardDescription>
              Manage members and their access to the club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.memberships.map((membership: any) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={membership.user.image || ''} />
                      <AvatarFallback>
                        {membership.user.name?.charAt(0) || membership.user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{membership.user.name || membership.user.email}</p>
                      <div className="flex items-center gap-2">
                        {membership.role === 'ADMIN' && (
                          <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('COACH') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('CAPTAIN') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
                        )}
                        {membership.subteam && (
                          <span className="text-xs text-muted-foreground">
                            Team: {membership.subteam.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {membership.id !== currentMembership.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRemoveMemberDialog(membership.id, membership.user.name || membership.user.email)}
                      disabled={removingMember === membership.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Admin Invite Code</CardTitle>
              <CardDescription>
                Share this code with users who should have admin permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-4 py-2 font-mono text-sm">
                  {showAdminCode ? adminCode : '••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShowAdminCode}
                >
                  {showAdminCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(adminCode, 'Admin')}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy admin code</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(adminCode, 'Admin', 'link')}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="sr-only">Copy admin invite link</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerateClick('admin')}
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
                  <span className="sr-only">Copy member code</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(memberCode, 'Member', 'link')}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="sr-only">Copy member invite link</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerateClick('member')}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only team admins can view and manage invite codes.
            </p>
          </CardContent>
        </Card>
      )}

      {team.memberships.length > 1 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Leave Club</CardTitle>
            <CardDescription>
              Remove yourself from this club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you leave, you&apos;ll need an invite code to rejoin this club.
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Leave Club
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this club and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Club
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the club, all teams, 
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
                placeholder="Enter club name"
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
              {deleting ? 'Deleting...' : 'Delete Club Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {team.name}? You will need an invite code to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveTeam}
              disabled={leaving}
            >
              {leaving ? 'Leaving...' : 'Leave Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeMemberDialogOpen} onOpenChange={(open) => {
        setRemoveMemberDialogOpen(open)
        if (!open) setMemberToRemove(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from {team.name}? 
              This action cannot be undone and they will need an invite code to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveMemberDialogOpen(false)
                setMemberToRemove(null)
              }}
              disabled={removingMember !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={removingMember !== null}
            >
              {removingMember ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Invite Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the {codeTypeToRegenerate} invite code? The old code will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerate}
              disabled={loading}
            >
              {loading ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

