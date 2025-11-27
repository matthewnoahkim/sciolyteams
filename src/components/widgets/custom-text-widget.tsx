'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface CustomTextWidgetProps {
  config?: any
}

export function CustomTextWidget({ config }: CustomTextWidgetProps) {
  const content = config?.content || 'Add custom content here...'
  const showTitle = config?.showTitle !== false

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            {config?.title || 'Custom Widget'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? '' : 'pt-6'}>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  )
}
