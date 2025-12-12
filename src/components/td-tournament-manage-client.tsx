'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  LogOut, 
  Clock, 
  MapPin, 
  Link as LinkIcon,
  Plus,
  Users,
  Calendar,
  Send,
  Trash2,
  UserPlus,
  ArrowLeft,
  Settings,
  ExternalLink,
  Edit,
  Trophy,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface StaffMember {
  id: string
  email: string
  name: string | null
  role: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  invitedAt: string
  acceptedAt: string | null
  user?: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  events: Array<{
    event: {
      id: string
      name: string
      division: string
    }
  }>
  tests: Array<{
    id: string
    name: string
    status: string
    eventId: string | null
  }>
}

interface TimelineItem {
  id: string
  name: string
  description: string | null
  dueDate: string
  type: string
}

interface EventInfo {
  id: string
  name: string
  division: string
}

interface OtherDiscount {
  condition: string
  amount: number
}

interface Tournament {
  id: string
  name: string
  slug: string | null
  division: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string | null
  description: string | null
  isOnline: boolean
  price: number | null
  additionalTeamPrice: number | null
  feeStructure: string
  registrationStartDate: string | null
  registrationEndDate: string | null
  earlyBirdDiscount: number | null
  earlyBirdDeadline: string | null
  lateFee: number | null
  lateFeeStartDate: string | null
  otherDiscounts: string | null
  eligibilityRequirements: string | null
  eventsRun: string | null
  // From hosting request
  level: string | null
}

interface TDTournamentManageClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  tournament: Tournament
  initialStaff: StaffMember[]
  initialTimeline: TimelineItem[]
  events: EventInfo[]
}

