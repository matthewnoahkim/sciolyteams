'use client'

import { useState, useEffect } from 'react'
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
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'

interface CalendarTabProps {
  teamId: string
  currentMembership: any
  isCaptain: boolean
}

type ViewMode = 'month' | 'week'

export function CalendarTab({ teamId, currentMembership, isCaptain }: CalendarTabProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [subteams, setSubteams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false)
  
  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const getInitialFormData = (prefilledDate?: Date) => {
    const start = prefilledDate ? new Date(prefilledDate) : new Date()
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    
    return {
      title: '',
      description: '',
      startUTC: formatDateTimeLocal(start),
      endUTC: formatDateTimeLocal(end),
      location: '',
      scope: 'PERSONAL' as 'PERSONAL' | 'SUBTEAM' | 'TEAM',
      subteamId: '',
      attendeeId: currentMembership.id,
    }
  }
  
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
      const startISO = new Date(formData.startUTC).toISOString()
      const endISO = new Date(formData.endUTC).toISOString()

      const payload: any = {
        teamId,
        scope: formData.scope,
        title: formData.title,
        startUTC: startISO,
        endUTC: endISO,
      }

      if (formData.description) {
        payload.description = formData.description
      }
      if (formData.location) {
        payload.location = formData.location
      }
      
      if (formData.scope === 'SUBTEAM') {
        if (formData.subteamId) {
          payload.subteamId = formData.subteamId
        }
      } else if (formData.scope === 'PERSONAL') {
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return

    setLoading(true)

    try {
      const startISO = new Date(formData.startUTC).toISOString()
      const endISO = new Date(formData.endUTC).toISOString()

      const payload: any = {
        title: formData.title,
        description: formData.description,
        startUTC: startISO,
        endUTC: endISO,
        location: formData.location,
        scope: formData.scope,
      }

      if (formData.scope === 'SUBTEAM') {
        payload.subteamId = formData.subteamId || null
      } else {
        payload.subteamId = null
      }

      const response = await fetch(`/api/calendar/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update event')
      }

      toast({
        title: 'Event updated',
        description: formData.title,
      })

      setEditOpen(false)
      setEventDetailsOpen(false)
      setSelectedEvent(null)
      setFormData(getInitialFormData())
      fetchEvents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
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

      setEventDetailsOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      })
    }
  }

  const canEditEvent = (event: any) => {
    // User can edit their own events
    if (event.creatorId === currentMembership.id) return true
    // Captains can edit all events except personal events made by others
    if (isCaptain && event.scope !== 'PERSONAL') return true
    return false
  }

  const canDeleteEvent = (event: any) => {
    // User can delete their own events
    if (event.creatorId === currentMembership.id) return true
    // Captains can delete all events except personal events made by others
    if (isCaptain && event.scope !== 'PERSONAL') return true
    return false
  }

  const getScopeBadge = (event: any) => {
    switch (event.scope) {
      case 'TEAM':
        return <Badge variant="default" className="text-xs">CLUB</Badge>
      case 'SUBTEAM':
        return <Badge variant="secondary" className="text-xs">{event.subteam?.name || 'SUBTEAM'}</Badge>
      case 'PERSONAL':
        return <Badge variant="outline" className="text-xs">PERSONAL</Badge>
    }
  }

  const getEventColor = (event: any) => {
    switch (event.scope) {
      case 'TEAM':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'SUBTEAM':
        return 'bg-purple-500 hover:bg-purple-600 text-white'
      case 'PERSONAL':
        return 'bg-green-500 hover:bg-green-600 text-white'
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white'
    }
  }

  // Calendar generation functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getWeekDates = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day
    const sunday = new Date(date)
    sunday.setDate(diff)
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday)
      day.setDate(sunday.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getWeekRange = (date: Date) => {
    const weekDates = getWeekDates(date)
    const start = weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} - ${end}`
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startUTC)
      return isSameDay(eventStart, date)
    })
  }

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    }
  }

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (date: Date) => {
    setFormData(getInitialFormData(date))
    setCreateOpen(true)
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setEventDetailsOpen(true)
  }

  const handleEditClick = (event: any) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      startUTC: formatDateTimeLocal(new Date(event.startUTC)),
      endUTC: formatDateTimeLocal(new Date(event.endUTC)),
      location: event.location || '',
      scope: event.scope,
      subteamId: event.subteamId || '',
      attendeeId: event.attendeeId || currentMembership.id,
    })
    setEventDetailsOpen(false)
    setEditOpen(true)
  }

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    const today = new Date()

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] border border-border bg-muted/20" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDay(date)
      const isToday = isSameDay(date, today)

      days.push(
        <div
          key={day}
          className="min-h-[120px] border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors p-2"
          onClick={() => handleDayClick(date)}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${getEventColor(event)} cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEventClick(event)
                }}
              >
                {new Date(event.startUTC).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-muted p-2 text-center font-semibold text-sm border-b border-border">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate)
    const today = new Date()
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 gap-0">
          <div className="bg-muted p-2 border-b border-r border-border" />
          {weekDates.map((date) => {
            const isToday = isSameDay(date, today)
            return (
              <div
                key={date.toISOString()}
                className={`bg-muted p-2 text-center border-b border-border ${isToday ? 'bg-primary/10' : ''}`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-0">
              <div className="p-2 text-xs text-muted-foreground text-right border-r border-border">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDates.map((date) => {
                const slotDate = new Date(date)
                slotDate.setHours(hour, 0, 0, 0)
                const slotEvents = events.filter((event) => {
                  const eventStart = new Date(event.startUTC)
                  return (
                    isSameDay(eventStart, date) &&
                    eventStart.getHours() === hour
                  )
                })

                return (
                  <div
                    key={`${date.toISOString()}-${hour}`}
                    className="min-h-[60px] border-b border-r border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors p-1"
                    onClick={() => handleDayClick(slotDate)}
                  >
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded mb-1 ${getEventColor(event)} cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-xs opacity-90">
                          {new Date(event.startUTC).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold">
            {viewMode === 'month' ? getMonthYear(currentDate) : getWeekRange(currentDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-none"
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none"
            >
              Week
            </Button>
          </div>
          <Button onClick={() => {
            setFormData(getInitialFormData())
            setCreateOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-[400px] border rounded-lg">
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : (
        renderWeekView()
      )}

      {/* Create Event Dialog */}
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
                        <span className="text-sm">Entire club</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="scope"
                          value="SUBTEAM"
                          checked={formData.scope === 'SUBTEAM'}
                          onChange={(e) => setFormData({ ...formData, scope: 'SUBTEAM', subteamId: '' })}
                        />
                        <span className="text-sm">Specific team</span>
                      </label>
                    </>
                  )}
                </div>
                {formData.scope === 'SUBTEAM' && (
                  <div className="mt-3">
                    <Label htmlFor="subteam">Select Team</Label>
                    <select
                      id="subteam"
                      value={formData.subteamId}
                      onChange={(e) => setFormData({ ...formData, subteamId: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a team...</option>
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

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">When</p>
                  <p className="text-sm">
                    {new Date(selectedEvent.startUTC).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                    {' - '}
                    {new Date(selectedEvent.endUTC).toLocaleString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>

                {selectedEvent.location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                    <p className="text-sm">{selectedEvent.location}</p>
                  </div>
                )}

                {selectedEvent.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                  {getScopeBadge(selectedEvent)}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Created by</p>
                  <p className="text-sm">{selectedEvent.creator?.user?.name || 'Unknown'}</p>
                </div>
              </div>
              {(canEditEvent(selectedEvent) || canDeleteEvent(selectedEvent)) && (
                <DialogFooter className="flex gap-2">
                  {canEditEvent(selectedEvent) && (
                    <Button
                      variant="outline"
                      onClick={() => handleEditClick(selectedEvent)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Event
                    </Button>
                  )}
                  {canDeleteEvent(selectedEvent) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedEvent.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Event
                    </Button>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (optional)</Label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startUTC">Start Date & Time</Label>
                  <Input
                    id="edit-startUTC"
                    type="datetime-local"
                    value={formData.startUTC}
                    onChange={(e) => setFormData({ ...formData, startUTC: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endUTC">End Date & Time</Label>
                  <Input
                    id="edit-endUTC"
                    type="datetime-local"
                    value={formData.endUTC}
                    onChange={(e) => setFormData({ ...formData, endUTC: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location">Location (optional)</Label>
                <Input
                  id="edit-location"
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
                      name="edit-scope"
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
                          name="edit-scope"
                          value="TEAM"
                          checked={formData.scope === 'TEAM'}
                          onChange={(e) => setFormData({ ...formData, scope: 'TEAM', subteamId: '' })}
                        />
                        <span className="text-sm">Entire club</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="edit-scope"
                          value="SUBTEAM"
                          checked={formData.scope === 'SUBTEAM'}
                          onChange={(e) => setFormData({ ...formData, scope: 'SUBTEAM', subteamId: '' })}
                        />
                        <span className="text-sm">Specific team</span>
                      </label>
                    </>
                  )}
                </div>
                {formData.scope === 'SUBTEAM' && (
                  <div className="mt-3">
                    <Label htmlFor="edit-subteam">Select Team</Label>
                    <select
                      id="edit-subteam"
                      value={formData.subteamId}
                      onChange={(e) => setFormData({ ...formData, subteamId: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a team...</option>
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
                setEditOpen(false)
                setSelectedEvent(null)
                setFormData(getInitialFormData())
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
