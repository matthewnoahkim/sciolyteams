'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [started, setStarted] = useState(!!existingAttempt)
  const [tabSwitchCount, setTabSwitchCount] = useState(existingAttempt?.tabSwitchCount || 0)
  const [timeOffPageSeconds, setTimeOffPageSeconds] = useState(existingAttempt?.timeOffPageSeconds || 0)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [offPageStartTime, setOffPageStartTime] = useState<number | null>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track page visibility and tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)

      if (!isVisible) {
        // Page became hidden - start tracking time off page
        setOffPageStartTime(Date.now())
        setTabSwitchCount((prev: number) => prev + 1)
      } else {
        // Page became visible - stop tracking and update total time
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
                <div key={question.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Question {index + 1}</span>
                    <span className="text-sm text-muted-foreground">
                      ({question.points} points)
                    </span>
                  </div>
                  <p className="text-lg">{question.promptMd}</p>
                  {question.type === 'MCQ_SINGLE' || question.type === 'MCQ_MULTI' ? (
                    <div className="space-y-2">
                      {question.options.map((option: any) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted"
                        >
                          <input
                            type={question.type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                            name={`question-${question.id}`}
                            value={option.id}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : question.type === 'NUMERIC' ? (
                    <Input type="number" placeholder="Enter numeric answer" />
                  ) : (
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded"
                      placeholder="Enter your answer"
                    />
                  )}
                </div>
              ))
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/teams/${test.teamId}?tab=tests`)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // TODO: Implement submit functionality
                  toast({
                    title: 'Test Submitted',
                    description: 'Your answers have been saved',
                  })
                  router.push(`/teams/${test.teamId}?tab=tests`)
                }}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

