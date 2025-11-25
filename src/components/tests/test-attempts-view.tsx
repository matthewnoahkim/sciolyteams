'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Users, Eye, AlertTriangle, CheckCircle, XCircle, Clock, Info, Save, Sparkles, Bot, Loader2, Download, Search, X } from 'lucide-react'

interface TestAttemptsViewProps {
  testId: string
  testName: string
}

interface Attempt {
  id: string
  membershipId: string
  status: string
  startedAt: string | null
  submittedAt: string | null
  gradeEarned: number | null
  proctoringScore: number | null
  tabSwitchCount: number
  timeOffPageSeconds: number
  attemptNumber?: number // Added for display purposes
  user: {
    id: string
    name: string | null
    email: string
  } | null
  proctorEvents: Array<{
    id: string
    kind: string
    ts: string
    meta: any
  }>
  answers: Array<{
    id: string
    questionId: string
    answerText: string | null
    selectedOptionIds: string[] | null
    numericAnswer: number | null
    pointsAwarded: number | null
    gradedAt: string | null
    graderNote: string | null
    question: {
      id: string
      promptMd: string
      type: string
      points: number
      sectionId: string | null
      explanation: string | null
      options: Array<{
        id: string
        label: string
        isCorrect: boolean
      }>
    }
  }>
}

interface GradeEdit {
  answerId: string
  pointsAwarded: number
  graderNote: string
  aiSuggestionId?: string | null
}

interface Section {
  id: string
  title: string | null
}

type AiSuggestionStatus = 'REQUESTED' | 'SUGGESTED' | 'FAILED' | 'ACCEPTED' | 'OVERRIDDEN' | 'DISMISSED'

interface AiSuggestion {
  id: string
  answerId: string
  questionId: string
  suggestedPoints: number
  maxPoints: number
  explanation: string
  strengths?: string | null
  gaps?: string | null
  rubricAlignment?: string | null
  status: AiSuggestionStatus
  createdAt: string
  acceptedAt?: string | null
  acceptedPoints?: number | null
}

