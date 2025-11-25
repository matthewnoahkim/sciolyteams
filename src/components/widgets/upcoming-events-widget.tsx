'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface UpcomingEventsWidgetProps {
  events: any[]
  teamId: string
  config?: any
}

export function UpcomingEventsWidget({ 
  events, 
  teamId,
  config 
}: UpcomingEventsWidgetProps) {
  const limit = config?.limit || 5
  const daysAhead = config?.daysAhead || 30
  
  // Filter to upcoming events within the next X days
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.startUTC)
      return eventDate >= now && eventDate <= futureDate
    })
    .sort((a, b) => new Date(a.startUTC).getTime() - new Date(b.startUTC).getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {config?.title || 'Upcoming Events'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No upcoming events
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/club/${teamId}?tab=calendar`}
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {format(new Date(event.startUTC), 'MMM')}
                    </span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {format(new Date(event.startUTC), 'd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">
                      {event.title}
                    </h4>
                    <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(event.startUTC), 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.scope && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {event.scope}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

