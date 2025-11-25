'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Star } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface RecentAnnouncementsWidgetProps {
  announcements: any[]
  teamId: string
  config?: any
}

export function RecentAnnouncementsWidget({ 
  announcements, 
  teamId,
  config 
}: RecentAnnouncementsWidgetProps) {
  const limit = config?.limit || 5
  const showImportantOnly = config?.showImportantOnly || false
  
  const filteredAnnouncements = showImportantOnly
    ? announcements.filter(a => a.important)
    : announcements
  
  const displayAnnouncements = filteredAnnouncements.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {config?.title || 'Recent Announcements'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No announcements yet
          </p>
        ) : (
          <div className="space-y-3">
            {displayAnnouncements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/club/${teamId}?tab=stream`}
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={announcement.author?.user?.image || ''} />
                    <AvatarFallback>
                      {announcement.author?.user?.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        {announcement.important && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {announcement.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDateTime(announcement.createdAt)}
                    </p>
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

