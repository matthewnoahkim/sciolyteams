'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Clock, Users, FileText, AlertCircle, Play, Eye, Trash2, Lock } from 'lucide-react'

interface TestsTabProps {
  teamId: string
  isCaptain: boolean
  currentMembershipId: string
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
  createdAt: string
  _count: {
    questions: number
    attempts: number
  }
}

export default function TestsTab({ teamId, isCaptain, currentMembershipId }: TestsTabProps) {
  const { toast } = useToast()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  // Create Test Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    instructions: '',
    durationMinutes: '60',
    startAt: '',
    endAt: '',
    randomizeQuestionOrder: true,
    randomizeOptionOrder: true,
    requireFullscreen: true,
    adminPassword: '',
  })
  const [creating, setCreating] = useState(false)

  // Password Dialog (for editing)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [verifyingPassword, setVerifyingPassword] = useState(false)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testToDelete, setTestToDelete] = useState<Test | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTests()
  }, [teamId])

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tests?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
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
  }

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name: createForm.name,
          description: createForm.description || undefined,
          instructions: createForm.instructions || undefined,
          durationMinutes: parseInt(createForm.durationMinutes),
          startAt: createForm.startAt ? new Date(createForm.startAt).toISOString() : undefined,
          endAt: createForm.endAt ? new Date(createForm.endAt).toISOString() : undefined,
          randomizeQuestionOrder: createForm.randomizeQuestionOrder,
          randomizeOptionOrder: createForm.randomizeOptionOrder,
          requireFullscreen: createForm.requireFullscreen,
          adminPassword: createForm.adminPassword || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create test')
      }

      toast({
        title: 'Test Created',
        description: 'Your test has been created successfully',
      })

      setCreateForm({
        name: '',
        description: '',
        instructions: '',
        durationMinutes: '60',
        startAt: '',
        endAt: '',
        randomizeQuestionOrder: true,
        randomizeOptionOrder: true,
        requireFullscreen: true,
        adminPassword: '',
      })
      setCreateDialogOpen(false)
      await fetchTests()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

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
    window.location.href = `/teams/${teamId}/tests/${test.id}`
  }

  const handleTakeTest = (test: Test) => {
    // Navigate to test player
    window.location.href = `/teams/${teamId}/tests/${test.id}/take`
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
    if (!test.startAt) return 'No start time set'
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
            {isCaptain ? 'Create and manage tests for your team' : 'View and take available tests'}
          </p>
        </div>
        {isCaptain && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        )}
      </div>

      {/* Warning Banner */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Browser Lockdown Limitations
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                The test lockdown is <strong>best-effort</strong> and cannot prevent all cheating methods 
                (secondary devices, physical notes, screen sharing). For high-stakes tests, combine with 
                live proctoring or supervised testing environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <div className="grid gap-4">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tests yet</p>
              <p className="text-sm text-muted-foreground">
                {isCaptain ? 'Create your first test to get started' : 'Check back later for available tests'}
              </p>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => (
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
                  {isCaptain && (
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
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{test._count.attempts} attempts</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getTestTimeInfo(test)}
                  </div>
                </div>

                {!isCaptain && test.status === 'PUBLISHED' && (
                  <Button
                    onClick={() => handleTakeTest(test)}
                    disabled={!isTestAvailable(test)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isTestAvailable(test) ? 'Take Test' : 'Not Available'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Test Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateTest}>
            <DialogHeader>
              <DialogTitle>Create Test</DialogTitle>
              <DialogDescription>
                Create a new test for your team. You'll be able to add questions after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Test Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="e.g., Chemistry Quiz #1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Brief description of the test"
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instructions (Markdown supported)</Label>
                <textarea
                  id="instructions"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                  placeholder="Instructions for students..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="720"
                    value={createForm.durationMinutes}
                    onChange={(e) => setCreateForm({ ...createForm, durationMinutes: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startAt">Start Date/Time</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={createForm.startAt}
                    onChange={(e) => setCreateForm({ ...createForm, startAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endAt">End Date/Time</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={createForm.endAt}
                    onChange={(e) => setCreateForm({ ...createForm, endAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="randomizeQuestions"
                    checked={createForm.randomizeQuestionOrder}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, randomizeQuestionOrder: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="randomizeQuestions" className="cursor-pointer">
                    Randomize question order (per student)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="randomizeOptions"
                    checked={createForm.randomizeOptionOrder}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, randomizeOptionOrder: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="randomizeOptions" className="cursor-pointer">
                    Randomize option order (per student)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requireFullscreen"
                    checked={createForm.requireFullscreen}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, requireFullscreen: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requireFullscreen" className="cursor-pointer">
                    Require fullscreen lockdown
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={createForm.adminPassword}
                  onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Password to edit this test"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You'll need this password to edit the test later
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Test'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{testToDelete?.name}"? This will also delete all attempts 
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

