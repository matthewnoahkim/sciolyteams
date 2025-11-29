'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppHeader } from '@/components/app-header'
import { useToast } from '@/components/ui/use-toast'
import { PageLoading } from '@/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Users, Settings, FileText, Search, Calendar, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Tournament {
  id: string
  name: string
  division: 'B' | 'C'
  createdById: string
  registrations: Array<{
    id: string
    createdAt: string
    team: {
      id: string
      name: string
    }
    subteam: {
      id: string
      name: string
      members: Array<{
        id: string
        user: {
          id: string
          name: string | null
          email: string
        }
      }>
    } | null
    eventSelections: Array<{
      event: {
        id: string
        name: string
      }
    }>
  }>
  admins: Array<{
    id: string
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
}

interface TournamentManageClientProps {
  tournamentId: string
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function TournamentManageClient({ tournamentId, user }: TournamentManageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest'>('latest')
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null)

  useEffect(() => {
    loadTournament()
  }, [])

  const loadTournament = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tournaments/${tournamentId}?_t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Failed to load tournament')
      
      const data = await response.json()
      
      // Server-side protection handles access control - if we reached this component,
      // the user is authorized. The API's isAdmin flag is informational only.
      setTournament(data.tournament)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load tournament',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader user={user} />
        <PageLoading title="Loading tournament" description="Fetching tournament details..." />
      </div>
    )
  }

  if (!tournament) {
    return null
  }

  // Filter and sort registrations
  const filteredRegistrations = tournament.registrations.filter((reg) => {
    const searchLower = searchQuery.toLowerCase()
    const teamName = reg.team.name.toLowerCase()
    const subteamName = reg.subteam?.name.toLowerCase() || ''
    return teamName.includes(searchLower) || subteamName.includes(searchLower)
  })

  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'earliest' ? dateA - dateB : dateB - dateA
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    try {
      setAddingAdmin(true)
      
      // Add as admin using email
      const response = await fetch(`/api/tournaments/${tournamentId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add admin')
      }

      toast({
        title: 'Success',
        description: 'Admin added successfully',
      })
      
      setAddAdminDialogOpen(false)
      setAdminEmail('')
      loadTournament()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add admin',
        variant: 'destructive',
      })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    try {
      setRemovingAdminId(userId)
      
      const response = await fetch(`/api/tournaments/${tournamentId}/admins?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove admin')
      }

      toast({
        title: 'Success',
        description: 'Admin removed successfully',
      })
      
      loadTournament()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      })
    } finally {
      setRemovingAdminId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => router.push(`/tournaments/${tournamentId}`)} variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{tournament.name}</CardTitle>
            <CardDescription>Tournament Management</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="registrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registrations">
              <Users className="h-4 w-4 mr-2" />
              Registrations ({tournament.registrations.length})
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Settings className="h-4 w-4 mr-2" />
              Admins ({tournament.admins.length})
            </TabsTrigger>
            <TabsTrigger value="tests">
              <FileText className="h-4 w-4 mr-2" />
              Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registered Teams</CardTitle>
                <CardDescription>Teams that have registered for this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                {tournament.registrations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No teams registered yet</p>
                ) : (
                  <>
                    {/* Search and Sort Controls */}
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10 shrink-0 will-change-transform" />
                          <Input
                            placeholder="Search teams or subteams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <div className="flex items-center gap-2 sm:w-[240px]">
                          <Label htmlFor="sort-order" className="text-sm whitespace-nowrap">Sort by:</Label>
                          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'earliest' | 'latest')}>
                            <SelectTrigger id="sort-order" className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="latest">Latest to Earliest</SelectItem>
                              <SelectItem value="earliest">Earliest to Latest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    {sortedRegistrations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {searchQuery ? 'No teams found matching your search' : 'No teams registered yet'}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {sortedRegistrations.map((registration) => {
                          const memberCount = registration.subteam?.members.length || 0
                          const maxMembers = 15
                          
                          return (
                            <Card key={registration.id}>
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-lg">{registration.team.name}</h3>
                                        {registration.subteam && (
                                          <Badge variant="outline" className="font-normal">
                                            {registration.subteam.name}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-4 w-4" />
                                          <span>Registered {formatDate(registration.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-4 w-4" />
                                          <span>
                                            {memberCount} / {maxMembers} members
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {registration.subteam && registration.subteam.members.length > 0 && (
                                    <div className="pt-2 border-t">
                                      <p className="text-sm font-medium text-muted-foreground mb-2">Members:</p>
                                      <div className="space-y-1">
                                        {registration.subteam.members.map((member) => (
                                          <div key={member.id} className="text-sm text-foreground">
                                            {member.user.name || member.user.email}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {registration.eventSelections.length > 0 && (
                                    <div className="pt-2 border-t">
                                      <p className="text-sm font-medium text-muted-foreground mb-2">Events:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {registration.eventSelections.map((selection) => (
                                          <Badge key={selection.event.id} variant="secondary">
                                            {selection.event.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tournament Admins</CardTitle>
                    <CardDescription>Users who can manage this tournament</CardDescription>
                  </div>
                  <Button onClick={() => setAddAdminDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tournament.admins.map((admin) => {
                    const isCreator = tournament.createdById === admin.user.id
                    return (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={admin.user.image || undefined} alt={admin.user.name || admin.user.email} />
                            <AvatarFallback>
                              {(admin.user.name || admin.user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{admin.user.name || admin.user.email}</p>
                            <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                          </div>
                          {isCreator && (
                            <Badge variant="secondary" className="text-xs">Creator</Badge>
                          )}
                        </div>
                        {!isCreator && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.user.id)}
                            disabled={removingAdminId === admin.user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {removingAdminId === admin.user.id ? (
                              'Removing...'
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Tests</CardTitle>
                <CardDescription>Manage tests for this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Test management interface coming soon. You can assign tests to registered teams by event.
                </p>
                <Button className="mt-4" onClick={() => router.push(`/tournaments/${tournamentId}/tests`)}>
                  Manage Tests
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Admin Dialog */}
        <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tournament Admin</DialogTitle>
              <DialogDescription>
                Enter the email address of the user you want to add as an admin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="user@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddAdmin()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddAdminDialogOpen(false)
                  setAdminEmail('')
                }}
                disabled={addingAdmin}
              >
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={addingAdmin || !adminEmail.trim()}>
                {addingAdmin ? 'Adding...' : 'Add Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

