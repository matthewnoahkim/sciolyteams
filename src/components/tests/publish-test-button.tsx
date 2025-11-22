'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Send } from 'lucide-react'

interface PublishTestButtonProps {
  testId: string
  teamId: string
  currentStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  questionCount: number
}

export function PublishTestButton({
  testId,
  teamId,
  currentStatus,
  questionCount,
}: PublishTestButtonProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [formData, setFormData] = useState({
    startAt: '',
    endAt: '',
    testPassword: '',
    testPasswordConfirm: '',
    releaseScoresAt: '',
  })

  const handlePublish = async () => {
    if (questionCount === 0) {
      toast({
        title: 'Cannot Publish',
        description: 'Test must have at least one question before publishing',
        variant: 'destructive',
      })
      return
    }

    if (!formData.startAt || !formData.endAt) {
      toast({
        title: 'Error',
        description: 'Start and end times are required',
        variant: 'destructive',
      })
      return
    }

    const start = new Date(formData.startAt)
    const end = new Date(formData.endAt)
    if (end <= start) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      })
      return
    }

    if (formData.testPassword) {
      if (formData.testPassword.length < 6) {
        toast({
          title: 'Error',
          description: 'Test password must be at least 6 characters',
          variant: 'destructive',
        })
        return
      }

      if (!formData.testPasswordConfirm) {
        toast({
          title: 'Error',
          description: 'Please confirm the password',
          variant: 'destructive',
        })
        return
      }

      if (formData.testPassword !== formData.testPasswordConfirm) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        })
        return
      }
    }

    setPublishing(true)
    try {
      // Convert datetime-local format to ISO string
      const startAtISO = formData.startAt ? new Date(formData.startAt).toISOString() : undefined
      const endAtISO = formData.endAt ? new Date(formData.endAt).toISOString() : undefined
      const releaseScoresAtISO = formData.releaseScoresAt && formData.releaseScoresAt.trim() 
        ? new Date(formData.releaseScoresAt).toISOString() 
        : undefined

      const response = await fetch(`/api/tests/${testId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: startAtISO,
          endAt: endAtISO,
          testPassword: formData.testPassword || undefined,
          releaseScoresAt: releaseScoresAtISO,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.message 
          ? `${data.error}: ${data.message}` 
          : data.error || 'Failed to publish test'
        throw new Error(errorMsg)
      }

      toast({
        title: 'Test Published',
        description: 'The test is now visible to assigned members',
      })

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish test',
        variant: 'destructive',
      })
    } finally {
      setPublishing(false)
    }
  }

  if (currentStatus === 'PUBLISHED') {
    return null
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={questionCount === 0}>
        <Send className="h-4 w-4 mr-2" />
        Publish Test
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Test</DialogTitle>
            <DialogDescription>
              Schedule the test and set a password if needed. Students will need the password to take the test.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {questionCount === 0 && (
              <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200">
                This test has no questions. Add at least one question before publishing.
              </div>
            )}

            <div>
              <Label htmlFor="startAt">Start Date/Time *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, startAt: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endAt">End Date/Time *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, endAt: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="testPassword">Test Password (optional)</Label>
              <Input
                id="testPassword"
                type="password"
                value={formData.testPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, testPassword: e.target.value }))}
                placeholder="Students need this to take the test"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If set, students will need to enter this password to start the test.
              </p>
            </div>

            {formData.testPassword && (
              <div>
                <Label htmlFor="testPasswordConfirm">Confirm Password</Label>
                <Input
                  id="testPasswordConfirm"
                  type="password"
                  value={formData.testPasswordConfirm}
                  onChange={(e) => setFormData((prev) => ({ ...prev, testPasswordConfirm: e.target.value }))}
                  placeholder="Confirm password"
                />
              </div>
            )}

            <div>
              <Label htmlFor="releaseScoresAt">Release Scores (optional)</Label>
              <Input
                id="releaseScoresAt"
                type="datetime-local"
                value={formData.releaseScoresAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, releaseScoresAt: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                When to automatically release scores to students. Leave empty for manual release.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || questionCount === 0}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
