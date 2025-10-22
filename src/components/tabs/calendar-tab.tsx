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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Check, X as XIcon, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EventAnnouncementModal } from '@/components/event-announcement-modal'

interface CalendarTabProps {
  teamId: string
  currentMembership: any
  isCaptain: boolean
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

type ViewMode = 'month' | 'week'

export function CalendarTab({ teamId, currentMembership, isCaptain, user }: CalendarTabProps) {
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<any>(null)
  const [rsvping, setRsvping] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<any>(null)
  
  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const getInitialFormData = (prefilledDate?: Date, isAllDay: boolean = false) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    
    // Use prefilled date if provided, otherwise use today's date
    const start = prefilledDate ? new Date(prefilledDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Determine suggested hour
    let suggestedHour: number
    if (prefilledDate && prefilledDate.getHours() !== 0) {
      // If a specific time was clicked (with non-zero hour), use that exact time
      suggestedHour = prefilledDate.getHours()
    } else {
      // For "New Event" button or month view day clicks, suggest the next complete hour
      // If it's 7:30, suggest 8:00-9:00
      if (currentMinutes > 0) {
        suggestedHour = currentHour + 1
      } else {
        // If exactly on the hour (7:00), suggest current hour
        suggestedHour = currentHour
      }
    }
    
    start.setHours(suggestedHour, 0, 0, 0)
    const end = new Date(start)
    
    // Handle hour overflow (23:00 -> 00:00 next day)
    const endHour = suggestedHour + 1
    if (endHour >= 24) {
      end.setDate(end.getDate() + 1)
      end.setHours(endHour - 24, 0, 0, 0)
    } else {
      end.setHours(endHour, 0, 0, 0)
    }
    
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      title: '',
      description: '',
      date: formatDateLocal(start), // YYYY-MM-DD format in local timezone
      startTime: `${String(suggestedHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour >= 24 ? endHour - 24 : endHour).padStart(2, '0')}:00`,
      isAllDay: isAllDay,
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
      location: '',
      color: '#3b82f6', // Default blue
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
      let startISO: string
      let endISO: string

      if (formData.isAllDay) {
        // All day event - start at 00:00, end at 23:59
        const startDate = new Date(formData.startDate + 'T00:00:00')
        const endDate = new Date(formData.endDate + 'T23:59:59')
        
        // Validate that end date is not before start date
        if (endDate < startDate) {
          throw new Error('End date cannot be before start date')
        }
        
        startISO = startDate.toISOString()
        endISO = endDate.toISOString()
      } else {
        // Regular event with specific time
        const startDateTime = new Date(formData.date + 'T' + formData.startTime + ':00')
        const endDateTime = new Date(formData.date + 'T' + formData.endTime + ':00')
        
        // Validate that end time is not before start time
        if (endDateTime <= startDateTime) {
          throw new Error('End time must be after start time')
        }
        
        startISO = startDateTime.toISOString()
        endISO = endDateTime.toISOString()
      }

      const payload: any = {
        teamId,
        scope: formData.scope,
        title: formData.title,
        startUTC: startISO,
        endUTC: endISO,
        color: formData.color,
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

      const data = await response.json()
      const newEvent = data.event

      toast({
        title: 'Event created',
        description: formData.title,
      })

      setCreateOpen(false)
      const createdFormData = { ...formData }
      setFormData(getInitialFormData())
      fetchEvents()

      // Show announcement modal for TEAM or SUBTEAM events created by captains
      if (isCaptain && (createdFormData.scope === 'TEAM' || createdFormData.scope === 'SUBTEAM')) {
        setCreatedEvent({ ...newEvent, formData: createdFormData })
        setShowAnnouncementModal(true)
      }
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
      let startISO: string
      let endISO: string

      if (formData.isAllDay) {
        // All day event - start at 00:00, end at 23:59
        const startDate = new Date(formData.startDate + 'T00:00:00')
        const endDate = new Date(formData.endDate + 'T23:59:59')
        
        // Validate that end date is not before start date
        if (endDate < startDate) {
          throw new Error('End date cannot be before start date')
        }
        
        startISO = startDate.toISOString()
        endISO = endDate.toISOString()
      } else {
        // Regular event with specific time
        const startDateTime = new Date(formData.date + 'T' + formData.startTime + ':00')
        const endDateTime = new Date(formData.date + 'T' + formData.endTime + ':00')
        
        // Validate that end time is not before start time
        if (endDateTime <= startDateTime) {
          throw new Error('End time must be after start time')
        }
        
        startISO = startDateTime.toISOString()
        endISO = endDateTime.toISOString()
      }

      const payload: any = {
        title: formData.title,
        description: formData.description,
        startUTC: startISO,
        endUTC: endISO,
        location: formData.location,
        color: formData.color,
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

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/calendar/${eventToDelete}`, {
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
    } finally {
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  const canEditEvent = (event: any) => {
    // Only the creator can edit their own events
    return event.creatorId === currentMembership.id
  }

  const canDeleteEvent = (event: any) => {
    // User can delete their own events
    if (event.creatorId === currentMembership.id) return true
    // Captains can delete any team/club events (not personal events made by others)
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
    // Use custom color if available, otherwise fall back to scope-based colors
    if (event.color) {
      return ''  // We'll use inline styles instead
    }
    
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
  
  const getEventStyle = (event: any) => {
    if (event.color) {
      console.log('Event color:', event.color, 'for event:', event.title)
      return {
        backgroundColor: event.color,
        color: '#ffffff',
      }
    }
    return {}
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
      const eventEnd = new Date(event.endUTC)
      
      // Normalize dates to just the date part (no time) for comparison
      const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
      const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
      const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      // Check if the date falls within the event's date range
      return currentDate >= eventStartDate && currentDate <= eventEndDate
    }).sort((a, b) => {
      const aStart = new Date(a.startUTC)
      const aEnd = new Date(a.endUTC)
      const bStart = new Date(b.startUTC)
      const bEnd = new Date(b.endUTC)
      
      // Check if events are all-day
      const aIsAllDay = aStart.getHours() === 0 && aStart.getMinutes() === 0 && 
                        aEnd.getHours() === 23 && aEnd.getMinutes() === 59
      const bIsAllDay = bStart.getHours() === 0 && bStart.getMinutes() === 0 && 
                        bEnd.getHours() === 23 && bEnd.getMinutes() === 59
      
      // Calculate duration in days (fix: use proper date difference)
      const aDuration = Math.ceil((aEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const bDuration = Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // Check if events are multi-day
      const aIsMultiDay = aDuration > 1
      const bIsMultiDay = bDuration > 1
      
      // Prioritize multi-day events over single-day events
      if (aIsMultiDay && !bIsMultiDay) return -1
      if (!aIsMultiDay && bIsMultiDay) return 1
      
      // If both are multi-day, prioritize longer duration
      if (aIsMultiDay && bIsMultiDay && aDuration !== bDuration) {
        return bDuration - aDuration
      }
      
      // If both are single-day, prioritize all-day events
      if (!aIsMultiDay && !bIsMultiDay) {
        if (aIsAllDay && !bIsAllDay) return -1
        if (!aIsAllDay && bIsAllDay) return 1
      }
      
      // For same duration or same type, sort by start time
      return aStart.getTime() - bStart.getTime()
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
    
    const startDate = new Date(event.startUTC)
    const endDate = new Date(event.endUTC)
    
    // Check if it's an all-day event (starts at 00:00 and ends at 23:59)
    const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
                     endDate.getHours() === 23 && endDate.getMinutes() === 59
    
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setFormData({
      title: event.title,
      description: event.description || '',
      date: formatDateLocal(startDate),
      startTime: isAllDay ? '09:00' : startDate.toTimeString().slice(0, 5),
      endTime: isAllDay ? '17:00' : endDate.toTimeString().slice(0, 5),
      isAllDay: isAllDay,
      startDate: formatDateLocal(startDate),
      endDate: formatDateLocal(endDate),
      location: event.location || '',
      color: event.color || '#3b82f6', // Preserve existing color or default to blue
      scope: event.scope,
      subteamId: event.subteamId || '',
      attendeeId: event.attendeeId || currentMembership.id,
    })
    setEventDetailsOpen(false)
    setEditOpen(true)
  }

  const handleRSVP = async (eventId: string, status: 'YES' | 'NO') => {
    setRsvping(true)
    
    // Optimistic update
    const currentEvent = events.find(e => e.id === eventId)
    if (currentEvent) {
      const optimisticEvents = events.map(e => {
        if (e.id === eventId) {
          const existingRsvp = e.rsvps?.find((r: any) => r.userId === user.id)
          const newRsvps = existingRsvp
            ? e.rsvps.map((r: any) => r.userId === user.id ? { ...r, status } : r)
            : [...(e.rsvps || []), { id: 'temp', userId: user.id, status, user }]
          return { ...e, rsvps: newRsvps }
        }
        return e
      })
      setEvents(optimisticEvents)
      
      // Update selected event if it's the one being RSVP'd
      if (selectedEvent?.id === eventId) {
        const updatedEvent = optimisticEvents.find(e => e.id === eventId)
        if (updatedEvent) setSelectedEvent(updatedEvent)
      }
    }

    try {
      const response = await fetch(`/api/calendar/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to RSVP')
      }

      // Refresh events to get accurate data
      await fetchEvents()
      
      toast({
        title: status === 'YES' ? 'RSVP: Going' : 'RSVP: Not Going',
      })
    } catch (error) {
      // Revert optimistic update on error
      await fetchEvents()
      toast({
        title: 'Error',
        description: 'Failed to update RSVP',
        variant: 'destructive',
      })
    } finally {
      setRsvping(false)
    }
  }

  const handleRemoveRSVP = async (eventId: string) => {
    setRsvping(true)
    
    // Optimistic update
    const optimisticEvents = events.map(e => {
      if (e.id === eventId) {
        return { ...e, rsvps: e.rsvps?.filter((r: any) => r.userId !== user.id) || [] }
      }
      return e
    })
    setEvents(optimisticEvents)
    
    // Update selected event if it's the one being updated
    if (selectedEvent?.id === eventId) {
      const updatedEvent = optimisticEvents.find(e => e.id === eventId)
      if (updatedEvent) setSelectedEvent(updatedEvent)
    }

    try {
      const response = await fetch(`/api/calendar/${eventId}/rsvp`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove RSVP')
      }

      // Refresh events to get accurate data
      await fetchEvents()
      
      toast({
        title: 'RSVP removed',
      })
    } catch (error) {
      // Revert optimistic update on error
      await fetchEvents()
      toast({
        title: 'Error',
        description: 'Failed to remove RSVP',
        variant: 'destructive',
      })
    } finally {
      setRsvping(false)
    }
  }

  const getUserRSVP = (event: any) => {
    return event.rsvps?.find((r: any) => r.userId === user.id)
  }

  const getRSVPCounts = (event: any) => {
    const yesCount = event.rsvps?.filter((r: any) => r.status === 'YES').length || 0
    const noCount = event.rsvps?.filter((r: any) => r.status === 'NO').length || 0
    return { yesCount, noCount }
  }

  const handleAnnouncementConfirm = async (postToStream: boolean, sendEmail: boolean) => {
    if (!postToStream || !createdEvent) return

    try {
      // Content is just the event description - time/date/location will be pulled from calendarEvent
      const content = createdEvent.description || 'Event details coming soon!'

      // Determine scope and subteam IDs based on the event
      const scope = createdEvent.scope === 'TEAM' ? 'TEAM' : 'SUBTEAM'
      const subteamIds = createdEvent.scope === 'SUBTEAM' && createdEvent.subteamId 
        ? [createdEvent.subteamId] 
        : undefined

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          title: createdEvent.title,
          content,
          scope,
          subteamIds,
          sendEmail,
          calendarEventId: createdEvent.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create announcement')
      }

      toast({
        title: 'Posted to stream',
        description: sendEmail ? 'Email notifications are being sent.' : undefined,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post to stream',
        variant: 'destructive',
      })
    } finally {
      setCreatedEvent(null)
    }
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
          <div className="text-sm font-semibold mb-1">
            <span className={`${isToday ? 'bg-primary text-primary-foreground rounded-full px-2 py-1' : ''}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {dayEvents.map((event) => {
              const eventStart = new Date(event.startUTC)
              const eventEnd = new Date(event.endUTC)
              const isMultiDay = !isSameDay(eventStart, eventEnd)
              const isStartDay = isSameDay(eventStart, date)
              const isEndDay = isSameDay(eventEnd, date)
              
              return (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded truncate relative ${getEventColor(event)} ${event.color ? 'text-white' : ''} cursor-pointer ${
                    isMultiDay 
                      ? isStartDay 
                        ? 'rounded-l-md rounded-r-none border-r-2 border-r-white/30' 
                        : isEndDay 
                          ? 'rounded-r-md rounded-l-none border-l-2 border-l-white/30' 
                          : 'rounded-none border-x-2 border-x-white/30'
                      : 'rounded'
                  }`}
                  style={getEventStyle(event)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event)
                  }}
                >
                  {(() => {
                    // Check if it's an all-day event
                    const isAllDay = eventStart.getHours() === 0 && eventStart.getMinutes() === 0 && 
                                     eventEnd.getHours() === 23 && eventEnd.getMinutes() === 59
                    
                    if (isAllDay) {
                      // For all-day events, just show the title with continuation indicators
                      return (
                        <div className="flex items-center justify-between">
                          {!isStartDay && <span className="mr-1">←</span>}
                          <span className="truncate flex-1">{event.title}</span>
                          {!isEndDay && <span className="ml-1">→</span>}
                        </div>
                      )
                    }
                    
                    // For regular events, show time logic
                    if (isMultiDay) {
                      return (
                        <div className="flex items-center justify-between">
                          {!isStartDay && <span className="mr-1">←</span>}
                          <span className="truncate flex-1">
                            {isStartDay && (
                              <>
                                {eventStart.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })} {event.title}
                              </>
                            )}
                            {!isStartDay && !isEndDay && (
                              <>{event.title}</>
                            )}
                            {isEndDay && (
                              <>
                                {event.title} {eventEnd.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </>
                            )}
                          </span>
                          {!isEndDay && <span className="ml-1">→</span>}
                        </div>
                      )
                    } else {
                      return (
                        <>
                          {eventStart.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })} {event.title}
                        </>
                      )
                    }
                  })()}
                </div>
              )
            })}
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

  // Helper function to calculate overlapping event layouts (Google Calendar style)
  const calculateEventLayout = (events: any[]) => {
    if (events.length === 0) return []
    
    // Convert events to intervals with start/end times in minutes
    const intervals = events.map(event => {
      const start = new Date(event.startUTC)
      const end = new Date(event.endUTC)
      return {
        event,
        startMinutes: start.getHours() * 60 + start.getMinutes(),
        endMinutes: end.getHours() * 60 + end.getMinutes()
      }
    })
    
    // Sort by start time, then by duration (longer first)
    intervals.sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) {
        return a.startMinutes - b.startMinutes
      }
      return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes)
    })
    
    // Calculate columns for overlapping events
    const columns: any[][] = []
    const eventLayouts: Map<string, { column: number, totalColumns: number }> = new Map()
    
    intervals.forEach(interval => {
      // Find the first column where this event fits
      let placed = false
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex]
        const lastEvent = column[column.length - 1]
        
        // Check if this event starts after the last event in this column ends
        if (interval.startMinutes >= lastEvent.endMinutes) {
          column.push(interval)
          placed = true
          break
        }
      }
      
      // If no suitable column found, create a new one
      if (!placed) {
        columns.push([interval])
      }
    })
    
    // Calculate the total number of overlapping columns for each event
    intervals.forEach(interval => {
      let maxOverlap = 1
      
      // Find all events that overlap with this one
      intervals.forEach(other => {
        if (other.event.id === interval.event.id) return
        
        // Check if they overlap
        if (interval.startMinutes < other.endMinutes && interval.endMinutes > other.startMinutes) {
          // Find which column the other event is in
          for (let colIndex = 0; colIndex < columns.length; colIndex++) {
            if (columns[colIndex].some(e => e.event.id === other.event.id)) {
              maxOverlap = Math.max(maxOverlap, colIndex + 2) // +2 because we need both columns
              break
            }
          }
        }
      })
      
      // Find which column this event is in
      let eventColumn = 0
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        if (columns[colIndex].some(e => e.event.id === interval.event.id)) {
          eventColumn = colIndex
          break
        }
      }
      
      eventLayouts.set(interval.event.id, {
        column: eventColumn,
        totalColumns: maxOverlap
      })
    })
    
    return events.map(event => {
      const layout = eventLayouts.get(event.id) || { column: 0, totalColumns: 1 }
      return {
        event,
        column: layout.column,
        totalColumns: layout.totalColumns
      }
    })
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate)
    const today = new Date()
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 gap-0 pr-[15px]">
          <div className="bg-muted py-1 px-1 border-b border-r border-border" />
          {weekDates.map((date) => {
            const isToday = isSameDay(date, today)
            return (
              <div
                key={date.toISOString()}
                className={`bg-muted py-1 px-2 text-center border-b border-border ${isToday ? 'bg-primary/10' : ''}`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-base font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* All-day events section */}
        <div className="grid grid-cols-8 gap-0 border-b border-border pr-[15px]">
          <div className="py-1 px-1 text-xs text-muted-foreground text-right border-r border-border leading-tight flex items-center justify-end">
            All Day
          </div>
          {weekDates.map((date) => {
            const allDayEvents = events.filter((event) => {
              const eventStart = new Date(event.startUTC)
              const eventEnd = new Date(event.endUTC)
              
              // Check if it's an all-day event
              const isAllDay = eventStart.getHours() === 0 && eventStart.getMinutes() === 0 && 
                              eventEnd.getHours() === 23 && eventEnd.getMinutes() === 59
              
              if (!isAllDay) return false
              
              // Normalize dates for comparison
              const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
              const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
              const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
              
              // Show on all days it spans
              return currentDate >= eventStartDate && currentDate <= eventEndDate
            }).sort((a, b) => {
              const aStart = new Date(a.startUTC)
              const aEnd = new Date(a.endUTC)
              const bStart = new Date(b.startUTC)
              const bEnd = new Date(b.endUTC)
              
              // Calculate duration in days (fix: use proper end date and add 1)
              const aDuration = Math.ceil((aEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
              const bDuration = Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
              
              // Check if events are multi-day
              const aIsMultiDay = aDuration > 1
              const bIsMultiDay = bDuration > 1
              
              // Prioritize multi-day events over single-day events
              if (aIsMultiDay && !bIsMultiDay) return -1
              if (!aIsMultiDay && bIsMultiDay) return 1
              
              // If both are multi-day, prioritize longer duration
              if (aIsMultiDay && bIsMultiDay && aDuration !== bDuration) {
                return bDuration - aDuration
              }
              
              // For same duration or same type, sort by start time
              return aStart.getTime() - bStart.getTime()
            })

            return (
              <div
                key={date.toISOString()}
                className="min-h-[40px] border-r border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors p-1"
                onClick={() => {
                  const allDayDate = new Date(date)
                  allDayDate.setHours(0, 0, 0, 0)
                  setFormData(getInitialFormData(allDayDate, true))
                  setCreateOpen(true)
                }}
              >
                <div className="space-y-1">
                  {allDayEvents.map((event) => {
                    const eventStart = new Date(event.startUTC)
                    const eventEnd = new Date(event.endUTC)
                    const isMultiDay = !isSameDay(eventStart, eventEnd)
                    const isStartDay = isSameDay(eventStart, date)
                    const isEndDay = isSameDay(eventEnd, date)
                    
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded cursor-pointer relative ${getEventColor(event)} ${event.color ? 'text-white' : ''} ${
                          isMultiDay 
                            ? isStartDay 
                              ? 'rounded-l-md rounded-r-none border-r-2 border-r-white/30' 
                              : isEndDay 
                                ? 'rounded-r-md rounded-l-none border-l-2 border-l-white/30' 
                                : 'rounded-none border-x-2 border-x-white/30'
                            : 'rounded'
                        }`}
                        style={getEventStyle(event)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          {isMultiDay && !isStartDay && <span className="mr-1">←</span>}
                          <span className="truncate flex-1">{event.title}</span>
                          {isMultiDay && !isEndDay && <span className="ml-1">→</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-0">
              <div className="py-1 px-1 text-xs text-muted-foreground text-right border-r border-border leading-tight flex items-center justify-end">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDates.map((date) => {
                const slotDate = new Date(date)
                slotDate.setHours(hour, 0, 0, 0)
                const slotEvents = events.filter((event) => {
                  const eventStart = new Date(event.startUTC)
                  const eventEnd = new Date(event.endUTC)
                  
                  // Exclude all-day events (they're shown in the all-day section)
                  const isAllDay = eventStart.getHours() === 0 && eventStart.getMinutes() === 0 && 
                                  eventEnd.getHours() === 23 && eventEnd.getMinutes() === 59
                  if (isAllDay) return false
                  
                  // Normalize dates for comparison
                  const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
                  const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
                  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                  
                  // For multi-day events, show them on all days they span
                  // For single-day events, only show in the start hour slot (will span with CSS)
                  if (isSameDay(eventStart, eventEnd)) {
                    // Single day event - only show in start hour slot
                    return isSameDay(eventStart, date) && eventStart.getHours() === hour
                  } else {
                    // Multi-day event - show on all days it spans
                    return currentDate >= eventStartDate && currentDate <= eventEndDate
                  }
                }).sort((a, b) => {
                  const aStart = new Date(a.startUTC)
                  const aEnd = new Date(a.endUTC)
                  const bStart = new Date(b.startUTC)
                  const bEnd = new Date(b.endUTC)
                  
                  // Check if events are all-day
                  const aIsAllDay = aStart.getHours() === 0 && aStart.getMinutes() === 0 && 
                                    aEnd.getHours() === 23 && aEnd.getMinutes() === 59
                  const bIsAllDay = bStart.getHours() === 0 && bStart.getMinutes() === 0 && 
                                    bEnd.getHours() === 23 && bEnd.getMinutes() === 59
                  
                  // Calculate duration in days
                  const aDuration = Math.ceil((aEnd.getTime() - aStart.getTime()) / (1000 * 60 * 60 * 24))
                  const bDuration = Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24))
                  
                  // Prioritize all-day events
                  if (aIsAllDay && !bIsAllDay) return -1
                  if (!aIsAllDay && bIsAllDay) return 1
                  
                  // If both are all-day, prioritize longer duration
                  if (aIsAllDay && bIsAllDay) {
                    if (aDuration !== bDuration) return bDuration - aDuration
                  }
                  
                  // For regular events or same duration all-day events, sort by start time
                  return aStart.getTime() - bStart.getTime()
                })

                // Calculate event layouts for overlapping events
                const eventLayouts = calculateEventLayout(slotEvents)
                
                return (
                  <div
                    key={`${date.toISOString()}-${hour}`}
                    className="min-h-[35px] border-b border-r border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors relative"
                    style={{ padding: 0 }}
                    onClick={() => handleDayClick(slotDate)}
                  >
                    {eventLayouts.map(({ event, column, totalColumns }) => {
                      const eventStart = new Date(event.startUTC)
                      const eventEnd = new Date(event.endUTC)
                      const isMultiDay = !isSameDay(eventStart, eventEnd)
                      const isStartDay = isSameDay(eventStart, date)
                      const isEndDay = isSameDay(eventEnd, date)
                      
                      // Calculate event duration in minutes for single-day events
                      const eventDurationMinutes = isSameDay(eventStart, eventEnd) 
                        ? (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60) // Convert to minutes
                        : 60 // Default to 1 hour for multi-day events
                      
                      // Calculate precise height based on actual duration (35px per hour)
                      // Use much smaller minimum for very short events
                      let eventHeight: number
                      if (eventDurationMinutes < 5) {
                        eventHeight = 8 // Very thin line for 1-4 minute events
                      } else if (eventDurationMinutes < 15) {
                        eventHeight = 12 // Small line for 5-14 minute events
                      } else {
                        eventHeight = Math.max((eventDurationMinutes / 60) * 35, 16) // Proportional for longer events
                      }
                      
                      // Determine font size and layout based on height
                      let fontSize: string
                      let layout: 'compact' | 'normal' | 'minimal'
                      
                      if (eventHeight < 15) {
                        fontSize = 'text-[7px]'
                        layout = 'minimal'
                      } else if (eventHeight < 25) {
                        fontSize = 'text-[8px]'
                        layout = 'compact'
                      } else {
                        fontSize = 'text-[10px]'
                        layout = 'normal'
                      }
                      
                      // Calculate equal division of space - perfectly flush events
                      // Each event gets equal width: 100% / totalColumns
                      // Event 1: 0% to 50% (if 2 events)
                      // Event 2: 50% to 100% (if 2 events)
                      // Event 1: 0% to 33%, Event 2: 33% to 66%, Event 3: 66% to 100% (if 3 events)
                      const widthPercent = 100 / totalColumns
                      const leftPercent = (column * 100) / totalColumns
                      
                      return (
                        <div
                          key={event.id}
                          className={`relative ${getEventColor(event)} ${event.color ? 'text-white' : ''} cursor-pointer overflow-hidden ${
                            isMultiDay 
                              ? isStartDay 
                                ? 'rounded-l-md rounded-r-none' 
                                : isEndDay 
                                  ? 'rounded-r-md rounded-l-none' 
                                  : ''
                              : totalColumns === 1 ? 'rounded' : column === 0 ? 'rounded-l' : column === totalColumns - 1 ? 'rounded-r' : ''
                          }`}
                          style={{
                            ...getEventStyle(event),
                            height: `${eventHeight}px`,
                            minHeight: `${eventHeight}px`,
                            position: 'absolute',
                            top: '0',
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            zIndex: 10 + column,
                            padding: '2px 4px',
                            margin: 0,
                            border: 'none',
                            boxShadow: totalColumns > 1 && column < totalColumns - 1 ? 'inset -1px 0 0 rgba(255,255,255,0.3)' : 'none'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          {(() => {
                            const eventStart = new Date(event.startUTC)
                            const eventEnd = new Date(event.endUTC)
                            
                            // Check if it's an all-day event
                            const isAllDay = eventStart.getHours() === 0 && eventStart.getMinutes() === 0 && 
                                             eventEnd.getHours() === 23 && eventEnd.getMinutes() === 59
                            
                            if (isAllDay) {
                              // For all-day events, just show title
                              return (
                                <div className={`font-semibold truncate ${fontSize} leading-tight flex items-center`}>
                                  {isMultiDay && !isStartDay && <span className="mr-1">←</span>}
                                  <span className="truncate">{event.title}</span>
                                  {isMultiDay && !isEndDay && <span className="ml-1">→</span>}
                                </div>
                              )
                            }
                            
                            // For regular events, show time logic
                            if (isMultiDay && !isStartDay) {
                              // For middle days of multi-day events, don't show time
                              return (
                                <div className={`font-semibold truncate ${fontSize} leading-tight flex items-center`}>
                                  <span className="mr-1">←</span>
                                  <span className="truncate">{event.title}</span>
                                  {!isEndDay && <span className="ml-1">→</span>}
                                </div>
                              )
                            } else {
                              // Show start - end time format
                              const startTime = eventStart.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })
                              const endTime = eventEnd.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })
                              
                              if (layout === 'minimal') {
                                // For very short events, show only title
                                return (
                                  <div className={`font-semibold truncate ${fontSize} leading-tight flex items-center`} title={event.title}>
                                    <span className="truncate">{event.title}</span>
                                    {isMultiDay && !isEndDay && <span className="ml-1">→</span>}
                                  </div>
                                )
                              } else {
                                // For all other events, put title and time on same line
                                return (
                                  <div className={`${fontSize} leading-tight flex items-center gap-1 overflow-hidden`}>
                                    <span className="font-semibold truncate flex-shrink min-w-0" title={event.title}>
                                      {event.title}
                                    </span>
                                    <span className="opacity-90 whitespace-nowrap flex-shrink-0" title={`${startTime} - ${endTime}`}>
                                      {startTime} - {endTime}
                                    </span>
                                    {isMultiDay && !isEndDay && <span className="ml-1">→</span>}
                                  </div>
                                )
                              }
                            }
                          })()}
                        </div>
                      )
                    })}
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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAllDay"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                  />
                  <Label htmlFor="isAllDay">All day event</Label>
                </div>
                
                {formData.isAllDay ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
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
                <Label htmlFor="color">Event Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer border border-input"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select ${color}`}
                      />
                    ))}
                  </div>
                </div>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">When</p>
                  <p className="text-sm">
                    {(() => {
                      const start = new Date(selectedEvent.startUTC)
                      const end = new Date(selectedEvent.endUTC)
                      
                      // Check if it's an all-day event
                      const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && 
                                       end.getHours() === 23 && end.getMinutes() === 59
                      
                      if (isAllDay) {
                        // If same day, show just one day
                        if (start.toDateString() === end.toDateString()) {
                          return start.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        } else {
                          // Show day-day format with full month and year
                          const startDay = start.getDate()
                          const endDay = end.getDate()
                          const startMonth = start.toLocaleDateString('en-US', { month: 'long' })
                          const endMonth = end.toLocaleDateString('en-US', { month: 'long' })
                          const startYear = start.getFullYear()
                          const endYear = end.getFullYear()
                          
                          // If same month and year
                          if (startMonth === endMonth && startYear === endYear) {
                            return `${startMonth} ${startDay}-${endDay}, ${startYear}`
                          }
                          // If same year but different months
                          else if (startYear === endYear) {
                            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
                          }
                          // Different years
                          else {
                            return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
                          }
                        }
                      }
                      
                      // For regular events, show full date and time
                      return (
                        <>
                          {start.toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                          {' - '}
                          {end.toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </>
                      )
                    })()}
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

                {/* RSVP Section */}
                {selectedEvent.scope !== 'PERSONAL' && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Your RSVP</p>
                    <div className="flex gap-2 mb-4">
                      {(() => {
                        const userRsvp = getUserRSVP(selectedEvent)
                        return (
                          <>
                            <Button
                              size="sm"
                              variant={userRsvp?.status === 'YES' ? 'default' : 'outline'}
                              onClick={() => handleRSVP(selectedEvent.id, 'YES')}
                              disabled={rsvping}
                              className="flex-1"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Going
                            </Button>
                            <Button
                              size="sm"
                              variant={userRsvp?.status === 'NO' ? 'default' : 'outline'}
                              onClick={() => handleRSVP(selectedEvent.id, 'NO')}
                              disabled={rsvping}
                              className="flex-1"
                            >
                              <XIcon className="mr-2 h-4 w-4" />
                              Not Going
                            </Button>
                            {userRsvp && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveRSVP(selectedEvent.id)}
                                disabled={rsvping}
                              >
                                Clear
                              </Button>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* RSVP Counts and Lists */}
                    {(() => {
                      const { yesCount, noCount } = getRSVPCounts(selectedEvent)
                      const yesRsvps = selectedEvent.rsvps?.filter((r: any) => r.status === 'YES') || []
                      const noRsvps = selectedEvent.rsvps?.filter((r: any) => r.status === 'NO') || []
                      
                      return (
                        <div className="space-y-3">
                          {yesCount > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <p className="text-sm font-medium">Going ({yesCount})</p>
                              </div>
                              <div className="space-y-1 pl-6">
                                {yesRsvps.map((rsvp: any) => (
                                  <div key={rsvp.id} className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={rsvp.user.image || ''} />
                                      <AvatarFallback className="text-xs">
                                        {rsvp.user.name?.charAt(0) || rsvp.user.email.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{rsvp.user.name || rsvp.user.email}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {noCount > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <XIcon className="h-4 w-4 text-red-600" />
                                <p className="text-sm font-medium">Not Going ({noCount})</p>
                              </div>
                              <div className="space-y-1 pl-6">
                                {noRsvps.map((rsvp: any) => (
                                  <div key={rsvp.id} className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={rsvp.user.image || ''} />
                                      <AvatarFallback className="text-xs">
                                        {rsvp.user.name?.charAt(0) || rsvp.user.email.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{rsvp.user.name || rsvp.user.email}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {yesCount === 0 && noCount === 0 && (
                            <p className="text-sm text-muted-foreground">No RSVPs yet</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
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
                      onClick={() => handleDeleteClick(selectedEvent.id)}
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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-isAllDay"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                  />
                  <Label htmlFor="edit-isAllDay">All day event</Label>
                </div>
                
                {formData.isAllDay ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startDate">Start Date</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endDate">End Date</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-date">Date</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-startTime">Start Time</Label>
                      <Input
                        id="edit-startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endTime">End Time</Label>
                      <Input
                        id="edit-endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
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
                <Label htmlFor="edit-color">Event Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    id="edit-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer border border-input"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select ${color}`}
                      />
                    ))}
                  </div>
                </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
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

      {/* Event Announcement Modal */}
      {createdEvent && (
        <EventAnnouncementModal
          open={showAnnouncementModal}
          onOpenChange={setShowAnnouncementModal}
          onConfirm={handleAnnouncementConfirm}
          eventTitle={createdEvent.title}
          eventScope={createdEvent.scope}
          subteamName={createdEvent.subteam?.name}
        />
      )}
    </div>
  )
}
