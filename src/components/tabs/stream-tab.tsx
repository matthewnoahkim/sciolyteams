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
import { Plus, Send, Trash2, ChevronDown, ChevronUp, Edit, MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { EmojiPicker } from '@/components/emoji-picker'

interface StreamTabProps {
  teamId: string
  currentMembership: any
  subteams: any[]
  isCaptain: boolean
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
}

export function StreamTab({ teamId, currentMembership, subteams, isCaptain, user }: StreamTabProps) {
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
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({})
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const [reacting, setReacting] = useState<Record<string, boolean>>({})

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

  const canEditAnnouncement = (announcement: any) => {
    // Can only edit if you're the author (not just any captain)
    return announcement.authorId === currentMembership.id
  }

  const handleEditClick = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setEditTitle(announcement.title)
    setEditContent(announcement.content)
    setIsEditDialogOpen(true)
  }

  const handlePostReply = async (announcementId: string) => {
    const content = replyContent[announcementId]?.trim()
    if (!content) return

    setPostingReply({ ...postingReply, [announcementId]: true })

    try {
      const response = await fetch(`/api/announcements/${announcementId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error('Failed to post reply')

      toast({
        title: 'Reply posted',
      })

      // Clear the input
      setReplyContent({ ...replyContent, [announcementId]: '' })
      
      // Refresh announcements to get new reply
      fetchAnnouncements()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      })
    } finally {
      setPostingReply({ ...postingReply, [announcementId]: false })
    }
  }

  const toggleReplies = (announcementId: string) => {
    setShowReplies({
      ...showReplies,
      [announcementId]: !showReplies[announcementId],
    })
  }

  const handleReactionToggle = async (targetType: 'announcement' | 'reply', targetId: string, emoji: string) => {
    const key = `${targetType}-${targetId}-${emoji}`
    setReacting({ ...reacting, [key]: true })

    try {
      // Check if user already reacted with this emoji
      const currentAnnouncement = announcements.find(a => a.id === targetId)
      const currentReply = currentAnnouncement?.replies?.find((r: any) => r.id === targetId)
      const target = targetType === 'announcement' ? currentAnnouncement : currentReply
      
      const hasReacted = target?.reactions?.some((r: any) => 
        r.emoji === emoji && r.user.id === user.id
      )

      if (hasReacted) {
        // Remove reaction
        await fetch(`/api/reactions?targetType=${targetType}&targetId=${targetId}&emoji=${encodeURIComponent(emoji)}`, {
          method: 'DELETE',
        })
      } else {
        // Add reaction
        await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emoji,
            targetType,
            targetId,
          }),
        })
      }

      // Refresh announcements to get updated reactions
      fetchAnnouncements()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      })
    } finally {
      setReacting({ ...reacting, [key]: false })
    }
  }

  const getReactionSummary = (reactions: any[]) => {
    if (!reactions || reactions.length === 0) return []
    
    const summary: Array<{ emoji: string; count: number; hasUserReacted: boolean }> = []
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, hasUserReacted: false }
      }
      acc[reaction.emoji].count++
      if (reaction.user.id === user.id) {
        acc[reaction.emoji].hasUserReacted = true
      }
      return acc
    }, {} as Record<string, { count: number; hasUserReacted: boolean }>)

    Object.entries(grouped).forEach(([emoji, data]) => {
      summary.push({
        emoji,
        count: data.count,
        hasUserReacted: data.hasUserReacted,
      })
    })

    return summary.sort((a, b) => b.count - a.count)
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
                    {canEditAnnouncement(announcement) && (
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
                
                {/* Reactions Section */}
                <div className="mt-4">
                  <EmojiPicker
                    onReactionToggle={(emoji) => handleReactionToggle('announcement', announcement.id, emoji)}
                    currentReactions={getReactionSummary(announcement.reactions || [])}
                  />
                </div>
                
                {/* Reply Section */}
                <div className="mt-4 border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplies(announcement.id)}
                    className="mb-2"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {announcement.replies?.length || 0} {announcement.replies?.length === 1 ? 'Reply' : 'Replies'}
                    {showReplies[announcement.id] ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>

                  {showReplies[announcement.id] && (
                    <div className="space-y-3">
                      {/* Existing Replies */}
                      {announcement.replies && announcement.replies.length > 0 && (
                        <div className="space-y-3">
                          {announcement.replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-muted">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={reply.author.user.image || ''} />
                                <AvatarFallback>
                                  {reply.author.user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {reply.author.user.name || reply.author.user.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDateTime(reply.createdAt)}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                                {/* Reply Reactions */}
                                <div className="mt-2">
                                  <EmojiPicker
                                    onReactionToggle={(emoji) => handleReactionToggle('reply', reply.id, emoji)}
                                    currentReactions={getReactionSummary(reply.reactions || [])}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      <div className="flex gap-2 mt-3 items-center">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={user.image || ''} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2 items-center">
                          <Input
                            placeholder="Write a reply..."
                            value={replyContent[announcement.id] || ''}
                            onChange={(e) =>
                              setReplyContent({
                                ...replyContent,
                                [announcement.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handlePostReply(announcement.id)
                              }
                            }}
                            disabled={postingReply[announcement.id]}
                          />
                          <Button
                            size="sm"
                            onClick={() => handlePostReply(announcement.id)}
                            disabled={
                              !replyContent[announcement.id]?.trim() ||
                              postingReply[announcement.id]
                            }
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

