'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Users, Eye, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

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
  user: {
    id: string
    name: string | null
    email: string
  } | null
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
      options: Array<{
        id: string
        label: string
        isCorrect: boolean
      }>
    }
  }>
}

interface Section {
  id: string
  title: string | null
}

export function TestAttemptsView({ testId, testName }: TestAttemptsViewProps) {
  const { toast } = useToast()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchAttempts()
  }, [testId])

  const fetchAttempts = async () => {
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
  }

  const handleViewDetails = (attempt: Attempt) => {
    setSelectedAttempt(attempt)
    setDetailDialogOpen(true)
  }

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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attempts ({attempts.length})
          </CardTitle>
          <CardDescription>
            View all student attempts for {testName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attempts yet
            </p>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {attempt.user?.name || attempt.user?.email || 'Unknown User'}
                          </p>
                          {getStatusBadge(attempt.status)}
                          {getProctoringBadge(attempt.proctoringScore)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                          {attempt.gradeEarned !== null && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Score:</span>
                              <span>{attempt.gradeEarned.toFixed(2)}</span>
                            </div>
                          )}
                          {attempt.submittedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(attempt.submittedAt).toLocaleDateString()}
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
                {selectedAttempt.gradeEarned !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Score</p>
                    <p className="text-lg font-semibold">{selectedAttempt.gradeEarned.toFixed(2)}</p>
                  </div>
                )}
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
                {selectedAttempt.submittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                    <p className="text-sm">{new Date(selectedAttempt.submittedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Responses</h3>
                {selectedAttempt.answers && selectedAttempt.answers.length > 0 ? (
                  selectedAttempt.answers.map((answer, index) => (
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
                              Student's Answer
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
                              Student's Answer
                            </p>
                            <p className="font-mono">{answer.numericAnswer}</p>
                          </div>
                        )}

                        {(answer.question.type === 'SHORT_TEXT' || answer.question.type === 'LONG_TEXT') &&
                          answer.answerText && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                Student's Answer
                              </p>
                              <p className="whitespace-pre-wrap p-3 bg-muted/30 rounded">
                                {answer.answerText}
                              </p>
                            </div>
                          )}

                        {answer.graderNote && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                            <p className="text-xs font-semibold uppercase text-blue-900 dark:text-blue-100 mb-1">
                              Grader Note
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">{answer.graderNote}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
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
    </div>
  )
}

