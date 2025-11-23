'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, CheckCircle, XCircle, Clock, Lock } from 'lucide-react'

interface ViewResultsClientProps {
  testId: string
  teamId: string
}

interface ResultsData {
  test: {
    id: string
    name: string
    releaseScoresAt: string | null
    scoreReleaseVisibility: string
  }
  attempt: {
    id: string
    status: string
    submittedAt: string | null
    canViewScore: boolean
    score: number | null
    answers: Array<{
      questionId: string
      question: {
        type: string
        promptMd: string
        points: number
        options?: Array<{ id: string; label: string; isCorrect?: boolean }>
      }
      answerText?: string | null
      selectedOptionIds?: string[] | null
      numericAnswer?: number | null
      pointsAwarded?: number | null
      graderNote?: string | null
      isCorrect?: boolean
    }>
  }
  scoresReleased: boolean
}

export function ViewResultsClient({ testId, teamId }: ViewResultsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ResultsData | null>(null)

  useEffect(() => {
    fetchResults()
  }, [testId])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tests/${testId}/my-results`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch results')
      }
    } catch (error: any) {
      console.error('Failed to fetch results:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load results',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No results available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { test, attempt, scoresReleased } = results

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/teams/${teamId}?tab=tests`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <h1 className="text-3xl font-bold">{test.name} - Results</h1>
      </div>

      {!scoresReleased && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Scores not yet released
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Results will be available on{' '}
                  {test.releaseScoresAt
                    ? new Date(test.releaseScoresAt).toLocaleString()
                    : 'after grading'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {scoresReleased && attempt.canViewScore && (
        <>
          {/* Score Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Score</CardTitle>
              <CardDescription>
                Submitted on{' '}
                {attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleString()
                  : 'Unknown date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attempt.score !== null ? (
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">{Number(attempt.score).toFixed(2)}</div>
                  <p className="text-muted-foreground">Points</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  Score not yet available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Answers (if visible) */}
          {attempt.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {test.scoreReleaseVisibility === 'SCORE_AND_MISSED'
                    ? 'Missed Questions'
                    : 'Your Responses'}
                </CardTitle>
                <CardDescription>
                  {test.scoreReleaseVisibility === 'SCORE_ONLY'
                    ? 'Score only mode - answers not shown'
                    : test.scoreReleaseVisibility === 'SCORE_AND_MISSED'
                    ? 'Showing only questions you answered incorrectly'
                    : 'Showing all questions with your answers and feedback'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {attempt.answers.map((answer, index) => {
                  const isCorrect = answer.isCorrect ?? false
                  const pointsAwarded = answer.pointsAwarded ?? 0
                  const totalPoints = Number(answer.question.points)

                  return (
                    <div
                      key={answer.questionId}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Question {index + 1}</h3>
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
                            <span className="text-sm text-muted-foreground">
                              {pointsAwarded.toFixed(2)} / {totalPoints.toFixed(2)} points
                            </span>
                          </div>
                          <p className="font-medium">{answer.question.promptMd}</p>
                        </div>
                      </div>

                      {/* Student's Answer */}
                      <div className="p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-2">Your Answer:</p>
                        {answer.question.type === 'MCQ_SINGLE' ||
                        answer.question.type === 'MCQ_MULTI' ? (
                          <div className="space-y-1">
                            {answer.selectedOptionIds?.map((optionId) => {
                              const option = answer.question.options?.find(
                                (o) => o.id === optionId
                              )
                              return (
                                <div key={optionId} className="flex items-center gap-2">
                                  <span>{option?.label || optionId}</span>
                                  {test.scoreReleaseVisibility === 'SCORE_AND_FULL_COPY' &&
                                    option?.isCorrect && (
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    )}
                                </div>
                              )
                            }) || 'No answer selected'}
                          </div>
                        ) : answer.question.type === 'NUMERIC' ? (
                          <p>{answer.numericAnswer ?? 'No answer'}</p>
                        ) : (
                          <p className="whitespace-pre-wrap">{answer.answerText || 'No answer provided'}</p>
                        )}
                      </div>

                      {/* Correct Answer (only shown in full copy mode) */}
                      {test.scoreReleaseVisibility === 'SCORE_AND_FULL_COPY' &&
                        (answer.question.type === 'MCQ_SINGLE' ||
                          answer.question.type === 'MCQ_MULTI') &&
                        answer.question.options && (
                          <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                            <p className="text-sm font-medium mb-2">Correct Answer:</p>
                            <div>
                              {answer.question.options
                                .filter((o) => o.isCorrect)
                                .map((o) => o.label)
                                .join(', ')}
                            </div>
                          </div>
                        )}

                      {/* Grader Feedback (only shown in full copy mode) */}
                      {test.scoreReleaseVisibility === 'SCORE_AND_FULL_COPY' &&
                        answer.graderNote && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                            <p className="text-sm font-medium mb-1">Grader Feedback:</p>
                            <p className="text-sm">{answer.graderNote}</p>
                          </div>
                        )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

