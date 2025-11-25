'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, MessageSquare, FileText, TrendingUp } from 'lucide-react'

interface TeamStatsWidgetProps {
  stats: {
    memberCount: number
    announcementCount: number
    eventCount: number
    testCount: number
  }
  config?: any
}

export function TeamStatsWidget({ stats, config }: TeamStatsWidgetProps) {
  const showStats = config?.showStats || ['members', 'announcements', 'events', 'tests']

  const statItems = [
    {
      key: 'members',
      label: 'Members',
      value: stats.memberCount,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      key: 'announcements',
      label: 'Announcements',
      value: stats.announcementCount,
      icon: MessageSquare,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      key: 'events',
      label: 'Events',
      value: stats.eventCount,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      key: 'tests',
      label: 'Tests',
      value: stats.testCount,
      icon: FileText,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ].filter(item => showStats.includes(item.key))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {config?.title || 'Team Stats'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.key}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

