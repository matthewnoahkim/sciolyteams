'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDateTime } from '@/lib/utils'
import { Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react'

interface CalendarTabProps {
  teamId: string
  currentMembership: any
  isCaptain: boolean
}

export function CalendarTab({ teamId, currentMembership, isCaptain }: CalendarTabProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [subteams, setSubteams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  
  const getInitialFormData = () => ({
    title: '',
    description: '',
    startUTC: '',
    endUTC: '',
    location: '',
    scope: 'PERSONAL' as 'PERSONAL' | 'SUBTEAM' | 'TEAM',
    subteamId: '',
    attendeeId: currentMembership.id,
  })
  
  const [formData, setFormData] = useState(getInitialFormData())

  useEffect(() => {
    fetchEvents()
    fetchSubteams()
  }, [teamId])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/calendar?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubteams = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/subteams`)
      if (response.ok) {
        const data = await response.json()
        setSubteams(data.subteams)
      }
    } catch (error) {
      console.error('Failed to fetch subteams:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert datetime-local format to ISO 8601 format
      const startISO = new Date(formData.startUTC).toISOString()
      const endISO = new Date(formData.endUTC).toISOString()

      // Build payload with proper handling of optional fields
      const payload: any = {
        teamId,
        scope: formData.scope,
        title: formData.title,
        startUTC: startISO,
        endUTC: endISO,
      }

      // Add optional description and location if provided
      if (formData.description) {
        payload.description = formData.description
      }
      if (formData.location) {
        payload.location = formData.location
      }
      
      // Add scope-specific fields
      if (formData.scope === 'SUBTEAM') {
        if (formData.subteamId) {
          payload.subteamId = formData.subteamId
        }
      } else if (formData.scope === 'PERSONAL') {
        // attendeeId is required for PERSONAL scope
        payload.attendeeId = formData.attendeeId
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      toast({
        title: 'Event created',
        description: formData.title,
      })

      setCreateOpen(false)
      setFormData(getInitialFormData())
      fetchEvents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete event')
      }

      toast({
        title: 'Event deleted',
        description: 'The calendar event has been removed',
      })

      fetchEvents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      })
    }
  }

  const canDeleteEvent = (event: any) => {
    // Can delete if you're the creator or a captain
    return event.creatorId === currentMembership.id || isCaptain
  }

  const getScopeBadge = (event: any) => {
    switch (event.scope) {
      case 'TEAM':
        return <Badge variant="default">TEAM</Badge>
      case 'SUBTEAM':
        return <Badge variant="secondary">{event.subteam?.name || 'SUBTEAM'}</Badge>
      case 'PERSONAL':
        return <Badge variant="outline">PERSONAL</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Calendar Events</h3>
        <Button onClick={() => {
          setFormData(getInitialFormData())
          setCreateOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading events...
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No events scheduled
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {event.title}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(event.startUTC)} - {formatDateTime(event.endUTC)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created by {event.creator?.user?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScopeBadge(event)}
                    {canDeleteEvent(event) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {(event.description || event.location) && (
                <CardContent className="space-y-2">
                  {event.description && (
                    <p className="text-sm">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startUTC">Start Date & Time</Label>
                  <Input
                    id="startUTC"
                    type="datetime-local"
                    value={formData.startUTC}
                    onChange={(e) => setFormData({ ...formData, startUTC: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endUTC">End Date & Time</Label>
                  <Input
                    id="endUTC"
                    type="datetime-local"
                    value={formData.endUTC}
                    onChange={(e) => setFormData({ ...formData, endUTC: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Scope</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scope"
                      value="PERSONAL"
                      checked={formData.scope === 'PERSONAL'}
                      onChange={(e) => setFormData({ ...formData, scope: 'PERSONAL', subteamId: '' })}
                    />
                    <span className="text-sm">Personal event</span>
                  </label>
                  {isCaptain && (
                    <>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="scope"
                          value="TEAM"
                          checked={formData.scope === 'TEAM'}
                          onChange={(e) => setFormData({ ...formData, scope: 'TEAM', subteamId: '' })}
                        />
                        <span className="text-sm">Entire team</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="scope"
                          value="SUBTEAM"
                          checked={formData.scope === 'SUBTEAM'}
                          onChange={(e) => setFormData({ ...formData, scope: 'SUBTEAM', subteamId: '' })}
                        />
                        <span className="text-sm">Specific subteam</span>
                      </label>
                    </>
                  )}
                </div>
                {formData.scope === 'SUBTEAM' && (
                  <div className="mt-3">
                    <Label htmlFor="subteam">Select Subteam</Label>
                    <select
                      id="subteam"
                      value={formData.subteamId}
                      onChange={(e) => setFormData({ ...formData, subteamId: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a subteam...</option>
                      {subteams.map((subteam) => (
                        <option key={subteam.id} value={subteam.id}>
                          {subteam.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setCreateOpen(false)
                setFormData(getInitialFormData())
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

