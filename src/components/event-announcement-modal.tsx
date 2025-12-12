'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface EventAnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (postToStream: boolean, sendEmail: boolean) => void
  eventTitle: string
  eventScope: 'CLUB' | 'TEAM'
  teamName?: string
}

export function EventAnnouncementModal({
  open,
  onOpenChange,
  onConfirm,
  eventTitle,
  eventScope,
  teamName,
}: EventAnnouncementModalProps) {
  const [postToStream, setPostToStream] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)

  const handleConfirm = () => {
    onConfirm(postToStream, sendEmail)
    onOpenChange(false)
    // Reset for next time
    setPostToStream(true)
    setSendEmail(false)
  }

  const handleSkip = () => {
    onOpenChange(false)
    // Reset for next time
    setPostToStream(true)
    setSendEmail(false)
  }

  const scopeText = eventScope === 'CLUB' ? 'entire club' : teamName ? `${teamName}` : 'team'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post Event to Stream?</DialogTitle>
          <DialogDescription>
            You&apos;ve created &ldquo;{eventTitle}&rdquo; for the {scopeText}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="postToStream"
              checked={postToStream}
              onCheckedChange={(checked) => setPostToStream(checked as boolean)}
            />
            <Label htmlFor="postToStream" className="cursor-pointer font-normal">
              Post this event to the team stream
            </Label>
          </div>
          {postToStream && (
            <div className="flex items-center gap-2 pl-6">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="cursor-pointer font-normal">
                Send email notification to everyone
              </Label>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {postToStream
              ? 'Team members will see the event details and can RSVP directly from the stream.'
              : 'The event will only be visible in the calendar.'}
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleConfirm} disabled={!postToStream}>
            {postToStream ? 'Post to Stream' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


