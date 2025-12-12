'use client'

import { useState, useEffect } from 'react'
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
  Trophy, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Link as LinkIcon,
  Mail,
  Phone,
  FileText,
  Plus,
  Users,
  Calendar,
  Send,
  Trash2,
  UserPlus,
  ClipboardList,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TournamentRequest {
  id: string
  tournamentName: string
  tournamentLevel: string
  division: string
  tournamentFormat: string
  location: string | null
  preferredSlug: string | null
  directorName: string
  directorEmail: string
  directorPhone: string | null
  otherNotes: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNotes: string | null
  createdAt: string | Date
  tournament?: {
    id: string
    name: string
    division: string
    startDate: string
    endDate: string
  } | null
}

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

interface TDPortalClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  requests: TournamentRequest[]
}

export function TDPortalClient({ user, requests }: TDPortalClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('requests')
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [events, setEvents] = useState<EventInfo[]>([])
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

  const approvedRequests = requests.filter(r => r.status === 'APPROVED' && r.tournament)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/td' })
  }

  // Fetch staff for a tournament
  const fetchStaff = async (tournamentId: string) => {
    setLoadingStaff(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/staff`)
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

  // Fetch timeline for a tournament
  const fetchTimeline = async (tournamentId: string) => {
    setLoadingTimeline(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/timeline`)
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

  // Fetch events for a division
  const fetchEvents = async (division: string) => {
    try {
      const res = await fetch(`/api/events?division=${division}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || data)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  useEffect(() => {
    if (activeTournamentId) {
      fetchStaff(activeTournamentId)
      fetchTimeline(activeTournamentId)
      const tournament = approvedRequests.find(r => r.tournament?.id === activeTournamentId)?.tournament
      if (tournament) {
        fetchEvents(tournament.division)
      }
    }
  }, [activeTournamentId])

  const handleInviteStaff = async () => {
    if (!activeTournamentId || !inviteForm.email) return

    setInviting(true)
    try {
      const res = await fetch(`/api/tournaments/${activeTournamentId}/staff`, {
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
        fetchStaff(activeTournamentId)
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
    if (!activeTournamentId) return

    try {
      const res = await fetch(`/api/tournaments/${activeTournamentId}/staff?staffId=${staffId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Staff removed',
          description: 'The staff member has been removed from this tournament.',
        })
        fetchStaff(activeTournamentId)
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
    if (!activeTournamentId || !timelineForm.name || !timelineForm.dueDate) return

    setAddingTimeline(true)
    try {
      const res = await fetch(`/api/tournaments/${activeTournamentId}/timeline`, {
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
        fetchTimeline(activeTournamentId)
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
    if (!activeTournamentId) return

    try {
      const res = await fetch(`/api/tournaments/${activeTournamentId}/timeline?id=${timelineId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Deadline removed',
          description: 'The timeline item has been removed.',
        })
        fetchTimeline(activeTournamentId)
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

  const getTournamentSlug = (request: TournamentRequest) => {
    if (request.preferredSlug) {
      return request.preferredSlug
    }
    return request.tournamentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        )
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Your tournament has been approved! You can now manage your staff and timeline.'
      case 'REJECTED':
        return 'Unfortunately, your tournament request was not approved.'
      default:
        return 'Your request is being reviewed. We typically respond within 2-3 business days.'
    }
  }

  const activeTournament = approvedRequests.find(r => r.tournament?.id === activeTournamentId)?.tournament

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.name?.split(' ')[0] || 'Tournament Director'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your tournaments, invite staff, and set deadlines.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="requests" className="gap-2">
              <Trophy className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2" disabled={approvedRequests.length === 0}>
              <Settings className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>

          {/* Tournament Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Submit New Request CTA */}
            <Card className="border-dashed border-2">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Need to host another tournament?</h3>
                    <p className="text-sm text-muted-foreground">
                      Submit a new hosting request for your next Science Olympiad event.
                    </p>
                  </div>
                  <Link href="/tournaments">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Request
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Requests */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Your Tournament Requests</h2>
              
              {requests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{request.tournamentName}</CardTitle>
                        <CardDescription>
                          Submitted {format(new Date(request.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className={`p-4 rounded-lg ${
                      request.status === 'APPROVED' 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : request.status === 'REJECTED'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20'
                    }`}>
                      <p className={`text-sm ${
                        request.status === 'APPROVED' 
                          ? 'text-green-700 dark:text-green-300' 
                          : request.status === 'REJECTED'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {getStatusMessage(request.status)}
                      </p>
                    </div>

                    {request.reviewNotes && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Message from Teamy:
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {request.reviewNotes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Tournament Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{request.tournamentLevel}</Badge>
                            <Badge variant="outline">Division {request.division}</Badge>
                            <Badge variant="outline">{request.tournamentFormat}</Badge>
                          </div>
                          {request.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{request.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Director:</span>
                            <span className="font-medium">{request.directorName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{request.directorEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.status === 'APPROVED' && request.tournament && (
                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Link href={`/tournaments/hosting/${getTournamentSlug(request)}`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2">
                            <LinkIcon className="h-4 w-4" />
                            View Tournament Page
                          </Button>
                        </Link>
                        <Button 
                          className="flex-1 gap-2"
                          onClick={() => {
                            setActiveTournamentId(request.tournament!.id)
                            setActiveTab('manage')
                          }}
                        >
                          <Users className="h-4 w-4" />
                          Manage Staff & Timeline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            {/* Tournament Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={activeTournamentId || ''}
                  onValueChange={(value) => setActiveTournamentId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tournament to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedRequests.map(request => (
                      <SelectItem key={request.tournament!.id} value={request.tournament!.id}>
                        {request.tournamentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {activeTournament && (
              <>
                {/* Staff Management */}
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

                {/* Timeline Management */}
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
              </>
            )}
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
