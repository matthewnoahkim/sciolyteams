'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, ExternalLink } from 'lucide-react'

interface ImportantLinksWidgetProps {
  config?: any
}

interface LinkItem {
  title: string
  url: string
  description?: string
}

export function ImportantLinksWidget({ config }: ImportantLinksWidgetProps) {
  const links: LinkItem[] = config?.links || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          {config?.title || 'Important Links'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No links configured
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">
                      {link.title}
                    </h4>
                    {link.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

