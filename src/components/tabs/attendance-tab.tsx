'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Clock,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Trash2,
} from 'lucide-react'

interface AttendanceTabProps {
  teamId: string
  isCaptain: boolean
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function AttendanceTab({ teamId, isCaptain, user }: AttendanceTabProps) {
  const { toast } = useToast()
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkInCode, setCheckInCode] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [revealedCode, setRevealedCode] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [rosterData, setRosterData] = useState<any>(null)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [deletingCheckInId, setDeletingCheckInId] = useState<string | null>(null)

  useEffect(() => {
    fetchAttendances()
  }, [teamId])

  const fetchAttendances = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/attendance?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setAttendances(data.attendances)
      } else {
        throw new Error('Failed to fetch attendances')
      }
    } catch (error) {
      console.error('Failed to fetch attendances:', error)
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoster = async (attendanceId: string) => {
    if (!isCaptain) return

    setLoadingRoster(true)
    try {
      const response = await fetch(`/api/attendance/${attendanceId}/roster`)
      if (response.ok) {
        const data = await response.json()
        setRosterData(data)
      } else {
        throw new Error('Failed to fetch roster')
      }
    } catch (error) {
      console.error('Failed to fetch roster:', error)
      toast({
        title: 'Error',
        description: 'Failed to load roster data',
        variant: 'destructive',
      })
    } finally {
      setLoadingRoster(false)
    }
  }

  const handleRevealCode = async (attendanceId: string) => {
    setRevealing(true)
    try {
      const response = await fetch(`/api/attendance/${attendanceId}/code/regenerate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reveal code')
      }

      const data = await response.json()
      setRevealedCode(data.code)

      toast({
        title: 'Code Generated',
        description: 'Share this code with attendees during the meeting.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate code',
        variant: 'destructive',
      })
    } finally {
      setRevealing(false)
    }
  }

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttendance) return

    setCheckingIn(true)
    try {
      const response = await fetch(`/api/attendance/${selectedAttendance.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: checkInCode.toUpperCase() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Check-in failed')
      }

      toast({
        title: 'Success',
        description: 'You have successfully checked in!',
      })

      setCheckInOpen(false)
      setCheckInCode('')
      setSelectedAttendance(null)
      await fetchAttendances()
    } catch (error: any) {
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Invalid code or check-in window closed',
        variant: 'destructive',
      })
    } finally {
      setCheckingIn(false)
    }
  }

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttendance || !selectedUserId) return

    setAddingManual(true)
    try {
      const response = await fetch(`/api/attendance/${selectedAttendance.id}/manual-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add manual check-in')
      }

      toast({
        title: 'Success',
        description: 'Manual check-in added successfully',
      })

      setManualCheckInOpen(false)
      setSelectedUserId('')
      await fetchRoster(selectedAttendance.id)
      await fetchAttendances()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add manual check-in',
        variant: 'destructive',
      })
    } finally {
      setAddingManual(false)
    }
  }

  const handleDeleteCheckIn = async (checkInId: string, userName: string) => {
    if (!selectedAttendance) return

    setDeletingCheckInId(checkInId)
    try {
      const response = await fetch(
        `/api/attendance/${selectedAttendance.id}/checkin/${checkInId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove check-in')
      }

      toast({
        title: 'Check-in Removed',
        description: `${userName}'s check-in has been removed`,
      })

      await fetchRoster(selectedAttendance.id)
      await fetchAttendances()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove check-in',
        variant: 'destructive',
      })
    } finally {
      setDeletingCheckInId(null)
    }
  }

  const handleExport = async (attendanceId: string, eventTitle: string) => {
    try {
      const response = await fetch(`/api/attendance/${attendanceId}/export`)
      if (!response.ok) {
        throw new Error('Failed to export attendance')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${eventTitle.replace(/[^a-z0-9]/gi, '-')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Attendance exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export attendance',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = async (attendance: any) => {
    setSelectedAttendance(attendance)
    setRevealedCode(null)
    if (isCaptain) {
      await fetchRoster(attendance.id)
    }
    setDetailsOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active Now</Badge>
      case 'ENDED':
        return <Badge variant="secondary">Ended</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getUserCheckInStatus = (attendance: any) => {
    return attendance.checkIns?.find((ci: any) => ci.user.id === user.id)
  }

  const canCheckIn = (attendance: any) => {
    return attendance.status === 'ACTIVE' && !getUserCheckInStatus(attendance)
  }

  const canRevealCode = (attendance: any) => {
    // Captains can generate codes for upcoming and active events
    return isCaptain && (attendance.status === 'UPCOMING' || attendance.status === 'ACTIVE')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track attendance for team events
          </p>
        </div>
        <Button onClick={fetchAttendances} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading attendance...</p>
        </div>
      ) : attendances.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
          <p className="text-sm text-muted-foreground">
            Attendance tracking will automatically appear for team and subteam events.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {attendances.map((attendance) => {
            const event = attendance.calendarEvent
            const userCheckIn = getUserCheckInStatus(attendance)
            const checkInCount = attendance._count?.checkIns || 0

            return (
              <Card key={attendance.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      {getStatusBadge(attendance.status)}
                      {event.scope === 'SUBTEAM' && event.subteam && (
                        <Badge variant="secondary" className="text-xs">
                          {event.subteam.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(event.startUTC)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{checkInCount} checked in</span>
                      </div>
                    </div>

                    {userCheckIn && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          You checked in at {new Date(userCheckIn.checkedInAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {canCheckIn(attendance) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(attendance)
                          setCheckInOpen(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(attendance)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Check-In Dialog */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent>
          <form onSubmit={handleCheckIn}>
            <DialogHeader>
              <DialogTitle>Check In</DialogTitle>
              <DialogDescription>
                Enter the attendance code provided by your captain during the meeting.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedAttendance && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{selectedAttendance.calendarEvent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedAttendance.calendarEvent.startUTC)}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="checkin-code">Attendance Code</Label>
                <Input
                  id="checkin-code"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-digit code"
                  maxLength={10}
                  required
                  className="font-mono text-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCheckInOpen(false)
                  setCheckInCode('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={checkingIn || checkInCode.length < 6}>
                {checkingIn ? 'Checking In...' : 'Check In'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAttendance && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAttendance.calendarEvent.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedAttendance.calendarEvent.startUTC)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(selectedAttendance.status)}
                  </div>
                  {selectedAttendance.calendarEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAttendance.calendarEvent.location}</span>
                    </div>
                  )}
                  {selectedAttendance.graceMinutes > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Grace period: {selectedAttendance.graceMinutes} minutes
                    </div>
                  )}
                </div>

                {/* Captain Controls */}
                {isCaptain && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-semibold">Captain Controls</h3>

                    {canRevealCode(selectedAttendance) && (
                      <div className="space-y-3">
                        {revealedCode ? (
                          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium mb-2">Attendance Code:</p>
                            <p className="text-3xl font-mono font-bold tracking-wider text-center py-2">
                              {revealedCode}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              {selectedAttendance.status === 'UPCOMING' 
                                ? 'Code generated. Share with attendees when meeting starts.'
                                : 'Share this code with attendees during the meeting'}
                            </p>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleRevealCode(selectedAttendance.id)}
                            disabled={revealing}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {revealing ? 'Generating...' : 'Generate New Code'}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setManualCheckInOpen(true)
                        }}
                        className="flex-1"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Manual Check-In
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExport(selectedAttendance.id, selectedAttendance.calendarEvent.title)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                )}

                {/* Attendance Roster */}
                {isCaptain && rosterData && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Attendance Roster</h3>
                      <span className="text-sm text-muted-foreground">
                        {rosterData.checkedInCount} of {rosterData.totalMembers} checked in
                      </span>
                    </div>

                    {loadingRoster ? (
                      <p className="text-sm text-muted-foreground">Loading roster...</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Checked In */}
                        {rosterData.checkIns.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Checked In ({rosterData.checkIns.length})
                            </p>
                            <div className="space-y-2 pl-6">
                              {rosterData.checkIns.map((checkIn: any) => (
                                <div key={checkIn.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={checkIn.user.image || ''} />
                                      <AvatarFallback className="text-xs">
                                        {checkIn.user.name?.charAt(0) || checkIn.user.email.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{checkIn.user.name || checkIn.user.email}</span>
                                    <span className="text-muted-foreground">
                                      {new Date(checkIn.checkedInAt).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </span>
                                    {checkIn.source === 'MANUAL' && (
                                      <Badge variant="outline" className="text-xs">Manual</Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCheckIn(checkIn.id, checkIn.user.name || checkIn.user.email)}
                                    disabled={deletingCheckInId === checkIn.id}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Not Checked In */}
                        {rosterData.missingMembers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              Not Checked In ({rosterData.missingMembers.length})
                            </p>
                            <div className="space-y-2 pl-6">
                              {rosterData.missingMembers.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.user.image || ''} />
                                    <AvatarFallback className="text-xs">
                                      {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.user.name || member.user.email}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Member View */}
                {!isCaptain && (
                  <div className="border-t pt-4">
                    {getUserCheckInStatus(selectedAttendance) ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>You are checked in</span>
                      </div>
                    ) : canCheckIn(selectedAttendance) ? (
                      <Button
                        onClick={() => {
                          setDetailsOpen(false)
                          setCheckInOpen(true)
                        }}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Now
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-5 w-5" />
                        <span>Check-in not available</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Check-In Dialog */}
      {isCaptain && (
        <Dialog open={manualCheckInOpen} onOpenChange={setManualCheckInOpen}>
          <DialogContent>
            <form onSubmit={handleManualCheckIn}>
            <DialogHeader>
              <DialogTitle>Manual Check-In</DialogTitle>
              <DialogDescription>
                Add a check-in for a team member who was present but couldn't use the code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="user-select">Team Member</Label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a member...</option>
                  {rosterData?.missingMembers.map((member: any) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setManualCheckInOpen(false)
                    setSelectedUserId('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addingManual || !selectedUserId}>
                  {addingManual ? 'Adding...' : 'Add Check-In'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

