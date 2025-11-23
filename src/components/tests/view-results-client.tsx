'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

// Client-safe helper functions (don't import from test-security.ts which has server-only deps)
function shouldReleaseScores(releaseScoresAt: Date | null, status: string): boolean {
  if (status !== 'PUBLISHED') {
    return true
  }
  if (!releaseScoresAt) {
    return true
  }
  return new Date() >= new Date(releaseScoresAt)
}

interface ViewResultsClientProps {
  testId: string
  testName: string
  attempt: any
  testSettings: {
    releaseScoresAt: Date | null
    scoreReleaseMode: 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST'
  }
}

export function ViewResultsClient({
  testId,
  testName,
  attempt: initialAttempt,
  testSettings,
}: ViewResultsClientProps) {
  const router = useRouter()
  const [attempt, setAttempt] = useState(initialAttempt)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch latest results
    const fetchResults = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/tests/${testId}/my-results`)
        if (response.ok) {
          const data = await response.json()
          setAttempt(data.attempt)
        }
      } catch (error) {
        console.error('Failed to fetch results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [testId])

  if (!attempt) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
          <p className="text-muted-foreground">
            You haven't submitted any attempts for this test yet.
          </p>
        </div>
      </div>
    )
  }

  const scoresReleased = shouldReleaseScores(testSettings.releaseScoresAt, 'PUBLISHED')

  // The API already filters the attempt based on release mode, so we can use it directly
  // But we need to handle the case where answers might be null (SCORE_ONLY mode)
  const sortedAnswers = attempt.answers
    ? [...(attempt.answers || [])].sort((a: any, b: any) => a.question.order - b.question.order)
    : []

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <h1 className="text-3xl font-bold mb-2">{testName}</h1>
        <p className="text-muted-foreground">Your Test Results</p>
      </div>

      {!scoresReleased && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Scores Not Yet Released
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Your scores will be available on{' '}
                  {testSettings.releaseScoresAt
                    ? new Date(testSettings.releaseScoresAt).toLocaleString()
                    : 'a later date'}
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {scoresReleased && attempt.gradeEarned !== null && attempt.gradeEarned !== undefined && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {typeof attempt.gradeEarned === 'number' 
                ? attempt.gradeEarned.toFixed(2)
                : Number(attempt.gradeEarned || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}

      {scoresReleased && attempt.answers && sortedAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Responses</CardTitle>
            <CardDescription>
              {testSettings.scoreReleaseMode === 'SCORE_ONLY'
                ? 'Score only mode - detailed responses not available'
                : testSettings.scoreReleaseMode === 'SCORE_WITH_WRONG'
                ? 'Showing questions you missed'
                : 'Full test review'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedAnswers.map((answer: any, index: number) => {
              const isCorrect = answer.pointsAwarded !== null && answer.pointsAwarded > 0
              const showDetails =
                testSettings.scoreReleaseMode === 'FULL_TEST' ||
                (testSettings.scoreReleaseMode === 'SCORE_WITH_WRONG' && !isCorrect)

              return (
                <Card key={answer.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                        {showDetails && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {answer.question.promptMd}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {answer.pointsAwarded !== null && (
                          <Badge
                            variant={isCorrect ? 'default' : 'destructive'}
                            className="gap-1"
                          >
                            {isCorrect ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {answer.pointsAwarded} / {answer.question.points} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {showDetails && (
                    <CardContent className="space-y-3">
                      {/* MCQ Answers */}
                      {answer.question.type.startsWith('MCQ') &&
                        answer.selectedOptionIds &&
                        answer.question.options && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Your Answer
                            </p>
                            <div className="space-y-2">
                              {answer.question.options.map((option: any) => {
                                const isSelected = answer.selectedOptionIds?.includes(option.id)
                                const isCorrectOption = option.isCorrect
                                return (
                                  <div
                                    key={option.id}
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      isSelected
                                        ? isCorrectOption
                                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                          : 'border-red-500 bg-red-50 dark:bg-red-950'
                                        : isCorrectOption
                                        ? 'border-green-300 bg-green-50/50 dark:bg-green-950/50'
                                        : 'border-border'
                                    }`}
                                  >
                                    {isSelected && isCorrectOption && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    {!isSelected && isCorrectOption && (
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    )}
                                    <span className="flex-1">{option.label}</span>
                                    {isCorrectOption && !isSelected && (
                                      <span className="text-xs text-green-600">Correct Answer</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                      {/* Numeric Answer */}
                      {answer.question.type === 'NUMERIC' &&
                        answer.numericAnswer !== null && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Your Answer
                            </p>
                            <p className="font-mono">{answer.numericAnswer}</p>
                          </div>
                        )}

                      {/* Text Answers */}
                      {(answer.question.type === 'SHORT_TEXT' ||
                        answer.question.type === 'LONG_TEXT') &&
                        answer.answerText && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                              Your Answer
                            </p>
                            <p className="whitespace-pre-wrap p-3 bg-muted/30 rounded">
                              {answer.answerText}
                            </p>
                          </div>
                        )}

                      {/* Grader Feedback */}
                      {answer.graderNote && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                          <p className="text-xs font-semibold uppercase text-blue-900 dark:text-blue-100 mb-1">
                            Grader Feedback
                          </p>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {answer.graderNote}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