export function TDTournamentManageClient({ 
  user, 
  tournament, 
  initialStaff, 
  initialTimeline, 
  events 
}: TDTournamentManageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Persist active tab in localStorage
  const storageKey = `td-tournament-tab-${tournament.id}`
  const [activeTab, setActiveTab] = useState<'staff' | 'timeline' | 'settings'>('staff')
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Load saved tab from localStorage on mount and mark as hydrated
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem(storageKey) as 'staff' | 'timeline' | 'settings' | null
      if (savedTab && ['staff', 'timeline', 'settings'].includes(savedTab)) {
        setActiveTab(savedTab)
      }
    } catch (e) {
      // localStorage not available
    }
    setIsHydrated(true)
  }, [storageKey])
  
  // Save tab to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(storageKey, activeTab)
      } catch (e) {
        // localStorage not available
      }
    }
  }, [activeTab, storageKey, isHydrated])
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'staff' | 'timeline' | 'settings')
  }
  
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [editingTimelineItem, setEditingTimelineItem] = useState<TimelineItem | null>(null)
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'EVENT_SUPERVISOR' as 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR',
    eventIds: [] as string[],
  })
  const [inviting, setInviting] = useState(false)

  // Staff edit dialog state
  const [editStaffDialogOpen, setEditStaffDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [editStaffForm, setEditStaffForm] = useState({
    role: 'EVENT_SUPERVISOR' as 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR',
    eventIds: [] as string[],
  })
  const [updatingStaff, setUpdatingStaff] = useState(false)
  
  // Timeline dialog state
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [timelineForm, setTimelineForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    type: 'draft_due',
  })
  const [savingTimeline, setSavingTimeline] = useState(false)

  // Settings edit state
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    startDate: tournament.startDate?.split('T')[0] || '',
    endDate: tournament.endDate?.split('T')[0] || '',
    startTime: tournament.startTime?.slice(11, 16) || '',
    endTime: tournament.endTime?.slice(11, 16) || '',
    price: tournament.price?.toString() || '0',
    additionalTeamPrice: tournament.additionalTeamPrice?.toString() || '',
    feeStructure: tournament.feeStructure || 'flat',
    registrationStartDate: tournament.registrationStartDate?.split('T')[0] || '',
    registrationEndDate: tournament.registrationEndDate?.split('T')[0] || '',
    earlyBirdDiscount: tournament.earlyBirdDiscount?.toString() || '',
    earlyBirdDeadline: tournament.earlyBirdDeadline?.split('T')[0] || '',
    lateFee: tournament.lateFee?.toString() || '',
    lateFeeStartDate: tournament.lateFeeStartDate?.split('T')[0] || '',
    otherDiscounts: tournament.otherDiscounts ? JSON.parse(tournament.otherDiscounts) as OtherDiscount[] : [],
    eligibilityRequirements: tournament.eligibilityRequirements || '',
    eventsRun: tournament.eventsRun ? JSON.parse(tournament.eventsRun) as string[] : [],
  })
  const [newDiscount, setNewDiscount] = useState({ condition: '', amount: '' })

  const handleSignOut = () => {
    signOut({ callbackUrl: '/td' })
  }

  // Fetch staff
  const fetchStaff = async () => {
    setLoadingStaff(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/staff`)
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Fetch timeline
  const fetchTimeline = async () => {
    setLoadingTimeline(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/timeline`)
      if (res.ok) {
        const data = await res.json()
        setTimeline(data.timeline)
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoadingTimeline(false)
    }
  }

  const handleInviteStaff = async () => {
    if (!inviteForm.email) return

    setInviting(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          name: inviteForm.name || undefined,
          role: inviteForm.role,
          eventIds: inviteForm.role === 'EVENT_SUPERVISOR' ? inviteForm.eventIds : [],
        }),
      })

      if (res.ok) {
        toast({
          title: 'Invitation sent',
          description: `An invitation has been sent to ${inviteForm.email}`,
        })
        setInviteDialogOpen(false)
        setInviteForm({ email: '', name: '', role: 'EVENT_SUPERVISOR', eventIds: [] })
        fetchStaff()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/staff?staffId=${staffId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Staff removed',
          description: 'The staff member has been removed from this tournament.',
        })
        fetchStaff()
      } else {
        throw new Error('Failed to remove staff')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove staff member',
        variant: 'destructive',
      })
    }
  }

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaff(member)
    setEditStaffForm({
      role: member.role,
      eventIds: member.role === 'EVENT_SUPERVISOR'
        ? member.events.map(e => e.event.id)
        : [],
    })
    setEditStaffDialogOpen(true)
  }

  const handleEditStaffDialogChange = (open: boolean) => {
    setEditStaffDialogOpen(open)
    if (!open) {
      setEditingStaff(null)
      setEditStaffForm({
        role: 'EVENT_SUPERVISOR',
        eventIds: [],
      })
    }
  }

  const handleUpdateStaff = async () => {
    if (!editingStaff) return

    setUpdatingStaff(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editingStaff.id,
          role: editStaffForm.role,
          eventIds: editStaffForm.role === 'EVENT_SUPERVISOR' ? editStaffForm.eventIds : [],
        }),
      })

      if (res.ok) {
        toast({
          title: 'Staff updated',
          description: `${editingStaff.name || editingStaff.email} has been updated.`,
        })
        handleEditStaffDialogChange(false)
        fetchStaff()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update staff')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update staff member',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStaff(false)
    }
  }

  const handleEmailAllStaff = () => {
    if (staff.length === 0) {
      toast({
        title: 'No staff members',
        description: 'There are no staff members to email.',
        variant: 'destructive',
      })
      return
    }

    // Separate Tournament Directors and Event Supervisors
    const tournamentDirectors = staff.filter((m: StaffMember) => m.role === 'TOURNAMENT_DIRECTOR')
    const eventSupervisors = staff.filter((m: StaffMember) => m.role === 'EVENT_SUPERVISOR')
    
    // Get emails - use user email if available, otherwise use the invitation email
    const tdEmails = tournamentDirectors
      .map((m: StaffMember) => m.user?.email || m.email)
      .filter(Boolean)
      .join(',')
    const esEmails = eventSupervisors
      .map((m: StaffMember) => m.user?.email || m.email)
      .filter(Boolean)
      .join(',')
    
    // CC Tournament Directors, BCC Event Supervisors
    const mailtoLink = `mailto:?cc=${encodeURIComponent(tdEmails)}&bcc=${encodeURIComponent(esEmails)}&subject=${encodeURIComponent(`${tournament.name} - Staff Communication`)}`
    window.location.href = mailtoLink
  }

  const resetTimelineForm = () => {
    setTimelineForm({ name: '', description: '', dueDate: '', type: 'draft_due' })
    setEditingTimelineItem(null)
  }

  const toLocalDateTimeInput = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const tzAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return tzAdjusted.toISOString().slice(0, 16)
  }

  const handleOpenAddTimeline = () => {
    resetTimelineForm()
    setTimelineDialogOpen(true)
  }

  const handleOpenEditTimeline = (item: TimelineItem) => {
    setEditingTimelineItem(item)
    setTimelineForm({
      name: item.name,
      description: item.description || '',
      dueDate: toLocalDateTimeInput(item.dueDate),
      type: item.type || 'draft_due',
    })
    setTimelineDialogOpen(true)
  }

  const handleTimelineDialogChange = (open: boolean) => {
    setTimelineDialogOpen(open)
    if (!open) {
      resetTimelineForm()
    }
  }

  const handleSaveTimeline = async () => {
    if (!timelineForm.name || !timelineForm.dueDate) return

    setSavingTimeline(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/timeline`, {
        method: editingTimelineItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingTimelineItem
            ? { id: editingTimelineItem.id, ...timelineForm }
            : timelineForm
        ),
      })

      if (res.ok) {
        toast({
          title: editingTimelineItem ? 'Deadline updated' : 'Deadline added',
          description: editingTimelineItem ? 'The timeline item has been updated.' : 'The timeline item has been added.',
        })
        handleTimelineDialogChange(false)
        fetchTimeline()
      } else {
        throw new Error('Failed to save timeline item')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save timeline item',
        variant: 'destructive',
      })
    } finally {
      setSavingTimeline(false)
    }
  }

  const handleDeleteTimeline = async (timelineId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/timeline?id=${timelineId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Deadline removed',
          description: 'The timeline item has been removed.',
        })
        fetchTimeline()
      } else {
        throw new Error('Failed to remove timeline item')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove timeline item',
        variant: 'destructive',
      })
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: settingsForm.startDate ? new Date(settingsForm.startDate).toISOString() : null,
          endDate: settingsForm.endDate ? new Date(settingsForm.endDate).toISOString() : null,
          startTime: settingsForm.startDate && settingsForm.startTime 
            ? new Date(`${settingsForm.startDate}T${settingsForm.startTime}`).toISOString() 
            : null,
          endTime: settingsForm.endDate && settingsForm.endTime 
            ? new Date(`${settingsForm.endDate}T${settingsForm.endTime}`).toISOString() 
            : null,
          price: settingsForm.price ? parseFloat(settingsForm.price) : 0,
          additionalTeamPrice: settingsForm.additionalTeamPrice ? parseFloat(settingsForm.additionalTeamPrice) : null,
          feeStructure: settingsForm.feeStructure,
          registrationStartDate: settingsForm.registrationStartDate ? new Date(settingsForm.registrationStartDate).toISOString() : null,
          registrationEndDate: settingsForm.registrationEndDate ? new Date(settingsForm.registrationEndDate).toISOString() : null,
          earlyBirdDiscount: settingsForm.earlyBirdDiscount ? parseFloat(settingsForm.earlyBirdDiscount) : null,
          earlyBirdDeadline: settingsForm.earlyBirdDeadline ? new Date(settingsForm.earlyBirdDeadline).toISOString() : null,
          lateFee: settingsForm.lateFee ? parseFloat(settingsForm.lateFee) : null,
          lateFeeStartDate: settingsForm.lateFeeStartDate ? new Date(settingsForm.lateFeeStartDate).toISOString() : null,
          otherDiscounts: settingsForm.otherDiscounts.length > 0 ? JSON.stringify(settingsForm.otherDiscounts) : null,
          eligibilityRequirements: settingsForm.eligibilityRequirements || null,
          eventsRun: settingsForm.eventsRun.length > 0 ? JSON.stringify(settingsForm.eventsRun) : null,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Settings saved',
          description: 'Tournament settings have been updated.',
        })
        setIsEditingSettings(false)
        router.refresh()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddOtherDiscount = () => {
    const amountValue = parseFloat(newDiscount.amount)
    if (!newDiscount.condition || Number.isNaN(amountValue)) return
    if (amountValue < 0) {
      toast({
        title: 'Invalid discount',
        description: 'Discount amount cannot be negative.',
        variant: 'destructive',
      })
      return
    }

    setSettingsForm(prev => ({
      ...prev,
      otherDiscounts: [...prev.otherDiscounts, { condition: newDiscount.condition, amount: amountValue }],
    }))
    setNewDiscount({ condition: '', amount: '' })
  }

  const handleRemoveOtherDiscount = (index: number) => {
    setSettingsForm(prev => ({
      ...prev,
      otherDiscounts: prev.otherDiscounts.filter((_, i) => i !== index),
    }))
  }

  const handleToggleEvent = (eventId: string) => {
    setSettingsForm(prev => ({
      ...prev,
      eventsRun: prev.eventsRun.includes(eventId)
        ? prev.eventsRun.filter(id => id !== eventId)
        : [...prev.eventsRun, eventId],
    }))
  }

  const handleSelectAllEvents = () => {
    setSettingsForm(prev => ({
      ...prev,
      eventsRun: prev.eventsRun.length === events.length
        ? []
        : events.map(e => e.id),
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" variant="light" />
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white font-semibold">TD Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/30">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block max-w-[120px] md:max-w-none">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] sm:text-xs text-white/60 truncate">{user.email}</p>
            </div>
            <ThemeToggle variant="header" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="px-2 sm:px-3 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button and Tournament Info */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/td')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tournament.startDate), 'MMM d, yyyy')}
                    </span>
                    {tournament.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {tournament.location}
                      </span>
                    )}
                    <Badge variant="outline">Division {tournament.division}</Badge>
                  </div>
                </div>
                {tournament.slug && (
                  <Link href={`/tournaments/${tournament.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Public Page
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        {isHydrated && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="staff" className="gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Staff Management
                    </CardTitle>
                    <CardDescription>
                      Invite Event Supervisors and Tournament Directors
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {staff.length > 0 && (
                      <Button variant="outline" onClick={handleEmailAllStaff}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email All
                      </Button>
                    )}
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Staff
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Staff Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join as Event Supervisor or Tournament Director.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteForm.email}
                            onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="staff@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Name (optional)</Label>
                          <Input
                            id="name"
                            value={inviteForm.name}
                            onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={inviteForm.role}
                            onValueChange={(value: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR') => 
                              setInviteForm(prev => ({ ...prev, role: value, eventIds: [] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EVENT_SUPERVISOR">Event Supervisor</SelectItem>
                              <SelectItem value="TOURNAMENT_DIRECTOR">Tournament Director</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {inviteForm.role === 'EVENT_SUPERVISOR' && events.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Assign Events</Label>
                              {events.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allSelected = events.every(e => inviteForm.eventIds.includes(e.id))
                                    setInviteForm(prev => ({
                                      ...prev,
                                      eventIds: allSelected ? [] : events.map(e => e.id)
                                    }))
                                  }}
                                  className="h-7 text-xs"
                                >
                                  {events.every(e => inviteForm.eventIds.includes(e.id)) ? 'Deselect All' : 'Select All'}
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                              {events.map(event => (
                                <label 
                                  key={event.id} 
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                                >
                                  <Checkbox
                                    checked={inviteForm.eventIds.includes(event.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setInviteForm(prev => ({ 
                                          ...prev, 
                                          eventIds: [...prev.eventIds, event.id] 
                                        }))
                                      } else {
                                        setInviteForm(prev => ({ 
                                          ...prev, 
                                          eventIds: prev.eventIds.filter(id => id !== event.id) 
                                        }))
                                      }
                                    }}
                                  />
                                  <span>{event.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleInviteStaff} 
                          disabled={inviting || !inviteForm.email}
                        >
                        <Send className="h-4 w-4 mr-2" />
                        {inviting ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingStaff ? (
                  <p className="text-muted-foreground text-center py-8">Loading staff...</p>
                ) : staff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No staff members yet. Click &ldquo;Invite Staff&rdquo; to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user?.image || ''} />
                            <AvatarFallback className="bg-primary/10">
                              {(member.name || member.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name || member.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {member.role === 'EVENT_SUPERVISOR' ? 'ES' : 'TD'}
                              </Badge>
                              {member.events.length > 0 && (
                                <span>
                                  {member.events.map(e => e.event.name).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.tests.length > 0 && (
                            <Badge variant="outline">
                              {member.tests.length} test{member.tests.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditStaff(member)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveStaff(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Dialog open={editStaffDialogOpen} onOpenChange={handleEditStaffDialogChange}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Staff Member</DialogTitle>
                  <DialogDescription>
                    Update the staff role and assigned events.
                  </DialogDescription>
                </DialogHeader>
                {editingStaff ? (
                  <div className="space-y-4 py-2">
                    <div>
                      <p className="font-semibold">{editingStaff.name || editingStaff.email}</p>
                      <p className="text-sm text-muted-foreground">{editingStaff.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editStaffForm.role}
                        onValueChange={(value: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR') =>
                          setEditStaffForm(prev => ({ ...prev, role: value, eventIds: [] }))
                        }
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EVENT_SUPERVISOR">Event Supervisor</SelectItem>
                          <SelectItem value="TOURNAMENT_DIRECTOR">Tournament Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editStaffForm.role === 'EVENT_SUPERVISOR' && events.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Assign Events</Label>
                          {events.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const allSelected = events.every(e => editStaffForm.eventIds.includes(e.id))
                                setEditStaffForm(prev => ({
                                  ...prev,
                                  eventIds: allSelected ? [] : events.map(e => e.id),
                                }))
                              }}
                              className="h-7 text-xs"
                            >
                              {events.every(e => editStaffForm.eventIds.includes(e.id)) ? 'Deselect All' : 'Select All'}
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {events.map(event => (
                            <label 
                              key={event.id} 
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                            >
                              <Checkbox
                                checked={editStaffForm.eventIds.includes(event.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setEditStaffForm(prev => ({ 
                                      ...prev, 
                                      eventIds: [...prev.eventIds, event.id] 
                                    }))
                                  } else {
                                    setEditStaffForm(prev => ({ 
                                      ...prev, 
                                      eventIds: prev.eventIds.filter(id => id !== event.id) 
                                    }))
                                  }
                                }}
                              />
                              <span>{event.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a staff member to edit.</p>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleEditStaffDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateStaff} 
                    disabled={!editingStaff || updatingStaff}
                  >
                    {updatingStaff ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline & Deadlines
                    </CardTitle>
                    <CardDescription>
                      Set deadlines for ES test submissions
                    </CardDescription>
                  </div>
                  <Dialog open={timelineDialogOpen} onOpenChange={handleTimelineDialogChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={handleOpenAddTimeline}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deadline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTimelineItem ? 'Edit Timeline Item' : 'Add Timeline Item'}</DialogTitle>
                        <DialogDescription>
                          Create a deadline for your Event Supervisors.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="tl-name">Name *</Label>
                          <Input
                            id="tl-name"
                            value={timelineForm.name}
                            onChange={e => setTimelineForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Draft Tests Due"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tl-type">Type</Label>
                          <Select
                            value={timelineForm.type}
                            onValueChange={value => setTimelineForm(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft_due">Draft Due</SelectItem>
                              <SelectItem value="final_due">Final Due</SelectItem>
                              <SelectItem value="review_due">Review Due</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tl-date">Due Date *</Label>
                          <Input
                            id="tl-date"
                            type="datetime-local"
                            value={timelineForm.dueDate}
                            onChange={e => setTimelineForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tl-desc">Description (optional)</Label>
                          <Textarea
                            id="tl-desc"
                            value={timelineForm.description}
                            onChange={e => setTimelineForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional details..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => handleTimelineDialogChange(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveTimeline}
                          disabled={savingTimeline || !timelineForm.name || !timelineForm.dueDate}
                        >
                          {savingTimeline ? 'Saving...' : editingTimelineItem ? 'Save Changes' : 'Add Deadline'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTimeline ? (
                  <p className="text-muted-foreground text-center py-8">Loading timeline...</p>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No deadlines set yet. Click &ldquo;Add Deadline&rdquo; to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeline.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            new Date(item.dueDate) < new Date()
                              ? 'bg-red-500/10'
                              : 'bg-blue-500/10'
                          }`}>
                            <Clock className={`h-5 w-5 ${
                              new Date(item.dueDate) < new Date()
                                ? 'text-red-500'
                                : 'text-blue-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-medium ${
                              new Date(item.dueDate) < new Date()
                                ? 'text-red-600'
                                : ''
                            }`}>
                              {format(new Date(item.dueDate), 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.dueDate), 'h:mm a')}
                            </p>
                          </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenEditTimeline(item)}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTimeline(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Read-Only Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Tournament Information
                </CardTitle>
                <CardDescription>
                  Basic tournament information (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tournament Name</Label>
                    <p className="text-base font-semibold">{tournament.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tournament Level</Label>
                    <p className="text-base font-semibold">{tournament.level ? tournament.level.charAt(0).toUpperCase() + tournament.level.slice(1) : <span className="text-muted-foreground italic">Not specified</span>}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Division(s)</Label>
                    <p className="text-base font-semibold">Division {tournament.division}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format / Location</Label>
                    <p className="text-base font-semibold">
                      {tournament.isOnline ? 'Online' : tournament.location || 'In-Person (location TBD)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Settings Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Editable Settings
                    </CardTitle>
                    <CardDescription>
                      Configure tournament dates, fees, and registration details
                    </CardDescription>
                  </div>
                  {!isEditingSettings ? (
                    <Button onClick={() => setIsEditingSettings(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingSettings(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Tournament Date/Time */}
                <div className="border-b pb-6">
                  <h3 className="text-base font-semibold mb-5 text-foreground">Tournament Date & Time</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Date</Label>
                      {isEditingSettings ? (
                        <Input
                          type="date"
                          value={settingsForm.startDate}
                          onChange={e => setSettingsForm(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.startDate ? format(new Date(tournament.startDate), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Time</Label>
                      {isEditingSettings ? (
                        <Input
                          type="time"
                          value={settingsForm.startTime}
                          onChange={e => setSettingsForm(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.startTime ? format(new Date(tournament.startTime), 'h:mm a') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End Date</Label>
                      {isEditingSettings ? (
                        <Input
                          type="date"
                          value={settingsForm.endDate}
                          onChange={e => setSettingsForm(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.endDate ? format(new Date(tournament.endDate), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End Time</Label>
                      {isEditingSettings ? (
                        <Input
                          type="time"
                          value={settingsForm.endTime}
                          onChange={e => setSettingsForm(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.endTime ? format(new Date(tournament.endTime), 'h:mm a') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Events Run */}
                <div className="border-b pb-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-foreground">Events Run</h3>
                    {isEditingSettings && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllEvents}
                      >
                        {settingsForm.eventsRun.length === events.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                  {isEditingSettings ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {events.map(event => (
                        <label 
                          key={event.id} 
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <Checkbox
                            checked={settingsForm.eventsRun.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSettingsForm(prev => ({
                                  ...prev,
                                  eventsRun: [...prev.eventsRun, event.id]
                                }))
                              } else {
                                setSettingsForm(prev => ({
                                  ...prev,
                                  eventsRun: prev.eventsRun.filter(id => id !== event.id)
                                }))
                              }
                            }}
                          />
                          {event.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {settingsForm.eventsRun.length > 0 ? (
                        settingsForm.eventsRun.map(eventId => {
                          const event = events.find(e => e.id === eventId)
                          return event ? (
                            <Badge key={eventId} variant="secondary">{event.name}</Badge>
                          ) : null
                        })
                      ) : (
                        <p className="text-muted-foreground">All events</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Registration Fee Structure */}
                <div className="border-b pb-6">
                  <h3 className="text-base font-semibold mb-5 text-foreground">Registration Fee Structure</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fee Structure Type</Label>
                      {isEditingSettings ? (
                        <Select
                          value={settingsForm.feeStructure}
                          onValueChange={value => setSettingsForm(prev => ({ ...prev, feeStructure: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat Fee (same for all teams)</SelectItem>
                            <SelectItem value="tiered">Tiered (different for additional teams)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.feeStructure === 'tiered' ? 'Tiered' : 'Flat Fee'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{settingsForm.feeStructure === 'tiered' ? 'First Team Fee ($)' : 'Registration Fee ($)'}</Label>
                      {isEditingSettings ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settingsForm.price}
                          onChange={e => setSettingsForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.price === 0 ? 'Free' : `$${tournament.price}`}</p>
                      )}
                    </div>
                    {(isEditingSettings ? settingsForm.feeStructure === 'tiered' : tournament.feeStructure === 'tiered') && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional Team Fee ($)</Label>
                        {isEditingSettings ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.additionalTeamPrice}
                            onChange={e => setSettingsForm(prev => ({ ...prev, additionalTeamPrice: e.target.value }))}
                            placeholder="e.g., 50"
                          />
                        ) : (
                          <p className="text-base font-semibold py-1.5">{tournament.additionalTeamPrice ? `$${tournament.additionalTeamPrice}` : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Window */}
                <div className="border-b pb-6">
                  <h3 className="text-base font-semibold mb-5 text-foreground">Registration Window</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Opens</Label>
                      {isEditingSettings ? (
                        <Input
                          type="date"
                          value={settingsForm.registrationStartDate}
                          onChange={e => setSettingsForm(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.registrationStartDate ? format(new Date(tournament.registrationStartDate), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Closes</Label>
                      {isEditingSettings ? (
                        <Input
                          type="date"
                          value={settingsForm.registrationEndDate}
                          onChange={e => setSettingsForm(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                        />
                      ) : (
                        <p className="text-base font-semibold py-1.5">{tournament.registrationEndDate ? format(new Date(tournament.registrationEndDate), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Discounts & Penalties */}
                <div className="border-b pb-6">
                  <h3 className="text-base font-semibold mb-5 text-foreground">Discounts & Penalties</h3>
                  <div className="space-y-6">
                    {/* Early Bird Discount */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Early Bird Discount ($)</Label>
                        {isEditingSettings ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.earlyBirdDiscount}
                            onChange={e => setSettingsForm(prev => ({ ...prev, earlyBirdDiscount: e.target.value }))}
                            placeholder="e.g., 10"
                          />
                        ) : (
                          <p className="text-base font-semibold py-1.5">{tournament.earlyBirdDiscount ? `$${tournament.earlyBirdDiscount} off` : <span className="text-muted-foreground italic font-normal">None</span>}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Early Bird Deadline</Label>
                        {isEditingSettings ? (
                          <Input
                            type="date"
                            value={settingsForm.earlyBirdDeadline}
                            onChange={e => setSettingsForm(prev => ({ ...prev, earlyBirdDeadline: e.target.value }))}
                          />
                        ) : (
                          <p className="text-base font-semibold py-1.5">{tournament.earlyBirdDeadline ? format(new Date(tournament.earlyBirdDeadline), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Late Fee */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Late Registration Fee ($)</Label>
                        {isEditingSettings ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.lateFee}
                            onChange={e => setSettingsForm(prev => ({ ...prev, lateFee: e.target.value }))}
                            placeholder="e.g., 25"
                          />
                        ) : (
                          <p className="text-base font-semibold py-1.5">{tournament.lateFee ? `+$${tournament.lateFee}` : <span className="text-muted-foreground italic font-normal">None</span>}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Late Fee Starts On</Label>
                        {isEditingSettings ? (
                          <Input
                            type="date"
                            value={settingsForm.lateFeeStartDate}
                            onChange={e => setSettingsForm(prev => ({ ...prev, lateFeeStartDate: e.target.value }))}
                          />
                        ) : (
                          <p className="text-base font-semibold py-1.5">{tournament.lateFeeStartDate ? format(new Date(tournament.lateFeeStartDate), 'MMMM d, yyyy') : <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Other Conditional Discounts */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other Conditional Discounts</Label>
                      {settingsForm.otherDiscounts.length > 0 && (
                        <div className="space-y-2">
                          {settingsForm.otherDiscounts.map((discount, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                              <span className="text-sm">
                                <span className="font-medium">{discount.condition}</span>
                                <span className="text-muted-foreground"> — </span>
                                <span className="text-green-600 font-medium">${discount.amount} off</span>
                              </span>
                              {isEditingSettings && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOtherDiscount(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {isEditingSettings && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Condition (e.g., Host school)"
                            value={newDiscount.condition}
                            onChange={e => setNewDiscount(prev => ({ ...prev, condition: e.target.value }))}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Amount"
                            min="0"
                            step="1"
                            value={newDiscount.amount}
                            onChange={e => {
                              const val = e.target.value
                              if (val === '') {
                                setNewDiscount(prev => ({ ...prev, amount: '' }))
                                return
                              }
                              const num = Number(val)
                              if (Number.isNaN(num)) return
                              const clamped = Math.max(0, num)
                              setNewDiscount(prev => ({ ...prev, amount: clamped.toString() }))
                            }}
                            className="w-28 md:w-32"
                          />
                          <Button variant="outline" onClick={handleAddOtherDiscount}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {!isEditingSettings && settingsForm.otherDiscounts.length === 0 && (
                        <p className="text-muted-foreground text-sm">No additional discounts configured</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Eligibility Requirements */}
                <div>
                  <h3 className="text-base font-semibold mb-5 text-foreground">Eligibility Requirements</h3>
                  <div className="space-y-2">
                    {isEditingSettings ? (
                      <Textarea
                        value={settingsForm.eligibilityRequirements}
                        onChange={e => setSettingsForm(prev => ({ ...prev, eligibilityRequirements: e.target.value }))}
                        placeholder="Enter eligibility requirements (e.g., Must be a registered Science Olympiad team, Division B/C only, etc.)"
                        rows={4}
                      />
                    ) : (
                      <p className="text-base font-semibold whitespace-pre-wrap py-1.5">
                        {tournament.eligibilityRequirements || <span className="text-muted-foreground italic font-normal">No specific requirements</span>}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

