'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { generateClientFingerprint } from '@/lib/test-security-client'
import { Clock, Lock, AlertCircle } from 'lucide-react'

interface TakeTestClientProps {
  test: any
  membership: any
  existingAttempt: any
  isAdmin: boolean
}

export function TakeTestClient({
  test,
  membership,
  existingAttempt,
  isAdmin,
}: TakeTestClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [attempt, setAttempt] = useState<any>(existingAttempt)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(!!existingAttempt)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [tabSwitchCount, setTabSwitchCount] = useState(existingAttempt?.tabSwitchCount || 0)
  const [timeOffPageSeconds, setTimeOffPageSeconds] = useState(existingAttempt?.timeOffPageSeconds || 0)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [offPageStartTime, setOffPageStartTime] = useState<number | null>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load existing answers
  useEffect(() => {
    if (existingAttempt?.answers) {
      const loadedAnswers: Record<string, any> = {}
      existingAttempt.answers.forEach((answer: any) => {
        loadedAnswers[answer.questionId] = {
          answerText: answer.answerText,
          selectedOptionIds: answer.selectedOptionIds || [],
          numericAnswer: answer.numericAnswer,
        }
      })
      setAnswers(loadedAnswers)
    }
  }, [existingAttempt])

  // Track page visibility and tab switching
  useEffect(() => {
    const recordProctorEvent = async (kind: string, meta?: any) => {
      if (!attempt || attempt.status !== 'IN_PROGRESS') return
      
      try {
        await fetch(`/api/tests/${test.id}/attempts/${attempt.id}/proctor-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, meta }),
        })
      } catch (error) {
        console.error('Failed to record proctor event:', error)
      }
    }

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)

      if (!isVisible) {
        setOffPageStartTime(Date.now())
        setTabSwitchCount((prev: number) => prev + 1)
        recordProctorEvent('TAB_SWITCH')
      } else {
        if (offPageStartTime) {
          const timeOff = Math.floor((Date.now() - offPageStartTime) / 1000)
          setTimeOffPageSeconds((prev: number) => prev + timeOff)
          setOffPageStartTime(null)
        }
      }
    }

    const handleBlur = () => {
      if (document.hidden) {
        setOffPageStartTime(Date.now())
        setTabSwitchCount((prev: number) => prev + 1)
        recordProctorEvent('BLUR')
      }
    }

    const handleFocus = () => {
      if (offPageStartTime) {
        const timeOff = Math.floor((Date.now() - offPageStartTime) / 1000)
        setTimeOffPageSeconds((prev: number) => prev + timeOff)
        setOffPageStartTime(null)
      }
    }

    if (started && attempt) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleBlur)
      window.addEventListener('focus', handleFocus)

      // Periodically update tab tracking on server
      trackingIntervalRef.current = setInterval(async () => {
        if (attempt && attempt.status === 'IN_PROGRESS') {
          try {
            await fetch(`/api/tests/${test.id}/attempts/${attempt.id}/tab-tracking`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tabSwitchCount,
                timeOffPageSeconds,
              }),
            })
          } catch (error) {
            console.error('Failed to update tab tracking:', error)
          }
        }
      }, 10000) // Update every 10 seconds
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
    }
  }, [started, attempt, tabSwitchCount, timeOffPageSeconds, test.id, offPageStartTime])

  const handleStartTest = async () => {
    if (test.testPasswordHash && !isAdmin && !password) {
      setPasswordError('Password is required')
      return
    }

    setLoading(true)
    setPasswordError('')

    try {
      const fingerprint = await generateClientFingerprint({
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

      const response = await fetch(`/api/tests/${test.id}/attempts/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          testPassword: password || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'NEED_TEST_PASSWORD') {
          setPasswordError(data.message || 'Invalid password')
        } else if (data.error === 'Maximum attempts reached') {
          toast({
            title: 'Maximum Attempts Reached',
            description: data.message,
            variant: 'destructive',
          })
        } else {
          throw new Error(data.error || 'Failed to start test')
        }
        return
      }

      setAttempt(data.attempt)
      setStarted(true)

      // Enter fullscreen if required
      if (test.requireFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
        } catch (error) {
          console.warn('Failed to enter fullscreen:', error)
          toast({
            title: 'Fullscreen Required',
            description: 'Please enable fullscreen mode to take this test',
            variant: 'destructive',
          })
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start test',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = useCallback(async (questionId: string, answerData: any) => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return

    try {
      const response = await fetch(`/api/tests/${test.id}/attempts/${attempt.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          ...answerData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save answer')
      }
    } catch (error) {
      console.error('Failed to save answer:', error)
      toast({
        title: 'Warning',
        description: 'Failed to save answer. Please try again.',
        variant: 'destructive',
      })
    }
  }, [attempt, test.id, toast])

  const handleAnswerChange = (questionId: string, answerData: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerData,
    }))

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswer(questionId, answerData)
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!attempt) return

    // Confirm submission
    const confirmed = window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')
    if (!confirmed) return

    setSubmitting(true)

    try {
      // Save all pending answers immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      const response = await fetch(`/api/tests/${test.id}/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientFingerprint: await generateClientFingerprint({
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit test')
      }

      toast({
        title: 'Test Submitted',
        description: 'Your answers have been saved successfully',
      })

      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }

      router.push(`/teams/${test.teamId}?tab=tests`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit test',
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  if (!started) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{test.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.description && <p className="text-muted-foreground">{test.description}</p>}
            {test.instructions && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm whitespace-pre-wrap">{test.instructions}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: {test.durationMinutes} minutes</span>
            </div>
            {test.maxAttempts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Maximum attempts: {test.maxAttempts}</span>
              </div>
            )}
            {test.requireFullscreen && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Lock className="h-4 w-4" />
                <span>This test requires fullscreen mode</span>
              </div>
            )}
            {test.testPasswordHash && !isAdmin && (
              <div>
                <Label htmlFor="password">Test Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Enter password to start"
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
            )}
            <Button onClick={handleStartTest} disabled={loading} className="w-full">
              {loading ? 'Starting...' : 'Start Test'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{test.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span>Time: {test.durationMinutes} min</span>
              {tabSwitchCount > 0 && (
                <span className="text-amber-600">
                  Tab switches: {tabSwitchCount}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {test.questions.length === 0 ? (
              <p className="text-muted-foreground">No questions available.</p>
            ) : (
              test.questions.map((question: any, index: number) => (
                <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Question {index + 1}</span>
                    <span className="text-sm text-muted-foreground">
                      ({question.points} points)
                    </span>
                  </div>
                  <p className="text-lg whitespace-pre-wrap">{question.promptMd}</p>
                  
                  {question.type === 'MCQ_SINGLE' && (
                    <div className="space-y-2">
                      {question.options.map((option: any) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 p-3 rounded border cursor-pointer hover:bg-muted"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={answers[question.id]?.selectedOptionIds?.[0] === option.id}
                            onChange={() => handleAnswerChange(question.id, {
                              selectedOptionIds: [option.id],
                            })}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'MCQ_MULTI' && (
                    <div className="space-y-2">
                      {question.options.map((option: any) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 p-3 rounded border cursor-pointer hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={answers[question.id]?.selectedOptionIds?.includes(option.id) || false}
                            onChange={(e) => {
                              const current = answers[question.id]?.selectedOptionIds || []
                              const newSelected = e.target.checked
                                ? [...current, option.id]
                                : current.filter((id: string) => id !== option.id)
                              handleAnswerChange(question.id, {
                                selectedOptionIds: newSelected,
                              })
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'NUMERIC' && (
                    <Input
                      type="number"
                      step="any"
                      placeholder="Enter numeric answer"
                      value={answers[question.id]?.numericAnswer ?? ''}
                      onChange={(e) => handleAnswerChange(question.id, {
                        numericAnswer: e.target.value ? parseFloat(e.target.value) : null,
                      })}
                    />
                  )}

                  {question.type === 'SHORT_TEXT' && (
                    <Input
                      type="text"
                      placeholder="Enter your answer"
                      value={answers[question.id]?.answerText ?? ''}
                      onChange={(e) => handleAnswerChange(question.id, {
                        answerText: e.target.value,
                      })}
                    />
                  )}

                  {question.type === 'LONG_TEXT' && (
                    <Textarea
                      className="min-h-[150px]"
                      placeholder="Enter your answer"
                      value={answers[question.id]?.answerText ?? ''}
                      onChange={(e) => handleAnswerChange(question.id, {
                        answerText: e.target.value,
                      })}
                    />
                  )}
                </div>
              ))
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const confirmed = window.confirm('Are you sure you want to cancel? Your progress will be saved.')
                  if (confirmed) {
                    router.push(`/teams/${test.teamId}?tab=tests`)
                  }
                }}
                disabled={submitting}
              >
                Save & Exit
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
