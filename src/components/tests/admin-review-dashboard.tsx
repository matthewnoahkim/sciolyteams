'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface AdminReviewDashboardProps {
  testId: string
  teamId: string
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
  membership: {
    user: {
      name: string | null
      email: string
    }
    subteam: {
      name: string
    } | null
  } | null
  answers: Array<{
    questionId: string
    question: {
      type: string
      promptMd: string
      points: number
      options?: Array<{ id: string; label: string; isCorrect: boolean }>
    }
    answerText?: string | null
    selectedOptionIds?: string[] | null
    numericAnswer?: number | null
    pointsAwarded?: number | null
    graderNote?: string | null
  }>
  proctorEvents: Array<{
    kind: string
    ts: string
    meta?: any
  }>
}

export function AdminReviewDashboard({ testId, teamId }: AdminReviewDashboardProps) {
  const { toast } = useToast()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  useEffect(() => {
    fetchAttempts()
  }, [testId])

  const fetchAttempts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tests/${testId}/attempts`)
      if (response.ok) {
        const data = await response.json()
        setAttempts(data.attempts || [])
      } else {
        throw new Error('Failed to fetch attempts')
      }
    } catch (error) {
      console.error('Failed to fetch attempts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load test attempts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTabOutInfo = (attempt: Attempt) => {
    if (attempt.tabSwitchCount === 0 && attempt.timeOffPageSeconds === 0) {
      return 'No tab switches detected'
    }
    return `${attempt.tabSwitchCount} tab switch${attempt.tabSwitchCount !== 1 ? 'es' : ''}, ${Math.floor(attempt.timeOffPageSeconds / 60)}m ${attempt.timeOffPageSeconds % 60}s off page`
  }

  const getProctoringBadge = (score: number | null) => {
    if (score === null) return null
    if (score < 30) {
      return <Badge variant="default" className="bg-green-600">Low Risk</Badge>
    }
    if (score < 60) {
      return <Badge variant="default" className="bg-yellow-600">Medium Risk</Badge>
    }
    return <Badge variant="destructive">High Risk</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading attempts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Review Responses ({attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'})
        </CardTitle>
        <CardDescription>
          View all student submissions, responses, and proctoring data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {attempts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No attempts have been submitted yet.
          </p>
        ) : (
          attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {attempt.membership?.user.name || attempt.membership?.user.email || 'Unknown User'}
                    </h4>
                    {attempt.membership?.subteam && (
                      <Badge variant="outline" className="text-xs">
                        {attempt.membership.subteam.name}
                      </Badge>
                    )}
                    <Badge variant={attempt.status === 'GRADED' ? 'default' : 'secondary'}>
                      {attempt.status}
                    </Badge>
                    {getProctoringBadge(attempt.proctoringScore)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {attempt.startedAt && (
                      <span>Started: {new Date(attempt.startedAt).toLocaleString()}</span>
                    )}
                    {attempt.submittedAt && (
                      <span>Submitted: {new Date(attempt.submittedAt).toLocaleString()}</span>
                    )}
                    {attempt.gradeEarned !== null && (
                      <span className="font-medium text-foreground">
                        Score: {Number(attempt.gradeEarned).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formatTabOutInfo(attempt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)
                  }
                >
                  {expandedAttempt === attempt.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedAttempt === attempt.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Proctor Events */}
                  {attempt.proctorEvents.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Proctoring Events
                      </h5>
                      <div className="space-y-1 text-sm">
                        {attempt.proctorEvents.map((event, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">
                              {new Date(event.ts).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {event.kind.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answers */}
                  <div>
                    <h5 className="font-medium text-sm mb-3">Responses</h5>
                    <div className="space-y-4">
                      {attempt.answers.map((answer) => {
                        const isCorrect =
                          answer.pointsAwarded !== null &&
                          answer.pointsAwarded === Number(answer.question.points)
                        const pointsAwarded = answer.pointsAwarded ?? 0
                        const totalPoints = Number(answer.question.points)

                        return (
                          <div
                            key={answer.questionId}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{answer.question.promptMd}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isCorrect ? (
                                    <Badge variant="default" className="bg-green-600 gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Correct
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="gap-1">
                                      <XCircle className="h-3 w-3" />
                                      Incorrect
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {pointsAwarded.toFixed(2)} / {totalPoints.toFixed(2)} points
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Student's Answer */}
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <span className="text-muted-foreground">Student Answer: </span>
                              {answer.question.type === 'MCQ_SINGLE' ||
                              answer.question.type === 'MCQ_MULTI' ? (
                                <div className="mt-1">
                                  {answer.selectedOptionIds?.map((optionId) => {
                                    const option = answer.question.options?.find(
                                      (o) => o.id === optionId
                                    )
                                    return (
                                      <div key={optionId} className="flex items-center gap-2">
                                        <span>{option?.label || optionId}</span>
                                        {option?.isCorrect && (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        )}
                                      </div>
                                    )
                                  }) || 'No answer selected'}
                                </div>
                              ) : answer.question.type === 'NUMERIC' ? (
                                <span>{answer.numericAnswer ?? 'No answer'}</span>
                              ) : (
                                <p className="whitespace-pre-wrap mt-1">
                                  {answer.answerText || 'No answer provided'}
                                </p>
                              )}
                            </div>

                            {/* Correct Answer (for MCQ) */}
                            {(answer.question.type === 'MCQ_SINGLE' ||
                              answer.question.type === 'MCQ_MULTI') &&
                              answer.question.options && (
                                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                                  <span className="text-muted-foreground">Correct Answer: </span>
                                  <div className="mt-1">
                                    {answer.question.options
                                      .filter((o) => o.isCorrect)
                                      .map((o) => o.label)
                                      .join(', ')}
                                  </div>
                                </div>
                              )}

                            {/* Grader Feedback */}
                            {answer.graderNote && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                                <span className="font-medium">Grader Feedback: </span>
                                <p className="mt-1">{answer.graderNote}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