export function TestAttemptsView({ testId, testName }: TestAttemptsViewProps) {
  const { toast } = useToast()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [scoringKeyOpen, setScoringKeyOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'submission' | 'score'>('submission')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [gradeEdits, setGradeEdits] = useState<Record<string, GradeEdit>>({})
  const [saving, setSaving] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AiSuggestion | null>>({})
  const [aiLoadingByAnswer, setAiLoadingByAnswer] = useState<Record<string, boolean>>({})
  const [aiErrors, setAiErrors] = useState<Record<string, string | null>>({})
  const [bulkAiLoading, setBulkAiLoading] = useState(false)
  
  // Filtering state
  const [filterUserName, setFilterUserName] = useState('')
  const [filterAttemptNumber, setFilterAttemptNumber] = useState('')

  const exportToCSV = () => {
    // Create CSV header
    const headers = [
      'User Name',
      'User Email',
      'Attempt #',
      'Status',
      'Started At',
      'Submitted At',
      'Score',
      'Time Taken (minutes)',
      'Tab Switches',
      'Time Off Page (seconds)',
      'Proctoring Score'
    ]

    // Create CSV rows
    const rows = sortedAttempts.map(attempt => {
      const timeTaken = attempt.startedAt && attempt.submittedAt
        ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
        : ''
      
      return [
        attempt.user?.name || '',
        attempt.user?.email || '',
        attempt.attemptNumber || '',
        attempt.status,
        attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : '',
        attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '',
        attempt.gradeEarned !== null ? attempt.gradeEarned : '',
        timeTaken,
        attempt.tabSwitchCount || 0,
        attempt.timeOffPageSeconds || 0,
        attempt.proctoringScore !== null ? attempt.proctoringScore : ''
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        // Escape commas and quotes in cell content
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${testName.replace(/[^a-z0-9]/gi, '_')}_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export Successful',
      description: `Exported ${sortedAttempts.length} attempt(s) to CSV`,
    })
  }

  const fetchAttempts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tests/${testId}/attempts`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch attempts`)
      }
      const data = await response.json()
      setAttempts(data.attempts || [])
      setSections(data.sections || [])
    } catch (error: any) {
      console.error('Failed to fetch attempts:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load test attempts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [testId, toast])

  useEffect(() => {
    fetchAttempts()
  }, [fetchAttempts])

  const handleViewDetails = (attempt: Attempt) => {
    resetAiAssistantState()
    setSelectedAttempt(attempt)
    setDetailDialogOpen(true)
    // Initialize grade edits from current attempt
    const edits: Record<string, GradeEdit> = {}
    attempt.answers.forEach((answer) => {
      edits[answer.id] = {
        answerId: answer.id,
        pointsAwarded: answer.pointsAwarded !== null ? answer.pointsAwarded : 0,
        graderNote: answer.graderNote || '',
        aiSuggestionId: null,
      }
    })
    setGradeEdits(edits)
    void loadAiSuggestionsForAttempt(attempt.id)
  }

  const handleGradeEdit = (answerId: string, field: 'pointsAwarded' | 'graderNote', value: number | string) => {
    setGradeEdits((prev) => {
      const existing = prev[answerId] || { answerId, pointsAwarded: 0, graderNote: '', aiSuggestionId: null }
      let updated: GradeEdit

      if (field === 'pointsAwarded' && typeof value === 'number') {
        const suggestion = aiSuggestions[answerId]
        const shouldClearSuggestion =
          existing.aiSuggestionId &&
          (!suggestion ||
            suggestion.id !== existing.aiSuggestionId ||
            Math.abs(value - suggestion.suggestedPoints) > 0.01)

        updated = {
          ...existing,
          pointsAwarded: value,
          aiSuggestionId: shouldClearSuggestion ? null : existing.aiSuggestionId,
        }
      } else {
        updated = {
          ...existing,
          graderNote: value as string,
        }
      }

      return {
        ...prev,
        [answerId]: updated,
      }
    })
  }

  const handleSaveGrades = async () => {
    if (!selectedAttempt) return

    setSaving(true)
    try {
      // Only send grades that have changed or need grading
      const gradesToSave = Object.values(gradeEdits).filter((grade) => {
        const answer = selectedAttempt.answers.find((a) => a.id === grade.answerId)
        if (!answer) return false
        
        // Include if it is an FRQ that needs grading
        const isFRQ = answer.question.type === 'SHORT_TEXT' || answer.question.type === 'LONG_TEXT'
        return isFRQ
      })

      const response = await fetch(`/api/tests/${testId}/attempts/${selectedAttempt.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save grades')
      }

      toast({
        title: 'Success',
        description: 'Grades saved successfully',
      })

      // Refresh attempts to get updated data
      await fetchAttempts()
      setDetailDialogOpen(false)
    } catch (error: any) {
      console.error('Failed to save grades:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save grades',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const calculateGradingStatus = (attempt: Attempt): {
    status: 'UNGRADED' | 'PARTIALLY_GRADED' | 'FULLY_GRADED'
    gradedCount: number
    totalCount: number
  } => {
    const totalCount = attempt.answers.length
    const gradedCount = attempt.answers.filter((a) => a.gradedAt !== null).length

    let status: 'UNGRADED' | 'PARTIALLY_GRADED' | 'FULLY_GRADED'
    if (gradedCount === 0) {
      status = 'UNGRADED'
    } else if (gradedCount === totalCount) {
      status = 'FULLY_GRADED'
    } else {
      status = 'PARTIALLY_GRADED'
    }

    return { status, gradedCount, totalCount }
  }

  const calculateScoreBreakdown = (attempt: Attempt): {
    earnedPoints: number
    gradedTotalPoints: number
    overallTotalPoints: number
  } => {
    let earnedPoints = 0
    let gradedTotalPoints = 0
    let overallTotalPoints = 0

    attempt.answers.forEach((answer) => {
      const questionPoints = answer.question.points
      overallTotalPoints += questionPoints

      if (answer.gradedAt !== null) {
        gradedTotalPoints += questionPoints
        earnedPoints += answer.pointsAwarded || 0
      }
    })

    return { earnedPoints, gradedTotalPoints, overallTotalPoints }
  }

  const getGradingStatusBadge = (status: 'UNGRADED' | 'PARTIALLY_GRADED' | 'FULLY_GRADED') => {
    const config = {
      UNGRADED: { label: 'Ungraded', variant: 'secondary' as const, className: 'bg-gray-500' },
      PARTIALLY_GRADED: { label: 'Partially Graded', variant: 'default' as const, className: 'bg-orange-500' },
      FULLY_GRADED: { label: 'Fully Graded', variant: 'default' as const, className: 'bg-green-600' },
    }
    const { label, variant, className } = config[status]
    return <Badge variant={variant} className={className}>{label}</Badge>
  }

  const calculateTimeTaken = (startedAt: string | null, submittedAt: string | null): string => {
    if (!startedAt || !submittedAt) return 'N/A'
    
    const start = new Date(startedAt).getTime()
    const end = new Date(submittedAt).getTime()
    const diffMs = end - start
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    return `${diffMins}m ${diffSecs}s`
  }

  const isFrqQuestion = (type: string) => type === 'SHORT_TEXT' || type === 'LONG_TEXT'

  const resetAiAssistantState = () => {
    setAiSuggestions({})
    setAiErrors({})
    setAiLoadingByAnswer({})
    setBulkAiLoading(false)
  }

  const loadAiSuggestionsForAttempt = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/attempts/${attemptId}/ai/suggestions`)
      if (!response.ok) {
        throw new Error('Failed to load AI suggestions')
      }
      const data = await response.json()
      const latest: Record<string, AiSuggestion | null> = {}
      ;(data.suggestions || []).forEach((suggestion: AiSuggestion) => {
        if (!latest[suggestion.answerId]) {
          latest[suggestion.answerId] = suggestion
        }
      })
      setAiSuggestions(latest)
    } catch (error) {
      console.error('Failed to load AI suggestions', error)
    }
  }

  const renderAiStatusBadge = (status: AiSuggestionStatus) => {
    const config: Record<
      AiSuggestionStatus,
      { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }
    > = {
      REQUESTED: { label: 'Requested', variant: 'secondary' },
      SUGGESTED: { label: 'Suggested', variant: 'secondary' },
      FAILED: { label: 'Errored', variant: 'destructive' },
      ACCEPTED: { label: 'Accepted', variant: 'default', className: 'bg-green-600 text-white' },
      OVERRIDDEN: { label: 'Overridden', variant: 'destructive' },
      DISMISSED: { label: 'Dismissed', variant: 'secondary' },
    }
    const badge = config[status] || config.SUGGESTED
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    )
  }

  const requestAiSuggestions = async ({ mode, answerId }: { mode: 'single' | 'all'; answerId?: string }) => {
    if (!selectedAttempt) return
    if (mode === 'single' && !answerId) return

    const targetAnswerIds =
      mode === 'all'
        ? selectedAttempt.answers.filter((answer) => isFrqQuestion(answer.question.type)).map((answer) => answer.id)
        : answerId
        ? [answerId]
        : []

    if (targetAnswerIds.length === 0) return

    setAiErrors((prev) => {
      const next = { ...prev }
      targetAnswerIds.forEach((id) => {
        next[id] = null
      })
      return next
    })

    setAiLoadingByAnswer((prev) => {
      const next = { ...prev }
      targetAnswerIds.forEach((id) => {
        next[id] = true
      })
      return next
    })

    if (mode === 'all') {
      setBulkAiLoading(true)
    }

    try {
      const response = await fetch(`/api/tests/${testId}/attempts/${selectedAttempt.id}/ai/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, answerId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to request AI grading')
      }

      const data = await response.json()
      setAiSuggestions((prev) => {
        const next = { ...prev }
        ;(data.suggestions || []).forEach((suggestion: AiSuggestion) => {
          next[suggestion.answerId] = suggestion
        })
        return next
      })

      const suggestionCount = data.suggestions?.length || 0
      if (suggestionCount > 0) {
        toast({
          title: 'AI Assist ready',
          description: `Generated ${suggestionCount} suggestion${suggestionCount > 1 ? 's' : ''}. Review before applying.`,
        })
      } else {
        toast({
          title: 'No suggestions returned',
          description: 'AI did not return any suggestions for this request.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      const message = error.message || 'AI Assist request failed'
      setAiErrors((prev) => {
        const next = { ...prev }
        targetAnswerIds.forEach((id) => {
          next[id] = message
        })
        return next
      })
      toast({
        title: 'AI Assist error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setAiLoadingByAnswer((prev) => {
        const next = { ...prev }
        targetAnswerIds.forEach((id) => {
          next[id] = false
        })
        return next
      })
      if (mode === 'all') {
        setBulkAiLoading(false)
      }
    }
  }

  const handleAcceptSuggestion = (answerId: string) => {
    const suggestion = aiSuggestions[answerId]
    if (!suggestion) return

    setGradeEdits((prev) => {
      const existing = prev[answerId] || { answerId, pointsAwarded: 0, graderNote: '', aiSuggestionId: null }
      const feedbackParts = [suggestion.explanation]
      if (suggestion.strengths) {
        feedbackParts.push(`Strengths: ${suggestion.strengths}`)
      }
      if (suggestion.gaps) {
        feedbackParts.push(`Gaps: ${suggestion.gaps}`)
      }
      if (suggestion.rubricAlignment) {
        feedbackParts.push(`Rubric: ${suggestion.rubricAlignment}`)
      }
      const autoNote = feedbackParts.filter(Boolean).join('\n')

      return {
        ...prev,
        [answerId]: {
          ...existing,
          pointsAwarded: suggestion.suggestedPoints,
          graderNote: existing.graderNote || autoNote,
          aiSuggestionId: suggestion.id,
        },
      }
    })

    toast({
      title: 'AI suggestion applied',
      description: 'Score and feedback fields were filled in. Review before saving.',
    })
  }

  const handleDismissSuggestion = async (answerId: string) => {
    if (!selectedAttempt) return
    const suggestion = aiSuggestions[answerId]
    if (!suggestion) return

    try {
      const response = await fetch(
        `/api/tests/${testId}/attempts/${selectedAttempt.id}/ai/suggestions/${suggestion.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss' }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to dismiss suggestion')
      }

      setAiSuggestions((prev) => ({
        ...prev,
        [answerId]: suggestion ? { ...suggestion, status: 'DISMISSED' as AiSuggestionStatus } : null,
      }))

      toast({
        title: 'Suggestion dismissed',
        description: 'AI suggestion was marked as dismissed for this answer.',
      })
    } catch (error: any) {
      toast({
        title: 'Could not dismiss suggestion',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      })
    }
  }

  // Group attempts by user to calculate attempt numbers
  const attemptsByUser = attempts.reduce((acc, attempt) => {
    const userId = attempt.membershipId
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(attempt)
    return acc
  }, {} as Record<string, Attempt[]>)

  // Sort each user's attempts by submission date and assign attempt numbers
  Object.keys(attemptsByUser).forEach(userId => {
    attemptsByUser[userId].sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
      return dateA - dateB // Oldest first for numbering
    })
  })

  const attemptsWithNumbers = attempts.map(attempt => {
    const userAttempts = attemptsByUser[attempt.membershipId]
    const attemptNumber = userAttempts.findIndex(a => a.id === attempt.id) + 1
    return { ...attempt, attemptNumber }
  })

  // Filter and sort attempts
  const filteredAndSortedAttempts = attemptsWithNumbers
    .filter(attempt => {
      // Filter by user name
      if (filterUserName) {
        const userName = (attempt.user?.name || attempt.user?.email || '').toLowerCase()
        if (!userName.includes(filterUserName.toLowerCase())) {
          return false
        }
      }
      // Filter by attempt number
      if (filterAttemptNumber) {
        const attemptNum = parseInt(filterAttemptNumber)
        if (isNaN(attemptNum) || attempt.attemptNumber !== attemptNum) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'submission') {
        // Sort by submission date
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        // Sort by score
        const scoreA = a.gradeEarned ?? -1
        const scoreB = b.gradeEarned ?? -1
        return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB
      }
    })

  const sortedAttempts = filteredAndSortedAttempts

  const selectedAttemptHasFrq =
    selectedAttempt?.answers.some((answer) => isFrqQuestion(answer.question.type)) ?? false

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      NOT_STARTED: { label: 'Not Started', variant: 'secondary' },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' },
      SUBMITTED: { label: 'Submitted', variant: 'default' },
      GRADED: { label: 'Graded', variant: 'default' },
      INVALIDATED: { label: 'Invalidated', variant: 'destructive' },
    }
    const { label, variant } = config[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getProctoringBadge = (score: number | null) => {
    if (score === null) return null
    if (score >= 75) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          High Risk ({score})
        </Badge>
      )
    }
    if (score >= 40) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-500">
          <AlertTriangle className="h-3 w-3" />
          Medium Risk ({score})
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Low Risk ({score})
      </Badge>
    )
  }

  if (loading) {
    return <div className="p-4">Loading attempts...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attempts ({sortedAttempts.length}{sortedAttempts.length !== attempts.length ? ` of ${attempts.length}` : ''})
                </CardTitle>
                <CardDescription>
                  View all student attempts for {testName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="gap-2"
                  disabled={sortedAttempts.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScoringKeyOpen(true)}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  Proctoring Key
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* User Name Filter */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by user name..."
                  value={filterUserName}
                  onChange={(e) => setFilterUserName(e.target.value)}
                  className="h-9"
                />
                {filterUserName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterUserName('')}
                    className="h-9 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Attempt Number Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="attemptFilter" className="text-sm text-muted-foreground whitespace-nowrap">
                  Attempt #:
                </label>
                <Input
                  id="attemptFilter"
                  type="number"
                  min="1"
                  placeholder="All"
                  value={filterAttemptNumber}
                  onChange={(e) => setFilterAttemptNumber(e.target.value)}
                  className="h-9 w-24"
                />
                {filterAttemptNumber && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterAttemptNumber('')}
                    className="h-9 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm text-muted-foreground whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'submission' | 'score')}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="submission">Submission Date</option>
                  <option value="score">Score</option>
                </select>
              </div>

              {/* Sort Direction Dropdown */}
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="desc">
                  {sortBy === 'submission' ? 'Newest First' : 'High to Low'}
                </option>
                <option value="asc">
                  {sortBy === 'submission' ? 'Oldest First' : 'Low to High'}
                </option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attempts yet
            </p>
          ) : (
            <div className="space-y-3">
              {sortedAttempts.map((attempt) => (
                <Card key={attempt.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {attempt.user?.name || attempt.user?.email || 'Unknown User'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Attempt #{attempt.attemptNumber}
                          </Badge>
                          {getStatusBadge(attempt.status)}
                          {getProctoringBadge(attempt.proctoringScore)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                          {attempt.gradeEarned !== null && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Score:</span>
                              <span>{(() => {
                                const breakdown = calculateScoreBreakdown(attempt)
                                return `${breakdown.earnedPoints.toFixed(1)} / ${breakdown.gradedTotalPoints.toFixed(1)} pts`
                              })()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {getGradingStatusBadge(calculateGradingStatus(attempt).status)}
                          </div>
                          {attempt.submittedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(attempt.submittedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {attempt.tabSwitchCount > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{attempt.tabSwitchCount} tab switches</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(attempt)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attempt Details</DialogTitle>
            <DialogDescription>
              {selectedAttempt?.user?.name || selectedAttempt?.user?.email || 'Unknown User'}
            </DialogDescription>
          </DialogHeader>

          {selectedAttempt && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAttempt.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Grading Status</p>
                  <div className="mt-1">{getGradingStatusBadge(calculateGradingStatus(selectedAttempt).status)}</div>
                </div>
                {selectedAttempt.gradeEarned !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Score</p>
                    <p className="text-lg font-semibold">
                      {(() => {
                        const breakdown = calculateScoreBreakdown(selectedAttempt)
                        return `${breakdown.earnedPoints.toFixed(1)} / ${breakdown.gradedTotalPoints.toFixed(1)} pts`
                      })()}
                    </p>
                    {(() => {
                      const breakdown = calculateScoreBreakdown(selectedAttempt)
                      return breakdown.gradedTotalPoints < breakdown.overallTotalPoints && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (of {breakdown.overallTotalPoints.toFixed(1)} total)
                        </p>
                      )
                    })()}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Time Taken</p>
                  <p className="text-lg font-semibold">
                    {calculateTimeTaken(selectedAttempt.startedAt, selectedAttempt.submittedAt)}
                  </p>
                </div>
                {selectedAttempt.proctoringScore !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Proctoring</p>
                    <div className="mt-1">{getProctoringBadge(selectedAttempt.proctoringScore)}</div>
                  </div>
                )}
                {selectedAttempt.tabSwitchCount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Tab Switches</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {selectedAttempt.tabSwitchCount}
                    </p>
                  </div>
                )}
                {selectedAttempt.timeOffPageSeconds > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Time Off Page</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {Math.floor(selectedAttempt.timeOffPageSeconds / 60)}m {selectedAttempt.timeOffPageSeconds % 60}s
                    </p>
                  </div>
                )}
                {selectedAttempt.submittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                    <p className="text-sm">{new Date(selectedAttempt.submittedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Proctor Events / Tab-Out Details */}
              {selectedAttempt.proctorEvents && selectedAttempt.proctorEvents.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Proctoring Events ({selectedAttempt.proctorEvents.length})
                    </CardTitle>
                    <CardDescription>
                      Detailed timeline of tab switches and other suspicious activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedAttempt.proctorEvents.map((event, idx) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-2 rounded bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs font-semibold text-orange-700 dark:text-orange-300">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {event.kind.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.ts).toLocaleTimeString()}
                              </span>
                            </div>
                            {event.meta && Object.keys(event.meta).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {JSON.stringify(event.meta)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Answers */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg">Responses</h3>
                  {selectedAttemptHasFrq && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => requestAiSuggestions({ mode: 'all' })}
                        disabled={bulkAiLoading}
                        className="gap-2"
                      >
                        {bulkAiLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            AI Grade All FRQs
                          </>
                        )}
                      </Button>
                      <Button onClick={handleSaveGrades} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Grades'}
                      </Button>
                    </div>
                  )}
                </div>
                {selectedAttemptHasFrq && (
                  <p className="text-xs text-muted-foreground">
                    Manual scores remain the source of truth. AI Assist only fills draft values until you press
                    &quot;Save Grades&quot;.
                  </p>
                )}
                {selectedAttempt.answers && selectedAttempt.answers.length > 0 ? (
                  selectedAttempt.answers.map((answer, index) => {
                    const suggestion = aiSuggestions[answer.id]
                    const aiLoading = aiLoadingByAnswer[answer.id]
                    const aiError = aiErrors[answer.id]
                    const isFrq = isFrqQuestion(answer.question.type)

                    return (
                      <Card key={answer.id} className="border-border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                Question {index + 1}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {answer.question.promptMd}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {answer.question.type.replace('MCQ_', '').replace('_', ' ')}
                              </Badge>
                              {answer.pointsAwarded !== null && (
                                <Badge variant={answer.pointsAwarded > 0 ? 'default' : 'destructive'}>
                                  {answer.pointsAwarded} / {answer.question.points} pts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                        {/* Student's Answer */}
                        {answer.question.type.startsWith('MCQ') && answer.selectedOptionIds && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Student&apos;s Answer
                            </p>
                            <div className="space-y-2">
                              {answer.question.options.map((option) => {
                                const isSelected = answer.selectedOptionIds?.includes(option.id)
                                const isCorrect = option.isCorrect
                                return (
                                  <div
                                    key={option.id}
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      isSelected
                                        ? isCorrect
                                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                          : 'border-red-500 bg-red-50 dark:bg-red-950'
                                        : isCorrect
                                        ? 'border-green-300 bg-green-50/50 dark:bg-green-950/50'
                                        : 'border-border'
                                    }`}
                                  >
                                    {isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                                    {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                                    {!isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-400" />}
                                    <span className="flex-1">{option.label}</span>
                                    {isCorrect && !isSelected && (
                                      <span className="text-xs text-green-600">Correct</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {answer.question.type === 'NUMERIC' && answer.numericAnswer !== null && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Student&apos;s Answer
                            </p>
                            <p className="font-mono">{answer.numericAnswer}</p>
                          </div>
                        )}

                        {/* FRQ Questions - Show Grading Interface */}
                        {isFrq && (
                          <div className="space-y-4">
                            {/* Student's Answer */}
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                Student&apos;s Answer
                              </p>
                              <div className="whitespace-pre-wrap p-3 bg-muted/30 rounded border">
                                {answer.answerText && answer.answerText.trim() ? (
                                  answer.answerText
                                ) : (
                                  <span className="text-muted-foreground italic">No answer provided</span>
                                )}
                              </div>
                            </div>

                            {/* Example Solution */}
                            {answer.question.explanation && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 mb-2">
                                  Example Solution / Grading Guide
                                </p>
                                <div className="whitespace-pre-wrap p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                  {answer.question.explanation}
                                </div>
                              </div>
                            )}

                            {/* Grading Interface */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                              <div>
                                <Label htmlFor={`points-${answer.id}`} className="text-sm font-semibold">
                                  Points Awarded (max: {answer.question.points})
                                </Label>
                                <Input
                                  id={`points-${answer.id}`}
                                  type="number"
                                  min="0"
                                  max={answer.question.points}
                                  step="0.5"
                                  value={gradeEdits[answer.id]?.pointsAwarded === 0 ? '' : gradeEdits[answer.id]?.pointsAwarded ?? ''}
                                  onChange={(e) => handleGradeEdit(answer.id, 'pointsAwarded', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  className="mt-1"
                                  placeholder="0"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label htmlFor={`feedback-${answer.id}`} className="text-sm font-semibold">
                                  Feedback (optional)
                                </Label>
                                <Textarea
                                  id={`feedback-${answer.id}`}
                                  value={gradeEdits[answer.id]?.graderNote ?? ''}
                                  onChange={(e) => handleGradeEdit(answer.id, 'graderNote', e.target.value)}
                                  placeholder="Provide feedback to the student..."
                                  className="mt-1 min-h-[80px]"
                                />
                              </div>
                              {answer.gradedAt && (
                                <div className="md:col-span-2 text-xs text-muted-foreground">
                                  Last graded: {new Date(answer.gradedAt).toLocaleString()}
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/40 dark:bg-slate-900/40 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase text-blue-900 dark:text-blue-100 flex items-center gap-1">
                                    <Bot className="h-3.5 w-3.5" />
                                    AI Assist (optional)
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Suggestions never auto-apply. Review before accepting.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => requestAiSuggestions({ mode: 'single', answerId: answer.id })}
                                  disabled={aiLoading}
                                  className="gap-1"
                                >
                                  {aiLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Working...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4" />
                                      AI Suggestion
                                    </>
                                  )}
                                </Button>
                              </div>
                              {aiError && (
                                <p className="text-xs text-red-600">
                                  {aiError}
                                </p>
                              )}
                              {suggestion ? (
                                <div className="space-y-2 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-semibold">
                                      Suggested: {suggestion.suggestedPoints} / {suggestion.maxPoints} pts
                                    </div>
                                    {renderAiStatusBadge(suggestion.status)}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {suggestion.explanation}
                                  </p>
                                  {suggestion.strengths && (
                                    <p className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap">
                                      <span className="font-semibold">Strengths:</span> {suggestion.strengths}
                                    </p>
                                  )}
                                  {suggestion.gaps && (
                                    <p className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap">
                                      <span className="font-semibold">Needs work:</span> {suggestion.gaps}
                                    </p>
                                  )}
                                  {suggestion.rubricAlignment && (
                                    <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                      <span className="font-semibold">Rubric map:</span> {suggestion.rubricAlignment}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-muted-foreground">
                                    Suggested {new Date(suggestion.createdAt).toLocaleString()}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button size="sm" onClick={() => handleAcceptSuggestion(answer.id)} className="gap-1">
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      Accept &amp; fill form
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDismissSuggestion(answer.id)}
                                      disabled={suggestion.status === 'DISMISSED'}
                                      className="gap-1"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No AI suggestion yet. Use the button above to get a rubric-aligned draft grade.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Show saved grader note for non-FRQ questions */}
                        {answer.question.type !== 'SHORT_TEXT' && answer.question.type !== 'LONG_TEXT' && answer.graderNote && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                            <p className="text-xs font-semibold uppercase text-blue-900 dark:text-blue-100 mb-1">
                              Grader Note
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">{answer.graderNote}</p>
                          </div>
                        )}
                      </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No answers recorded
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Proctoring Key Dialog */}
      <Dialog open={scoringKeyOpen} onOpenChange={setScoringKeyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Proctoring Key
            </DialogTitle>
            <DialogDescription>
              Understanding how suspicious activity is measured
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Score Ranges */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Risk Levels</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Low Risk</span>
                  </div>
                  <span className="text-sm text-muted-foreground">0-39 points</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Medium Risk</span>
                  </div>
                  <span className="text-sm text-muted-foreground">40-74 points</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">High Risk</span>
                  </div>
                  <span className="text-sm text-muted-foreground">75-100 points</span>
                </div>
              </div>
            </div>

            {/* Event Weights */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Event Weights</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Each event type contributes points to the risk score. Repeated events have diminishing returns.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">DevTools Open</span>
                  <Badge variant="destructive">20</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Exit Fullscreen</span>
                  <Badge variant="destructive">15</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Multi-Monitor Hint</span>
                  <Badge variant="destructive">12</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Tab Switch</span>
                  <Badge variant="default">10</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Copy</span>
                  <Badge variant="default">10</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Visibility Hidden</span>
                  <Badge variant="default">8</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Paste</span>
                  <Badge variant="default">8</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Blur</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Network Offline</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Context Menu</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/20">
                  <span className="text-sm">Resize</span>
                  <Badge variant="secondary">2</Badge>
                </div>
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                How It&apos;s Calculated
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Each event adds its weighted points to the total score</li>
                <li>• Repeated events use diminishing returns: <code className="bg-muted px-1 py-0.5 rounded">weight × log(count + 1)</code></li>
                <li>• This prevents excessive penalties for minor repeated actions</li>
                <li>• Total score is capped at 100</li>
                <li>• Example: 1st tab switch ≈ 7-10 pts, 2nd ≈ +5-7 pts, 3rd ≈ +3-5 pts</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

