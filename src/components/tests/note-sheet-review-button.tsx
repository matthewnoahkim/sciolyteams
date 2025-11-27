'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NoteSheetReview } from './note-sheet-review'
import { FileEdit } from 'lucide-react'

interface NoteSheetReviewButtonProps {
  testId: string
  testName: string
}

export function NoteSheetReviewButton({ testId, testName }: NoteSheetReviewButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileEdit className="h-4 w-4 mr-2" />
        Review Note Sheets
      </Button>
      <NoteSheetReview
        open={open}
        onOpenChange={setOpen}
        testId={testId}
        testName={testName}
      />
    </>
  )
}

