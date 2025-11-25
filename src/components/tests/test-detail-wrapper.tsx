'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TestAttemptsView } from './test-attempts-view'
import { Clock, Users, FileText, Lock, AlertCircle, Key, Shuffle } from 'lucide-react'

interface TestDetailWrapperProps {
  testId: string
  testName: string
  test: {
    id: string
    name: string
    description: string | null
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    durationMinutes: number
    startAt: string | null
    endAt: string | null
    allowLateUntil: string | null
    maxAttempts: number | null
    instructions: string | null
    randomizeQuestionOrder: boolean
    randomizeOptionOrder: boolean
    requireFullscreen: boolean
    releaseScoresAt: string | null
    testPasswordPlaintext: string | null
  }
  assignmentSummary: string
  overviewContent: React.ReactNode
  instructionsContent: React.ReactNode
  deliverySettingsContent: React.ReactNode
  assignmentContent: React.ReactNode
}

export function TestDetailWrapper({
  testId,
  testName,
  test,
  overviewContent,
  instructionsContent,
  deliverySettingsContent,
  assignmentContent,
}: TestDetailWrapperProps) {
  const [activeView, setActiveView] = useState<'test' | 'attempts'>('test')

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border pb-4">
        <Button
          variant={activeView === 'test' ? 'default' : 'outline'}
          onClick={() => setActiveView('test')}
        >
          Test Overview
        </Button>
        <Button
          variant={activeView === 'attempts' ? 'default' : 'outline'}
          onClick={() => setActiveView('attempts')}
        >
          Attempts
        </Button>
      </div>

      {activeView === 'test' ? (
        <div className="space-y-6">
          {overviewContent}
          {instructionsContent}
          {deliverySettingsContent}
          {assignmentContent}
        </div>
      ) : (
        <TestAttemptsView testId={testId} testName={testName} />
      )}
    </div>
  )
}

