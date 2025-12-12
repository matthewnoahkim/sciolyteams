'use client'

import { useState } from 'react'
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
  eventAssignments: Array<{
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

interface Tournament {
  id: string
  name: string
  slug: string | null
  division: string
  startDate: string
  endDate: string
  location: string | null
  description: string | null
  registrationDeadline: string | null
  maxTeams: number | null
  price: number | null
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
  const [activeTab, setActiveTab] = useState<'staff' | 'timeline' | 'settings'>('staff')
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'EVENT_SUPERVISOR' as 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR',
    eventIds: [] as string[],
  })
  const [inviting, setInviting] = useState(false)
  
  // Timeline dialog state
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [timelineForm, setTimelineForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    type: 'draft_due',
  })
  const [addingTimeline, setAddingTimeline] = useState(false)

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

  const handleAddTimeline = async () => {
    if (!timelineForm.name || !timelineForm.dueDate) return

    setAddingTimeline(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timelineForm),
      })

      if (res.ok) {
        toast({
          title: 'Deadline added',
          description: 'The timeline item has been added.',
        })
        setTimelineDialogOpen(false)
        setTimelineForm({ name: '', description: '', dueDate: '', type: 'draft_due' })
        fetchTimeline()
      } else {
        throw new Error('Failed to add timeline item')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add timeline item',
        variant: 'destructive',
      })
    } finally {
      setAddingTimeline(false)
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
                  <CardDescription className="flex items-center gap-4 mt-2">
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
                  </CardDescription>
                </div>
                {tournament.slug && (
                  <Link href={`/tournaments/hosting/${tournament.slug}`} target="_blank">
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'staff' | 'timeline' | 'settings')} className="space-y-6">
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
                            <Label>Assign Events</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                              {events.map(event => (
                                <label 
                                  key={event.id} 
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={inviteForm.eventIds.includes(event.id)}
                                    onChange={e => {
                                      if (e.target.checked) {
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
                                    className="h-4 w-4"
                                  />
                                  {event.name}
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name || member.email}</p>
                              <Badge 
                                variant="outline"
                                className={
                                  member.status === 'ACCEPTED'
                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                }
                              >
                                {member.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {member.role === 'EVENT_SUPERVISOR' ? 'ES' : 'TD'}
                              </Badge>
                              {member.eventAssignments.length > 0 && (
                                <span>
                                  {member.eventAssignments.map(e => e.event.name).join(', ')}
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
                  <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deadline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Timeline Item</DialogTitle>
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
                        <Button variant="outline" onClick={() => setTimelineDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddTimeline}
                          disabled={addingTimeline || !timelineForm.name || !timelineForm.dueDate}
                        >
                          {addingTimeline ? 'Adding...' : 'Add Deadline'}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tournament Settings
                </CardTitle>
                <CardDescription>
                  Configure your tournament settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Tournament Name</Label>
                      <p className="font-medium">{tournament.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Division</Label>
                      <p className="font-medium">Division {tournament.division}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Start Date</Label>
                      <p className="font-medium">{format(new Date(tournament.startDate), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">End Date</Label>
                      <p className="font-medium">{format(new Date(tournament.endDate), 'MMMM d, yyyy')}</p>
                    </div>
                    {tournament.location && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Location</Label>
                        <p className="font-medium">{tournament.location}</p>
                      </div>
                    )}
                    {tournament.registrationDeadline && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Registration Deadline</Label>
                        <p className="font-medium">{format(new Date(tournament.registrationDeadline), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                    {tournament.maxTeams && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Max Teams</Label>
                        <p className="font-medium">{tournament.maxTeams}</p>
                      </div>
                    )}
                    {tournament.price !== null && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Registration Fee</Label>
                        <p className="font-medium">{tournament.price === 0 ? 'Free' : `$${tournament.price}`}</p>
                      </div>
                    )}
                  </div>
                  {tournament.description && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <p className="font-medium whitespace-pre-wrap">{tournament.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

