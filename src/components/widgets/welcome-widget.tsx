'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Sparkles } from 'lucide-react'

interface WelcomeWidgetProps {
  teamName: string
  memberCount: number
  config?: any
}

export function WelcomeWidget({ teamName, memberCount, config }: WelcomeWidgetProps) {
  const customMessage = config?.message || `Welcome to ${teamName}!`
  const showMemberCount = config?.showMemberCount !== false

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border-blue-200/50 dark:border-blue-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {config?.title || 'Welcome'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-3">{customMessage}</p>
        {showMemberCount && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

