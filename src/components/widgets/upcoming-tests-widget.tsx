'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface UpcomingTestsWidgetProps {
  tests: any[]
  teamId: string
  config?: any
}

export function UpcomingTestsWidget({ 
  tests, 
  teamId,
  config 
}: UpcomingTestsWidgetProps) {
  const limit = config?.limit || 5
  
  // Filter to published tests with upcoming start dates
  const now = new Date()
  const upcomingTests = tests
    .filter(test => test.status === 'PUBLISHED' && test.startAt && new Date(test.startAt) >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {config?.title || 'Upcoming Tests'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingTests.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No upcoming tests
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingTests.map((test) => {
              const startDate = new Date(test.startAt)
              const endDate = test.endAt ? new Date(test.endAt) : null
              const isStartingSoon = startDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000

              return (
                <Link
                  key={test.id}
                  href={`/club/${teamId}?tab=tests`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                        {test.name}
                        {isStartingSoon && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </h4>
                      <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Starts: {format(startDate, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {endDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Ends: {format(endDate, 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                        <span>{test.durationMinutes} minutes</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {test.status}
                        </Badge>
                        {isStartingSoon && (
                          <Badge variant="destructive" className="text-xs">
                            Starting Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

