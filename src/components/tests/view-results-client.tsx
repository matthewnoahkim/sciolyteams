'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { QuestionPrompt } from '@/components/tests/question-prompt'

// Client-safe helper functions (do not import from test-security.ts which has server-only deps)
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
    scoreReleaseMode: 'NONE' | 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST'
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
  const [allAttempts, setAllAttempts] = useState<any[]>([])
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(initialAttempt?.id || null)
  const [loading, setLoading] = useState(false)
  const [testSettingsState, setTestSettingsState] = useState(testSettings)

  useEffect(() => {
    // Initialize with the initial attempt if provided
    if (initialAttempt) {
      setAllAttempts([initialAttempt])
      setSelectedAttemptId(initialAttempt.id)
      setAttempt(initialAttempt)
    }

    // Fetch all attempts
    const fetchAllAttempts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/tests/${testId}/my-all-attempts`)
        if (response.ok) {
          const data = await response.json()
          const attempts = data.attempts || []
          setAllAttempts(attempts)
          // Update test settings from API response
          if (data.test) {
            setTestSettingsState({
              releaseScoresAt: data.test.releaseScoresAt ? new Date(data.test.releaseScoresAt) : null,
              scoreReleaseMode: data.test.scoreReleaseMode || 'FULL_TEST',
            })
          }
          // Set selected attempt to the first (latest) one if available
          if (attempts.length > 0) {
            setSelectedAttemptId(attempts[0].id)
            setAttempt(attempts[0])
          } else if (initialAttempt) {
            // Fallback to initial attempt if no attempts from API
            setAllAttempts([initialAttempt])
            setSelectedAttemptId(initialAttempt.id)
            setAttempt(initialAttempt)
          }
        } else {
          // Fallback to single attempt API
          const singleResponse = await fetch(`/api/tests/${testId}/my-results`)
          if (singleResponse.ok) {
            const singleData = await singleResponse.json()
            if (singleData.attempt) {
              setAllAttempts([singleData.attempt])
              setSelectedAttemptId(singleData.attempt.id)
              setAttempt(singleData.attempt)
            }
            // Update test settings from API response
            if (singleData.test) {
              setTestSettingsState({
                releaseScoresAt: singleData.test.releaseScoresAt ? new Date(singleData.test.releaseScoresAt) : null,
                scoreReleaseMode: singleData.test.scoreReleaseMode || 'FULL_TEST',
              })
            }
          } else if (initialAttempt) {
            // Keep initial attempt if API fails
            setAllAttempts([initialAttempt])
            setSelectedAttemptId(initialAttempt.id)
            setAttempt(initialAttempt)
          }
        }
      } catch (error) {
        console.error('Failed to fetch results:', error)
        // Keep initial attempt if API fails
        if (initialAttempt) {
          setAllAttempts([initialAttempt])
          setSelectedAttemptId(initialAttempt.id)
          setAttempt(initialAttempt)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAllAttempts()
  }, [testId, initialAttempt])

  // Update selected attempt when selection changes
  useEffect(() => {
    if (selectedAttemptId && allAttempts.length > 0) {
      const selected = allAttempts.find((a) => a.id === selectedAttemptId)
      if (selected) {
        setAttempt(selected)
      }
    }
  }, [selectedAttemptId, allAttempts])

  if (!attempt) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
          <p className="text-muted-foreground">
            You haven&apos;t submitted any attempts for this test yet.
          </p>
        </div>
      </div>
    )
  }

  const scoresReleased = shouldReleaseScores(testSettingsState.releaseScoresAt, 'PUBLISHED')

  // The API already filters the attempt based on release mode, so we can use it directly
  // But we need to handle the case where answers might be null (SCORE_ONLY mode)
  const sortedAnswers = attempt.answers
    ? [...(attempt.answers || [])].sort((a: any, b: any) => a.question.order - b.question.order)
    : []

  // Calculate grading status
  const calculateGradingStatus = () => {
    if (!attempt.answers || attempt.answers.length === 0) {
      return { isFullyGraded: true, hasUngraded: false }
    }
    
    const hasUngraded = attempt.answers.some((a: any) => a.gradedAt === null)
    const isFullyGraded = !hasUngraded
    
    return { isFullyGraded, hasUngraded }
  }

  const gradingStatus = calculateGradingStatus()

  // Calculate score breakdown
  const calculateScoreBreakdown = () => {
    if (!attempt.answers || attempt.answers.length === 0) {
      return { earnedPoints: 0, gradedTotalPoints: 0, overallTotalPoints: 0 }
    }

    let earnedPoints = 0
    let gradedTotalPoints = 0
    let overallTotalPoints = 0

    attempt.answers.forEach((answer: any) => {
      const questionPoints = answer.question?.points || 0
      overallTotalPoints += questionPoints

      if (answer.gradedAt !== null) {
        gradedTotalPoints += questionPoints
        earnedPoints += answer.pointsAwarded || 0
      }
    })

    return { earnedPoints, gradedTotalPoints, overallTotalPoints }
  }

  const scoreBreakdown = calculateScoreBreakdown()

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
        
        {/* Attempt selector - show if there are multiple attempts */}
        {allAttempts.length > 1 && (
          <div className="mt-4">
            <Label htmlFor="attempt-select" className="text-sm font-medium mb-2 block">
              Select Attempt:
            </Label>
            <select
              id="attempt-select"
              value={selectedAttemptId || ''}
              onChange={(e) => setSelectedAttemptId(e.target.value)}
              className="w-full max-w-md h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {allAttempts.map((att, index) => (
                <option key={att.id} value={att.id}>
                  Attempt {allAttempts.length - index} - {att.submittedAt 
                    ? new Date(att.submittedAt).toLocaleString()
                    : 'Not submitted'} 
                  {att.gradeEarned !== null && att.gradeEarned !== undefined 
                    ? ` (Score: ${typeof att.gradeEarned === 'number' ? att.gradeEarned.toFixed(2) : Number(att.gradeEarned || 0).toFixed(2)})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {testSettingsState.scoreReleaseMode === 'NONE' && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Scores Not Released
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Scores are not released for this test.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!scoresReleased && testSettingsState.scoreReleaseMode !== 'NONE' && (
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

      {scoresReleased && testSettingsState.scoreReleaseMode !== 'NONE' && attempt.gradeEarned !== null && attempt.gradeEarned !== undefined && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-4xl font-bold">
                {scoreBreakdown.earnedPoints.toFixed(1)} / {scoreBreakdown.gradedTotalPoints.toFixed(1)} pts
              </div>
              
              {/* Show grading status if not fully graded */}
              {!gradingStatus.isFullyGraded && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Grading in Progress
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                      Some questions are still being graded. Your score shown is based on {scoreBreakdown.gradedTotalPoints.toFixed(1)} of {scoreBreakdown.overallTotalPoints.toFixed(1)} total points.
                    </p>
                  </div>
                </div>
              )}

              {testSettingsState.scoreReleaseMode === 'SCORE_ONLY' && (
                <p className="text-sm text-muted-foreground">
                  Only the score is available. Detailed answers and feedback are not released for this test.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show responses section only if not in SCORE_ONLY or NONE mode */}
      {scoresReleased && testSettingsState.scoreReleaseMode !== 'SCORE_ONLY' && testSettingsState.scoreReleaseMode !== 'NONE' && attempt.answers && sortedAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Responses</CardTitle>
            <CardDescription>
              {testSettingsState.scoreReleaseMode === 'SCORE_WITH_WRONG'
                ? 'Showing which questions you got correct and incorrect'
                : 'Full test review - all answers and feedback'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedAnswers.map((answer: any, index: number) => {
                const isCorrect = answer.pointsAwarded !== null && answer.pointsAwarded > 0
                // In SCORE_WITH_WRONG mode, show questions and correctness (but not answers)
                // In FULL_TEST mode, show everything including answers
                const showAnswerDetails = testSettingsState.scoreReleaseMode === 'FULL_TEST'

              return (
                <Card key={answer.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                        {answer.question && (
                          <div className="text-muted-foreground mt-1">
                            <QuestionPrompt promptMd={answer.question.promptMd} className="text-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {testSettingsState.scoreReleaseMode === 'SCORE_WITH_WRONG' ? (
                          // In SCORE_WITH_WRONG mode, just show correct/incorrect badge
                          <Badge variant={isCorrect ? 'default' : 'destructive'} className="gap-1">
                            {isCorrect ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        ) : (
                          // In FULL_TEST mode, show points
                          <>
                            {answer.gradedAt === null ? (
                              <Badge variant="secondary" className="bg-gray-500">
                                Pending Grading
                              </Badge>
                            ) : answer.pointsAwarded !== null && answer.question ? (
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
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {showAnswerDetails && (
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

                      {/* Text Answers (FRQs) */}
                      {(answer.question.type === 'SHORT_TEXT' ||
                        answer.question.type === 'LONG_TEXT') && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                Your Answer
                              </p>
                              <div className="whitespace-pre-wrap p-3 bg-muted/30 rounded border">
                                {answer.answerText && answer.answerText.trim() ? (
                                  answer.answerText
                                ) : (
                                  <span className="text-muted-foreground italic">No answer provided</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Show grading status for ungraded FRQs */}
                            {answer.gradedAt === null && (
                              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-orange-900 dark:text-orange-100">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  This response is pending grading by your instructor.
                                </p>
                              </div>
                            )}

                            {/* Example Solution (for FRQs in FULL_TEST mode) */}
                            {answer.question.explanation && answer.gradedAt !== null && (
                              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                <p className="text-xs font-semibold uppercase text-green-900 dark:text-green-100 mb-1">
                                  Example Solution
                                </p>
                                <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                                  {answer.question.explanation}
                                </p>
                              </div>
                            )}

                            {/* Grader Feedback */}
                            {answer.graderNote && answer.gradedAt !== null && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                                <p className="text-xs font-semibold uppercase text-blue-900 dark:text-blue-100 mb-1">
                                  Grader Feedback
                                </p>
                                <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                                  {answer.graderNote}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Grader Feedback for non-FRQ questions */}
                      {answer.question.type !== 'SHORT_TEXT' && 
                       answer.question.type !== 'LONG_TEXT' && 
                       answer.graderNote && (
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

