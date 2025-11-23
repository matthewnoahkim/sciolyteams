'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Clock, Users, FileText, AlertCircle, Play, Eye, Trash2, Lock, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TestsTabProps {
  teamId: string
  isAdmin: boolean
}

interface Test {
  id: string
  name: string
  description: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  durationMinutes: number
  startAt: string | null
  endAt: string | null
  allowLateUntil: string | null
  requireFullscreen: boolean
  releaseScoresAt: string | null
  maxAttempts: number | null
  scoreReleaseVisibility: 'SCORE_ONLY' | 'SCORE_AND_MISSED' | 'SCORE_AND_FULL_COPY'
  createdAt: string
  _count: {
    questions: number
    attempts: number
  }
}

interface UserAttemptInfo {
  testId: string
  attemptsUsed: number
  maxAttempts: number | null
  hasReachedLimit: boolean
}

export default function TestsTab({ teamId, isAdmin }: TestsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [userAttempts, setUserAttempts] = useState<Map<string, UserAttemptInfo>>(new Map())

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'drafts' | 'scheduled' | 'active' | 'completed'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testToDelete, setTestToDelete] = useState<Test | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Warning Banner Dismissal
  const [warningDismissed, setWarningDismissed] = useState(false)
  
  useEffect(() => {
    // Check if warning was dismissed forever
    const dismissedForever = localStorage.getItem('test-lockdown-warning-dismissed')
    if (dismissedForever === 'true') {
      setWarningDismissed(true)
    }
  }, [])

  const handleDismissWarning = (forever: boolean) => {
    setWarningDismissed(true)
    if (forever) {
      localStorage.setItem('test-lockdown-warning-dismissed', 'true')
    }
  }

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tests?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)

        // For non-admins, fetch attempt counts for each test
        if (!isAdmin) {
          const attemptInfoMap = new Map<string, UserAttemptInfo>()
          
          for (const test of data.tests) {
            if (test.maxAttempts !== null) {
              try {
                const attemptsResponse = await fetch(`/api/tests/${test.id}/user-attempts`)
                if (attemptsResponse.ok) {
                  const attemptsData = await attemptsResponse.json()
                  attemptInfoMap.set(test.id, {
                    testId: test.id,
                    attemptsUsed: attemptsData.attemptsUsed || 0,
                    maxAttempts: test.maxAttempts,
                    hasReachedLimit: (attemptsData.attemptsUsed || 0) >= test.maxAttempts,
                  })
                }
              } catch (err) {
                console.error(`Failed to fetch attempts for test ${test.id}:`, err)
              }
            }
          }
          
          setUserAttempts(attemptInfoMap)
        }
      } else {
        throw new Error('Failed to fetch tests')
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tests',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [teamId, isAdmin, toast])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const handleDeleteClick = (test: Test) => {
    setTestToDelete(test)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTest = async () => {
    if (!testToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/tests/${testToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete test')
      }

      toast({
        title: 'Test Deleted',
        description: 'The test has been removed',
      })

      setDeleteDialogOpen(false)
      setTestToDelete(null)
      await fetchTests()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete test',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleViewTest = (test: Test) => {
    // Navigate to test builder or viewer
    window.location.href = `/clubs/${teamId}/tests/${test.id}`
  }

  const handleTakeTest = (test: Test) => {
    // Navigate to test player
    window.location.href = `/clubs/${teamId}/tests/${test.id}/take`
  }

  const getStatusBadge = (status: Test['status']) => {
    const config = {
      DRAFT: { label: 'Draft', variant: 'secondary' as const, color: 'text-gray-600' },
      PUBLISHED: { label: 'Published', variant: 'default' as const, color: 'text-green-600' },
      CLOSED: { label: 'Closed', variant: 'destructive' as const, color: 'text-red-600' },
    }
    const { label, variant } = config[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const isTestAvailable = (test: Test): boolean => {
    if (test.status !== 'PUBLISHED') return false
    const now = new Date()
    if (test.startAt && now < new Date(test.startAt)) return false
    if (test.endAt) {
      const deadline = test.allowLateUntil ? new Date(test.allowLateUntil) : new Date(test.endAt)
      if (now > deadline) return false
    }
    return true
  }

  const getTestTimeInfo = (test: Test): string => {
    if (!test.startAt) {
      return test.status === 'DRAFT' ? 'Set start time when publishing' : 'No start time set'
    }
    const start = new Date(test.startAt)
    const end = test.endAt ? new Date(test.endAt) : null
    const now = new Date()

    if (now < start) {
      return `Starts ${start.toLocaleDateString()} at ${start.toLocaleTimeString()}`
    }
    if (end && now > end) {
      return `Ended ${end.toLocaleDateString()}`
    }
    if (end) {
      return `Ends ${end.toLocaleDateString()} at ${end.toLocaleTimeString()}`
    }
    return 'Available now'
  }

  // Filter and categorize tests
  const { drafts, scheduled, active, completed } = useMemo(() => {
    const now = new Date()
    const draftsList: Test[] = []
    const scheduledList: Test[] = []
    const activeList: Test[] = []
    const completedList: Test[] = []

    // Apply search filter
    let filteredTests = tests
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredTests = tests.filter(
        (test) =>
          test.name.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query)
      )
    }

    filteredTests.forEach((test) => {
      if (test.status === 'DRAFT') {
        // Only show drafts to admins
        if (isAdmin) {
          draftsList.push(test)
        }
        // For non-admins, drafts are filtered out (not added to any list)
      } else if (test.status === 'PUBLISHED') {
        const startAt = test.startAt ? new Date(test.startAt) : null
        const endAt = test.endAt ? new Date(test.endAt) : null
        const isPastEnd = endAt && now > endAt
        const isScheduled = startAt && now < startAt

        // Check if user has reached max attempts (for non-admins)
        let userReachedLimit = false
        if (!isAdmin && test.maxAttempts !== null) {
          const attemptInfo = userAttempts.get(test.id)
          userReachedLimit = attemptInfo?.hasReachedLimit || false
        }

        // For admins: completed = past end date
        // For users: completed = past end date OR reached max attempts
        const isCompleted = isPastEnd || (userReachedLimit && !isAdmin)

        if (isScheduled) {
          scheduledList.push(test)
        } else if (isCompleted) {
          completedList.push(test)
        } else {
          activeList.push(test)
        }
      } else if (test.status === 'CLOSED') {
        completedList.push(test)
      }
    })

    // Apply status filter
    let finalDrafts = draftsList
    let finalScheduled = scheduledList
    let finalActive = activeList
    let finalCompleted = completedList

    if (statusFilter === 'drafts') {
      finalScheduled = []
      finalActive = []
      finalCompleted = []
    } else if (statusFilter === 'scheduled') {
      finalDrafts = []
      finalActive = []
      finalCompleted = []
    } else if (statusFilter === 'active') {
      finalDrafts = []
      finalScheduled = []
      finalCompleted = []
    } else if (statusFilter === 'completed') {
      finalDrafts = []
      finalScheduled = []
      finalActive = []
    }
    // 'all' shows everything

    return {
      drafts: finalDrafts,
      scheduled: finalScheduled,
      active: finalActive,
      completed: finalCompleted,
    }
  }, [tests, searchQuery, statusFilter, isAdmin, userAttempts])

  const renderTestCard = (test: Test, isCompleted: boolean = false) => {
    const attemptInfo = userAttempts.get(test.id)
    const attemptsUsed = attemptInfo?.attemptsUsed || 0
    const maxAttempts = test.maxAttempts
    const hasReachedLimit = attemptInfo?.hasReachedLimit || false
    const canTakeTest = isTestAvailable(test) && (!hasReachedLimit || isAdmin)

    return (
      <Card key={test.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{test.name}</CardTitle>
                {getStatusBadge(test.status)}
                {test.requireFullscreen && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Lockdown
                  </Badge>
                )}
              </div>
              {test.description && (
                <CardDescription>{test.description}</CardDescription>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewTest(test)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteClick(test)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{test.durationMinutes} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{test._count.questions} questions</span>
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{test._count.attempts} total attempts</span>
              </div>
            ) : maxAttempts !== null ? (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {attemptsUsed}/{maxAttempts} attempts
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Unlimited attempts</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {getTestTimeInfo(test)}
            </div>
          </div>

          {!isAdmin && maxAttempts !== null && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Attempts:</span>
                <span className="font-medium">
                  {attemptsUsed} used / {maxAttempts} allowed
                  {maxAttempts - attemptsUsed > 0 && (
                    <span className="text-green-600 ml-2">
                      ({maxAttempts - attemptsUsed} remaining)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {!isAdmin && test.status === 'PUBLISHED' && (
            <div className="space-y-2">
              <Button
                onClick={() => handleTakeTest(test)}
                disabled={!canTakeTest || isCompleted}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {isCompleted
                  ? 'Completed'
                  : hasReachedLimit
                  ? 'Max Attempts Reached'
                  : isTestAvailable(test)
                  ? 'Take Test'
                  : 'Not Available'}
              </Button>
              {isCompleted && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamId}/tests/${test.id}/results`)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="p-4">Loading tests...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tests</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Create and manage tests for your team' : 'View and take available tests'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => router.push(`/clubs/${teamId}/tests/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder={isAdmin ? "Search tests by name or description..." : "Search available tests..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 placeholder:text-foreground/50"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            {showFilters && (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="status-filter">Status</Label>
                  <select
                    id="status-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'drafts' | 'scheduled' | 'active' | 'completed')
                    }
                  >
                    <option value="all">All Tests</option>
                    {isAdmin && <option value="drafts">Drafts</option>}
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning Banner - Admin Only */}
      {isAdmin && !warningDismissed && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Browser Lockdown Limitations
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  The test lockdown is <strong>best-effort</strong> and cannot prevent all cheating methods 
                  (secondary devices, physical notes, screen sharing). For high-stakes tests, combine with 
                  live proctoring or supervised testing environments.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissWarning(false)}
                    className="h-7 text-xs text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissWarning(true)}
                    className="h-7 text-xs text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100"
                  >
                    Don't show again
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests List - Organized by Sections */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tests yet</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Create your first test to get started' : 'Check back later for available tests'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Drafts Section - Admin Only */}
          {isAdmin && drafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="text-xl font-bold">Drafts</h3>
                <Badge variant="secondary" className="ml-auto">
                  {drafts.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {drafts.map((test) => renderTestCard(test, false))}
              </div>
            </div>
          )}

          {/* Scheduled Tests Section */}
          {scheduled.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <h3 className="text-xl font-bold">Scheduled Tests</h3>
                <Badge variant="secondary" className="ml-auto">
                  {scheduled.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {scheduled.map((test) => renderTestCard(test, false))}
              </div>
            </div>
          )}

          {/* Active Tests Section */}
          {active.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-green-500" />
                <h3 className="text-xl font-bold">Active Tests</h3>
                <Badge variant="secondary" className="ml-auto">
                  {active.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {active.map((test) => renderTestCard(test, false))}
              </div>
            </div>
          )}

          {/* Completed Tests Section */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-gray-500" />
                <h3 className="text-xl font-bold">Completed Tests</h3>
                <Badge variant="secondary" className="ml-auto">
                  {completed.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {completed.map((test) => renderTestCard(test, true))}
              </div>
            </div>
          )}

          {/* Empty State if no tests in visible sections */}
          {(!isAdmin || drafts.length === 0) && scheduled.length === 0 && active.length === 0 && completed.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tests available</p>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Create your first test to get started' : 'Check back later for available tests'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{testToDelete?.name}&quot;? This will also delete all attempts 
              and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setTestToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTest} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

