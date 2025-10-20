'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime } from '@/lib/utils'
import { Plus, Send, Trash2, ChevronDown, ChevronUp, Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface StreamTabProps {
  teamId: string
  currentMembership: any
  subteams: any[]
  isCaptain: boolean
}

export function StreamTab({ teamId, currentMembership, subteams, isCaptain }: StreamTabProps) {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState<'TEAM' | 'SUBTEAM'>('TEAM')
  const [selectedSubteams, setSelectedSubteams] = useState<string[]>([])
  const [sendEmail, setSendEmail] = useState(false)
  const [isPostSectionCollapsed, setIsPostSectionCollapsed] = useState(true)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [teamId])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/announcements?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosting(true)

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          title,
          content,
          scope,
          subteamIds: scope === 'SUBTEAM' ? selectedSubteams : undefined,
          sendEmail,
        }),
      })

      if (!response.ok) throw new Error('Failed to post announcement')

      toast({
        title: 'Announcement posted',
        description: sendEmail ? 'Emails are being sent.' : undefined,
      })

      setTitle('')
      setContent('')
      setSendEmail(false)
      fetchAnnouncements()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post announcement',
        variant: 'destructive',
      })
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteClick = (announcementId: string) => {
    setAnnouncementToDelete(announcementId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!announcementToDelete) return

    try {
      const response = await fetch(`/api/announcements/${announcementToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete announcement')
      }

      toast({
        title: 'Announcement deleted',
        description: 'The announcement has been removed',
      })

      fetchAnnouncements()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete announcement',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setAnnouncementToDelete(null)
    }
  }

  const canDeleteAnnouncement = (announcement: any) => {
    // Can delete if you're the author or a captain
    return announcement.authorId === currentMembership.id || isCaptain
  }

  const handleEditClick = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setEditTitle(announcement.title)
    setEditContent(announcement.content)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(true)

    try {
      const response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update announcement')
      }

      toast({
        title: 'Announcement updated',
        description: 'The announcement has been updated successfully',
      })

      setIsEditDialogOpen(false)
      setEditingAnnouncement(null)
      fetchAnnouncements()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update announcement',
        variant: 'destructive',
      })
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Only show post announcement section to captains */}
      {isCaptain && (
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsPostSectionCollapsed(!isPostSectionCollapsed)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-base">Post Announcement</span>
            </div>
            {isPostSectionCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </CardTitle>
        </CardHeader>
        {!isPostSectionCollapsed && (
          <CardContent>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                required
              />
            </div>
            <div>
              <Label htmlFor="content">Message</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="TEAM"
                  checked={scope === 'TEAM'}
                  onChange={() => setScope('TEAM')}
                />
                <span className="text-sm">Entire Club</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="SUBTEAM"
                  checked={scope === 'SUBTEAM'}
                  onChange={() => setScope('SUBTEAM')}
                />
                <span className="text-sm">Selected Teams</span>
              </label>
            </div>
            {scope === 'SUBTEAM' && (
              <div className="space-y-2">
                <Label>Select Teams</Label>
                <div className="flex flex-wrap gap-2">
                  {subteams.map((subteam) => (
                    <label key={subteam.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={subteam.id}
                        checked={selectedSubteams.includes(subteam.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubteams([...selectedSubteams, subteam.id])
                          } else {
                            setSelectedSubteams(selectedSubteams.filter((id) => id !== subteam.id))
                          }
                        }}
                      />
                      <span className="text-sm">{subteam.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <Label htmlFor="sendEmail" className="cursor-pointer">
                Send email notification to recipients
              </Label>
            </div>
            <Button type="submit" disabled={posting}>
              <Send className="mr-2 h-4 w-4" />
              {posting ? 'Posting...' : 'Post Announcement'}
            </Button>
          </form>
        </CardContent>
        )}
      </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-3xl font-bold">Recent Announcements</h3>
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No announcements yet
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={announcement.author.user.image || ''} />
                      <AvatarFallback>
                        {announcement.author.user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {announcement.author.user.name || announcement.author.user.email} •{' '}
                        {formatDateTime(announcement.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {announcement.visibilities.map((v: any) => (
                        <Badge key={v.id} variant="secondary" className="text-xs">
                          {v.scope === 'TEAM' ? 'CLUB' : v.subteam?.name || 'SUBTEAM'}
                        </Badge>
                      ))}
                    </div>
                    {isCaptain && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(announcement)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteAnnouncement(announcement) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(announcement.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Announcement title"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Message</Label>
              <textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your message..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? 'Updating...' : 'Update Announcement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
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
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

