'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText,
  Zap 
} from 'lucide-react'
import Link from 'next/link'

interface QuickActionsWidgetProps {
  teamId: string
  isAdmin: boolean
  config?: any
}

export function QuickActionsWidget({ teamId, isAdmin, config }: QuickActionsWidgetProps) {
  const showActions = config?.showActions || ['stream', 'calendar', 'people', 'tests']

  const allActions = [
    {
      key: 'stream',
      label: 'View Stream',
      icon: MessageSquare,
      href: `/club/${teamId}?tab=stream`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      key: 'calendar',
      label: 'View Calendar',
      icon: Calendar,
      href: `/club/${teamId}?tab=calendar`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      key: 'people',
      label: 'View Team',
      icon: Users,
      href: `/club/${teamId}?tab=people`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      key: 'tests',
      label: 'View Tests',
      icon: FileText,
      href: `/club/${teamId}?tab=tests`,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      key: 'finance',
      label: 'View Finance',
      icon: DollarSign,
      href: `/club/${teamId}?tab=finance`,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      adminOnly: true,
    },
  ]

  const actions = allActions.filter(action => 
    showActions.includes(action.key) && (!action.adminOnly || isAdmin)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {config?.title || 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.key} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center gap-2 p-4 hover:scale-105 transition-transform"
                >
                  <div className={`${action.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

