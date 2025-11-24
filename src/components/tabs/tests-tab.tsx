'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Clock, Users, FileText, AlertCircle, Play, Eye, Trash2, Lock, Search, Edit } from 'lucide-react'

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
  scoreReleaseMode: 'NONE' | 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST'
  createdAt: string
  _count: {
    questions: number
    attempts: number
  }
}

interface UserAttemptInfo {
  attemptsUsed: number
  maxAttempts: number | null
  hasReachedLimit: boolean
}

export default function TestsTab({ teamId, isAdmin }: TestsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'opened' | 'completed'>('all')
  const [userAttempts, setUserAttempts] = useState<Map<string, UserAttemptInfo>>(new Map())

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
        // We need this for ALL tests (not just limited attempts) to show "View Results" button
        if (!isAdmin && data.tests.length > 0) {
          const attemptMap = new Map<string, UserAttemptInfo>()
          for (const test of data.tests) {
            try {
              const attemptsResponse = await fetch(`/api/tests/${test.id}/user-attempts`)
              if (attemptsResponse.ok) {
                const attemptsData = await attemptsResponse.json()
                attemptMap.set(test.id, {
                  attemptsUsed: attemptsData.attemptsUsed || 0,
                  maxAttempts: test.maxAttempts,
                  hasReachedLimit: test.maxAttempts !== null && (attemptsData.attemptsUsed || 0) >= test.maxAttempts,
                })
              }
            } catch (err) {
              console.error(`Failed to fetch attempts for test ${test.id}:`, err)
            }
          }
          setUserAttempts(attemptMap)
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
    // Navigate to test detail page
    // The page will automatically show the builder for drafts or detail view for published tests
    window.location.href = `/club/${teamId}/tests/${test.id}`
  }

  const handleTakeTest = (test: Test) => {
    // Navigate to test player
    window.location.href = `/club/${teamId}/tests/${test.id}/take`
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

  // Categorize tests into sections
  const { drafts, scheduled, opened, completed } = useMemo(() => {
    const now = new Date()
    const draftsList: Test[] = []
    const scheduledList: Test[] = []
    const openedList: Test[] = []
    const completedList: Test[] = []

    // Apply search filter
    let filteredTests = tests
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredTests = tests.filter((test) =>
        test.name.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query)
      )
    }

    filteredTests.forEach((test) => {
      if (test.status === 'DRAFT') {
        if (isAdmin) {
          draftsList.push(test)
        }
        // Non-admins do not see drafts
      } else if (test.status === 'PUBLISHED') {
        const startAt = test.startAt ? new Date(test.startAt) : null
        const endAt = test.endAt ? new Date(test.endAt) : null
        const allowLateUntil = test.allowLateUntil ? new Date(test.allowLateUntil) : null
        const deadline = allowLateUntil || endAt
        const isPastEnd = deadline ? now > deadline : false
        const isScheduled = startAt && now < startAt

        // Check if user has reached max attempts (for non-admins)
        // Only check for limited attempts (maxAttempts !== null)
        let userReachedLimit = false
        if (!isAdmin && test.maxAttempts !== null) {
          const attemptInfo = userAttempts.get(test.id)
          userReachedLimit = attemptInfo?.hasReachedLimit || false
        }

        // For admins: completed = past end date only
        // For users with limited attempts: completed = past end date OR reached max attempts
        // For users with unlimited attempts: completed = past end date only (not based on attempts)
        const isCompleted = isPastEnd || (test.maxAttempts !== null && userReachedLimit)

        if (isScheduled) {
          scheduledList.push(test)
        } else if (isCompleted) {
          completedList.push(test)
        } else {
          openedList.push(test)
        }
      } else if (test.status === 'CLOSED') {
        completedList.push(test)
      }
    })

    // Apply status filter
    if (statusFilter === 'draft') {
      return { drafts: draftsList, scheduled: [], opened: [], completed: [] }
    } else if (statusFilter === 'scheduled') {
      return { drafts: [], scheduled: scheduledList, opened: [], completed: [] }
    } else if (statusFilter === 'opened') {
      return { drafts: [], scheduled: [], opened: openedList, completed: [] }
    } else if (statusFilter === 'completed') {
      return { drafts: [], scheduled: [], opened: [], completed: completedList }
    }

    return { drafts: draftsList, scheduled: scheduledList, opened: openedList, completed: completedList }
  }, [tests, searchQuery, statusFilter, isAdmin, userAttempts])

  const renderTestCard = (test: Test) => (
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
                {test.status === 'DRAFT' ? (
                  <>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </>
                )}
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
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{test._count.attempts} attempt{test._count.attempts !== 1 ? 's' : ''}</span>
          </div>
          {test.maxAttempts && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span>Max: {test.maxAttempts}</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground col-span-2">
            {getTestTimeInfo(test)}
          </div>
        </div>

        {!isAdmin && test.status === 'PUBLISHED' && (
          <div className="flex gap-2">
            {(() => {
              const attemptInfo = userAttempts.get(test.id)
              const hasCompletedAttempt = attemptInfo && attemptInfo.attemptsUsed > 0
              
              // For unlimited attempts, show "View Results" if user has any completed attempts
              // For limited attempts, only show if test is completed (past end date OR reached limit)
              const shouldShowResults = (() => {
                // If unlimited attempts, show results if user has any completed attempts
                if (test.maxAttempts === null && hasCompletedAttempt) {
                  return true
                }
                
                // For limited attempts, check if test is completed
                const now = new Date()
                const endAt = test.endAt ? new Date(test.endAt) : null
                const allowLateUntil = test.allowLateUntil ? new Date(test.allowLateUntil) : null
                const deadline = allowLateUntil || endAt
                const isPastEnd = deadline ? now > deadline : false
                const userReachedLimit = test.maxAttempts !== null && (attemptInfo?.hasReachedLimit || false)
                const isCompleted = isPastEnd || userReachedLimit
                
                return isCompleted && hasCompletedAttempt
              })()

              // For unlimited attempts, show both buttons if user has completed attempts
              // For limited attempts, show either "Take Test" or "View Results" based on completion
              if (test.maxAttempts === null && hasCompletedAttempt) {
                // Unlimited attempts with completed attempts - show both buttons
                return (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => handleTakeTest(test)}
                      disabled={!isTestAvailable(test)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isTestAvailable(test) ? 'Retake Test' : 'Not Available'}
                    </Button>
                    <Button
                      onClick={() => router.push(`/club/${teamId}/tests/${test.id}/results`)}
                      className="flex-1"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                )
              }

              if (shouldShowResults) {
                return (
                  <Button
                    onClick={() => router.push(`/club/${teamId}/tests/${test.id}/results`)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                )
              }

              return (
                <Button
                  onClick={() => handleTakeTest(test)}
                  disabled={!isTestAvailable(test)}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isTestAvailable(test) ? 'Take Test' : 'Not Available'}
                </Button>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return <div className="p-4">Loading tests...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tests</h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Create and manage tests for your team' : 'View and take available tests'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => router.push(`/club/${teamId}/tests/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10 shrink-0 will-change-transform" />
            <Input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-12 rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm"
          >
            <option value="all">All Tests</option>
            {isAdmin && <option value="draft">Drafts</option>}
            <option value="scheduled">Scheduled</option>
            <option value="opened">Opened</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

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
                {drafts.map(renderTestCard)}
              </div>
            </div>
          )}

          {/* Scheduled Section */}
          {scheduled.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <h3 className="text-xl font-bold">Scheduled</h3>
                <Badge variant="secondary" className="ml-auto">
                  {scheduled.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {scheduled.map(renderTestCard)}
              </div>
            </div>
          )}

          {/* Opened Section */}
          {opened.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-green-500" />
                <h3 className="text-xl font-bold">Opened</h3>
                <Badge variant="secondary" className="ml-auto">
                  {opened.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {opened.map(renderTestCard)}
              </div>
            </div>
          )}

          {/* Completed Section */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-1 w-1 rounded-full bg-gray-500" />
                <h3 className="text-xl font-bold">Completed</h3>
                <Badge variant="secondary" className="ml-auto">
                  {completed.length}
                </Badge>
              </div>
              <div className="grid gap-4">
                {completed.map(renderTestCard)}
              </div>
            </div>
          )}

          {/* Empty State if no tests in visible sections */}
          {(!isAdmin || drafts.length === 0) && scheduled.length === 0 && opened.length === 0 && completed.length === 0 && (
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

