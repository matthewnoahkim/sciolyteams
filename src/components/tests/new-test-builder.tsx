'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  Play,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  Send,
  ArrowUp,
  ArrowDown,
  GripVertical,
  LayoutGrid,
  LayoutList,
} from 'lucide-react'
import { DuplicateTestButton } from '@/components/tests/duplicate-test-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuestionPrompt } from '@/components/tests/question-prompt'

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'LONG_TEXT'

interface SubteamInfo {
  id: string
  name: string
}

interface OptionDraft {
  id: string
  label: string
  isCorrect: boolean
}

interface QuestionDraft {
  id: string
  type: QuestionType
  prompt: string
  context: string
  explanation: string
  points: number
  options: OptionDraft[]
  shuffleOptions: boolean
}

interface NewTestBuilderProps {
  teamId: string
  teamName: string
  teamDivision?: 'B' | 'C'
  subteams: SubteamInfo[]
  test?: {
    id: string
    name: string
    description: string | null
    instructions: string | null
    durationMinutes: number
    maxAttempts: number | null
    scoreReleaseMode: 'NONE' | 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST'
    randomizeQuestionOrder: boolean
    randomizeOptionOrder: boolean
    requireFullscreen: boolean
    allowCalculator: boolean
    calculatorType: 'FOUR_FUNCTION' | 'SCIENTIFIC' | 'GRAPHING' | null
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    assignments: Array<{
      assignedScope: 'CLUB' | 'TEAM' | 'PERSONAL'
      subteamId: string | null
      subteam: { id: string; name: string } | null
    }>
    questions: Array<{
      id: string
      type: string
      promptMd: string
      explanation: string | null
      points: number
      shuffleOptions: boolean
      options: Array<{
        id: string
        label: string
        isCorrect: boolean
        order: number
      }>
    }>
  }
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

// Parse promptMd to extract context and prompt
function parsePromptMd(promptMd: string): { context: string; prompt: string } {
  const parts = promptMd.split('---')
  if (parts.length === 2) {
    return { context: parts[0].trim(), prompt: parts[1].trim() }
  }
  return { context: '', prompt: promptMd.trim() }
}

// Extract images from markdown content
function extractImages(content: string): Array<{ alt: string; src: string }> {
  const imageRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g
  const images: Array<{ alt: string; src: string }> = []
  let match
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({ alt: match[1] || 'Image', src: match[2] })
  }
  return images
}

// Remove image markdown from content for textarea display
function removeImageMarkdown(content: string): string {
  return content.replace(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/g, '').trim()
}

// Reconstruct markdown with images
function reconstructMarkdown(text: string, images: Array<{ alt: string; src: string }>): string {
  const textPart = text.trim()
  const imageParts = images.map(img => `![${img.alt}](${img.src})`).join('\n\n')
  if (textPart && imageParts) {
    return `${textPart}\n\n${imageParts}`
  }
  return textPart || imageParts
}

export function NewTestBuilder({ teamId, teamName, teamDivision, subteams, test }: NewTestBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(false)
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [publishFormData, setPublishFormData] = useState({
    startAt: '',
    endAt: '',
    testPassword: '',
    testPasswordConfirm: '',
    releaseScoresAt: '',
    maxAttempts: test?.maxAttempts?.toString() || '',
    scoreReleaseMode: (test?.scoreReleaseMode || 'FULL_TEST') as 'NONE' | 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST',
    requireFullscreen: test?.requireFullscreen ?? true,
  })

  const isEditMode = !!test

  const [assignmentMode, setAssignmentMode] = useState<'CLUB' | 'TEAM' | 'EVENT'>(() => {
    if (test) {
      const hasTeamAssignments = test.assignments.some(a => a.assignedScope === 'TEAM')
      return hasTeamAssignments ? 'TEAM' : 'CLUB'
    }
    return 'CLUB'
  })
  
  const [selectedSubteams, setSelectedSubteams] = useState<string[]>(() => {
    if (test) {
      return test.assignments
        .filter(a => a.assignedScope === 'TEAM' && a.subteamId)
        .map(a => a.subteamId!)
    }
    return []
  })

  const [selectedEventId, setSelectedEventId] = useState<string>('')

  const [details, setDetails] = useState({
    name: test?.name || '',
    description: test?.description || '',
    instructions: test?.instructions || '',
    durationMinutes: test?.durationMinutes || 60,
    randomizeQuestionOrder: test?.randomizeQuestionOrder || false,
    randomizeOptionOrder: test?.randomizeOptionOrder || false,
    allowCalculator: test?.allowCalculator || false,
    calculatorType: test?.calculatorType || null,
  })

  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    if (test?.questions) {
      return test.questions.map((q) => {
        const { context, prompt } = parsePromptMd(q.promptMd)
        const type = (q.type === 'MCQ_SINGLE' || q.type === 'MCQ_MULTI' || q.type === 'LONG_TEXT') 
          ? q.type as QuestionType
          : 'MCQ_SINGLE'
        
        return {
          id: q.id,
          type,
          prompt,
          context,
          explanation: q.explanation || '',
          points: Number(q.points),
          options: q.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
          shuffleOptions: q.shuffleOptions,
        }
      })
    }
    return []
  })

  const addQuestion = (type: QuestionType) => {
    const baseOptions: OptionDraft[] =
      type === 'LONG_TEXT'
        ? []
        : [
            { id: nanoid(), label: '', isCorrect: false },
            { id: nanoid(), label: '', isCorrect: false },
            { id: nanoid(), label: '', isCorrect: false },
            { id: nanoid(), label: '', isCorrect: false },
          ]

    const newQuestion: QuestionDraft = {
      id: nanoid(),
      type,
      prompt: '',
      context: '',
      explanation: '',
      points: 1,
      options: baseOptions,
      shuffleOptions: true,
    }

    setQuestions((prev) => [...prev, newQuestion])
  }

  const addRecommendedOptions = (questionId: string) => {
    updateQuestion(questionId, (prev) => {
      if (prev.options.length >= 4) return prev
      const needed = 4 - prev.options.length
      const newOptions = Array.from({ length: needed }, () => ({
        id: nanoid(),
        label: '',
        isCorrect: false,
      }))
      return {
        ...prev,
        options: [...prev.options, ...newOptions],
      }
    })
  }

  const updateQuestion = (id: string, updater: (question: QuestionDraft) => QuestionDraft) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === id ? updater(question) : question))
    )
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id))
  }

  const moveQuestion = (id: string, direction: -1 | 1) => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id)
      if (index === -1) return prev
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const newQuestions = [...prev]
      const [question] = newQuestions.splice(index, 1)
      newQuestions.splice(newIndex, 0, question)
      return newQuestions
    })
  }

  const handleImageEmbed = (questionId: string, field: 'context' | 'prompt', file: File, cursorPosition: number | null = null) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: 'Image too large',
        description: 'Please choose an image under 2MB.',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateQuestion(questionId, (question) => {
        const existing = question[field]
        const imageMarkdown = `![${file.name}](${dataUrl})`
        
        // Get existing images BEFORE we modify anything
        const existingImages = extractImages(existing)
        const textWithoutImages = removeImageMarkdown(existing)
        
        // Always append new images to the bottom of the stack (end of the list)
        const allImages = [...existingImages, { alt: file.name, src: dataUrl }]
        const reconstructed = reconstructMarkdown(textWithoutImages, allImages)
        return {
          ...question,
          [field]: reconstructed,
        }
      })
      toast({
        title: 'Image embedded',
        description: 'The image was added to the bottom of the stack.',
      })
    }
    reader.readAsDataURL(file)
  }

  const toggleSubteam = (subteamId: string) => {
    setSelectedSubteams((prev) =>
      prev.includes(subteamId)
        ? prev.filter((id) => id !== subteamId)
        : [...prev, subteamId]
    )
  }

  // Fetch events when publish dialog opens
  useEffect(() => {
    if (publishDialogOpen && teamDivision && events.length === 0 && !loadingEvents) {
      setLoadingEvents(true)
      fetch(`/api/events?division=${teamDivision}`)
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setEvents(data.events)
          }
        })
        .catch(error => {
          console.error('Failed to fetch events:', error)
          toast({
            title: 'Failed to load events',
            description: 'Could not load Science Olympiad events',
            variant: 'destructive',
          })
        })
        .finally(() => setLoadingEvents(false))
    }
  }, [publishDialogOpen, teamDivision, events.length, loadingEvents, toast])

  // Draft validation - basic requirements for saving (no assignment validation)
  const draftValidation = useMemo(() => {
    const errors: string[] = []

    if (!details.name.trim()) {
      errors.push('Test name is required.')
    }

    if (!details.durationMinutes || details.durationMinutes < 1 || details.durationMinutes > 720) {
      errors.push('Duration must be between 1 and 720 minutes.')
    }

    if (questions.length === 0) {
      errors.push('Add at least one question before saving.')
    }

    questions.forEach((question, index) => {
      const prompt = question.prompt.trim()
      if (!prompt) {
        errors.push(`Question ${index + 1} needs a prompt.`)
      }

      if (question.points < 0.5) {
        errors.push(`Question ${index + 1} must be worth at least 0.5 points.`)
      }

      if (question.type !== 'LONG_TEXT') {
        // Filter out empty options for validation
        const filledOptions = question.options.filter((option) => option.label.trim())
        
        if (filledOptions.length < 1) {
          errors.push(`Question ${index + 1} needs at least one filled answer choice.`)
        }

        const correctCount = filledOptions.filter((option) => option.isCorrect).length
        if (correctCount === 0) {
          errors.push(`Question ${index + 1} needs at least one correct answer.`)
        }
        if (question.type === 'MCQ_SINGLE' && correctCount !== 1) {
          errors.push(`Question ${index + 1} must have exactly one correct answer.`)
        }
      }
    })

    return {
      errors,
    }
  }, [details, questions])

  // Publish validation - includes assignment requirements
  const publishValidation = useMemo(() => {
    const errors: string[] = [...draftValidation.errors]

    if (assignmentMode === 'TEAM' && selectedSubteams.length === 0) {
      errors.push('Select at least one team or assign to the entire club.')
    }

    if (assignmentMode === 'EVENT' && !selectedEventId) {
      errors.push('Select an event or choose a different assignment option.')
    }

    return {
      errors,
    }
  }, [draftValidation.errors, assignmentMode, selectedSubteams, selectedEventId])

  // Use publish validation for backward compatibility with existing code that references validationSummary
  const validationSummary = publishValidation

  const composePrompt = (question: QuestionDraft) => {
    const context = question.context.trim()
    const prompt = question.prompt.trim()
    if (context && prompt) {
      return `${context}\n\n---\n\n${prompt}`
    }
    if (context) return context
    return prompt
  }

  const handleSave = async (andPublish: boolean = false) => {
    // Use draft validation when just saving, publish validation when publishing
    const validation = andPublish ? publishValidation : draftValidation
    
    if (validation.errors.length > 0) {
      toast({
        title: 'Please fix the highlighted issues',
        description: validation.errors.join('\n'),
        variant: 'destructive',
      })
      return
    }

    const assignments =
      assignmentMode === 'CLUB'
        ? [{ assignedScope: 'CLUB' as const }]
        : selectedSubteams.map((subteamId) => ({
            assignedScope: 'TEAM' as const,
            subteamId,
          }))

    const payload = {
      teamId,
      name: details.name.trim(),
      description: details.description.trim() || undefined,
      instructions: details.instructions.trim() || undefined,
      durationMinutes: details.durationMinutes,
      randomizeQuestionOrder: details.randomizeQuestionOrder,
      randomizeOptionOrder: details.randomizeOptionOrder,
      allowCalculator: details.allowCalculator,
      calculatorType: details.allowCalculator ? details.calculatorType : null,
      assignments,
      questions: questions.map((question, index) => ({
        type: question.type,
        promptMd: composePrompt(question),
        explanation: question.explanation.trim() || undefined,
        points: question.points,
        order: index,
        shuffleOptions: question.type === 'LONG_TEXT' ? false : question.shuffleOptions,
        options:
          question.type === 'LONG_TEXT'
            ? undefined
            : question.options
                .filter((option) => option.label.trim()) // Filter out empty options
                .map((option, optIndex) => ({
                  label: option.label.trim(),
                  isCorrect: option.isCorrect,
                  order: optIndex,
                })),
      })),
    }

    setSaving(true)
    try {
      if (isEditMode && test) {
        // Update existing test
        const response = await fetch(`/api/tests/${test.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            instructions: payload.instructions,
            durationMinutes: payload.durationMinutes,
            randomizeQuestionOrder: payload.randomizeQuestionOrder,
            randomizeOptionOrder: payload.randomizeOptionOrder,
            allowCalculator: payload.allowCalculator,
            calculatorType: payload.calculatorType,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update test')
        }

        // Update assignments
        await fetch(`/api/tests/${test.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments }),
        })

        // Get existing question IDs
        const existingQuestionIds = new Set(test.questions.map(q => q.id))
        const currentQuestionIds = new Set(questions.map(q => q.id))
        
        // Delete questions that were removed
        const questionsToDelete = test.questions.filter(q => !currentQuestionIds.has(q.id))
        for (const q of questionsToDelete) {
          await fetch(`/api/tests/${test.id}/questions/${q.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Update or create questions
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i]
          const questionPayload = {
            type: question.type,
            promptMd: composePrompt(question),
            explanation: question.explanation.trim() || undefined,
            points: question.points,
            order: i,
            shuffleOptions: question.type === 'LONG_TEXT' ? false : question.shuffleOptions,
            options:
              question.type === 'LONG_TEXT'
                ? undefined
                : question.options
                    .filter((option) => option.label.trim())
                    .map((option, optIndex) => ({
                      label: option.label.trim(),
                      isCorrect: option.isCorrect,
                      order: optIndex,
                    })),
          }

          // Check if this question existed in the original test
          const questionExistedBefore = existingQuestionIds.has(question.id)
          
          if (!questionExistedBefore) {
            // Create new question
            await fetch(`/api/tests/${test.id}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(questionPayload),
            })
          } else {
            // Update existing question
            await fetch(`/api/tests/${test.id}/questions/${question.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(questionPayload),
            })
          }
        }

        if (andPublish && test.status === 'DRAFT') {
          // Open the publish dialog
          setPublishDialogOpen(true)
        } else {
          toast({
            title: 'Test Updated',
            description: 'Your changes have been saved',
          })
          router.push(`/club/${teamId}?tab=tests`)
          router.refresh()
        }
      } else {
        // Create new test
        const response = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create test')
        }

        const data = await response.json()
        const testId = data.test?.id

        if (!testId) {
          throw new Error('Test ID not found in response')
        }

        if (andPublish) {
          // Open the publish dialog
          setPublishDialogOpen(true)
          // Store the testId for publishing
          sessionStorage.setItem('newTestId', testId)
        } else {
          toast({
            title: 'Test saved',
            description: 'Your test draft has been created successfully.',
          })
          router.push(`/club/${teamId}?tab=tests`)
          router.refresh()
        }
      }
    } catch (error: any) {
      toast({
        title: isEditMode ? 'Failed to update test' : 'Failed to save test',
        description: error.message || 'Something went wrong while saving the test.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublishTest = async () => {
    const testId = isEditMode && test ? test.id : sessionStorage.getItem('newTestId')
    
    if (!testId) {
      toast({
        title: 'Error',
        description: 'Test ID not found. Please save the test first.',
        variant: 'destructive',
      })
      return
    }

    if (!publishFormData.startAt || !publishFormData.endAt) {
      toast({
        title: 'Error',
        description: 'Start and end times are required',
        variant: 'destructive',
      })
      return
    }

    const start = new Date(publishFormData.startAt)
    const end = new Date(publishFormData.endAt)
    if (end <= start) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      })
      return
    }

    if (publishFormData.testPassword) {
      if (publishFormData.testPassword.length < 6) {
        toast({
          title: 'Error',
          description: 'Test password must be at least 6 characters',
          variant: 'destructive',
        })
        return
      }

      if (!publishFormData.testPasswordConfirm) {
        toast({
          title: 'Error',
          description: 'Please confirm the password',
          variant: 'destructive',
        })
        return
      }

      if (publishFormData.testPassword !== publishFormData.testPasswordConfirm) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        })
        return
      }
    }

    setPublishing(true)
    try {
      const startAtISO = publishFormData.startAt ? new Date(publishFormData.startAt).toISOString() : undefined
      const endAtISO = publishFormData.endAt ? new Date(publishFormData.endAt).toISOString() : undefined
      const releaseScoresAtISO = publishFormData.releaseScoresAt && publishFormData.releaseScoresAt.trim() 
        ? new Date(publishFormData.releaseScoresAt).toISOString() 
        : undefined

      const response = await fetch(`/api/tests/${testId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: startAtISO,
          endAt: endAtISO,
          testPassword: publishFormData.testPassword || undefined,
          releaseScoresAt: releaseScoresAtISO,
          durationMinutes: details.durationMinutes,
          maxAttempts: publishFormData.maxAttempts ? parseInt(publishFormData.maxAttempts, 10) : null,
          scoreReleaseMode: publishFormData.scoreReleaseMode,
          requireFullscreen: publishFormData.requireFullscreen,
          assignmentMode,
          selectedSubteams: assignmentMode === 'TEAM' ? selectedSubteams : undefined,
          selectedEventId: assignmentMode === 'EVENT' ? selectedEventId : undefined,
          addToCalendar: addToCalendar,
        }),
      })

      let data: any = null
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error(`Server error (${response.status}): Unable to parse response. Please check server logs.`)
      }

      if (!response.ok) {
        const errorMsg = data.message 
          ? `${data.error}: ${data.message}` 
          : data.error || data.details || 'Failed to publish test'
        throw new Error(errorMsg)
      }

      toast({
        title: 'Test Published',
        description: addToCalendar 
          ? 'The test is now visible to assigned members and has been added to the calendar'
          : 'The test is now visible to assigned members',
      })

      if (!isEditMode) {
        sessionStorage.removeItem('newTestId')
      }
      setPublishDialogOpen(false)
      setAddToCalendar(false)
      router.push(`/club/${teamId}?tab=tests`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish test',
        variant: 'destructive',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Team • {teamName}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEditMode ? 'Edit Test' : 'Create a Test'}
          </h1>
          <p className="text-muted-foreground">
            Build your assessment just like a Google Form. Configure timing, assignments, and
            lockdown before sharing with students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/club/${teamId}?tab=tests`)}
            disabled={saving}
          >
            Cancel
          </Button>
          {isEditMode && test && (
            <DuplicateTestButton
              testId={test.id}
              testName={test.name}
              teamId={teamId}
            />
          )}
          <Button onClick={() => handleSave(false)} disabled={saving || draftValidation.errors.length > 0} variant="outline">
            {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save as Draft'}
          </Button>
          <Button 
            onClick={() => handleSave(true)} 
            disabled={saving || publishValidation.errors.length > 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Test Overview</CardTitle>
              <CardDescription>
                Add the essential information your students will see before they begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-name">Test title *</Label>
                <Input
                  id="test-name"
                  value={details.name}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Forensic Science Practice Test"
                  required
                />
              </div>
              <div>
                <Label htmlFor="test-description">Short description</Label>
                <Input
                  id="test-description"
                  value={details.description}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Share a one-line summary for admins and competitors."
                />
              </div>
              <div>
                <Label htmlFor="test-instructions">Instructions (Markdown supported)</Label>
                <textarea
                  id="test-instructions"
                  className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={details.instructions}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, instructions: event.target.value }))
                  }
                  placeholder="Let students know what resources are allowed, how to submit work, and any other expectations."
                />
              </div>
              <div>
                <Label htmlFor="test-duration">Duration (minutes) *</Label>
                <Input
                  id="test-duration"
                  type="number"
                  min="1"
                  max="720"
                  value={details.durationMinutes}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      durationMinutes: parseInt(event.target.value, 10) || 60,
                    }))
                  }
                  placeholder="60"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Time allowed to complete the test (1-720 minutes)
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label className="text-base font-semibold">Calculator</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow students to use a calculator during the test
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allow-calculator"
                    checked={details.allowCalculator}
                    onCheckedChange={(checked) =>
                      setDetails((prev) => ({
                        ...prev,
                        allowCalculator: checked as boolean,
                        calculatorType: checked ? 'FOUR_FUNCTION' : null,
                      }))
                    }
                  />
                  <Label htmlFor="allow-calculator" className="cursor-pointer font-normal">
                    Allow calculator
                  </Label>
                </div>

                {details.allowCalculator && (
                  <div>
                    <Label htmlFor="calculator-type">Calculator Type</Label>
                    <select
                      id="calculator-type"
                      value={details.calculatorType || 'FOUR_FUNCTION'}
                      onChange={(e) =>
                        setDetails((prev) => ({
                          ...prev,
                          calculatorType: e.target.value as 'FOUR_FUNCTION' | 'SCIENTIFIC' | 'GRAPHING',
                        }))
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                    >
                      <option value="FOUR_FUNCTION">Four Function (Basic)</option>
                      <option value="SCIENTIFIC">Scientific Calculator</option>
                      <option value="GRAPHING">Graphing Calculator</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Students will have access to this calculator during the test
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="sticky top-0 z-10 bg-gradient-card-light/95 dark:bg-gradient-card-dark/95 backdrop-blur-sm supports-[backdrop-filter]:bg-gradient-card-light/80 dark:supports-[backdrop-filter]:bg-gradient-card-dark/80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Add prompts, images, and answer options.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion('LONG_TEXT')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Free Response
                </Button>
                <Button size="sm" variant="outline" onClick={() => addQuestion('MCQ_SINGLE')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Multiple Choice
                </Button>
                <Button size="sm" variant="outline" onClick={() => addQuestion('MCQ_MULTI')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Select All That Apply
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 && (
                <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
                  Start by adding a question type. You can include context blocks, embed images, and
                  mark correct answers for automatic grading.
                </div>
              )}
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              index={index}
              total={questions.length}
              question={question}
              onChange={(updater) => updateQuestion(question.id, updater)}
              onRemove={() => removeQuestion(question.id)}
              onMoveUp={() => moveQuestion(question.id, -1)}
              onMoveDown={() => moveQuestion(question.id, 1)}
              onImageUpload={(field, file, cursorPosition) => handleImageEmbed(question.id, field, file, cursorPosition)}
              onAddRecommendedOptions={() => addRecommendedOptions(question.id)}
            />
          ))}
            </CardContent>
          </Card>
        </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish Test</DialogTitle>
            <DialogDescription>
              Configure test schedule, security settings, and password. Students will need the password to take the test.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="startAt">Start Date/Time *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={publishFormData.startAt}
                onChange={(e) => setPublishFormData((prev) => ({ ...prev, startAt: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endAt">End Date/Time *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={publishFormData.endAt}
                onChange={(e) => setPublishFormData((prev) => ({ ...prev, endAt: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="testPassword">Test Password (optional)</Label>
              <Input
                id="testPassword"
                type="password"
                value={publishFormData.testPassword}
                onChange={(e) => setPublishFormData((prev) => ({ ...prev, testPassword: e.target.value }))}
                placeholder="Students need this to take the test"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If set, students will need to enter this password to start the test.
              </p>
            </div>

            {publishFormData.testPassword && (
              <div>
                <Label htmlFor="testPasswordConfirm">Confirm Password</Label>
                <Input
                  id="testPasswordConfirm"
                  type="password"
                  value={publishFormData.testPasswordConfirm}
                  onChange={(e) => setPublishFormData((prev) => ({ ...prev, testPasswordConfirm: e.target.value }))}
                  placeholder="Confirm password"
                />
              </div>
            )}

            <div>
              <Label htmlFor="maxAttempts">Max attempts per user (optional)</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                value={publishFormData.maxAttempts}
                onChange={(e) => setPublishFormData((prev) => ({ ...prev, maxAttempts: e.target.value }))}
                placeholder="Unlimited if not set"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for unlimited attempts
              </p>
            </div>

            <div>
              <Label htmlFor="scoreReleaseMode">Score release mode</Label>
              <Select
                value={publishFormData.scoreReleaseMode}
                onValueChange={(value) => setPublishFormData((prev) => ({ ...prev, scoreReleaseMode: value as 'NONE' | 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST' }))}
              >
                <SelectTrigger id="scoreReleaseMode">
                  <SelectValue placeholder="Select release mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TEST">Full test (answers, correctness, feedback)</SelectItem>
                  <SelectItem value="SCORE_WITH_WRONG">Score + wrong questions</SelectItem>
                  <SelectItem value="SCORE_ONLY">Score only</SelectItem>
                  <SelectItem value="NONE">No scores released</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Controls what students see after submission
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="require-fullscreen"
                  checked={publishFormData.requireFullscreen}
                  onCheckedChange={(checked) => setPublishFormData((prev) => ({ ...prev, requireFullscreen: checked as boolean }))}
                />
                <Label htmlFor="require-fullscreen" className="cursor-pointer text-sm font-medium">
                  Require fullscreen lockdown
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Lockdown is best-effort. Students will be prompted to stay in fullscreen mode.
              </p>
            </div>

            <div>
              <Label htmlFor="releaseScoresAt">Release Scores (optional)</Label>
              <Input
                id="releaseScoresAt"
                type="datetime-local"
                value={publishFormData.releaseScoresAt}
                onChange={(e) => setPublishFormData((prev) => ({ ...prev, releaseScoresAt: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                When to automatically release scores to students. Leave empty for manual release.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label className="text-base font-semibold">Assignments</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose who should receive the test. Admins can always preview drafts.
                </p>
              </div>

              <RadioGroup value={assignmentMode} onValueChange={(value) => setAssignmentMode(value as 'CLUB' | 'TEAM' | 'EVENT')}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CLUB" id="assign-club" />
                  <Label htmlFor="assign-club" className="cursor-pointer font-normal">
                    Entire club
                  </Label>
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="TEAM" id="assign-teams" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="assign-teams" className="cursor-pointer font-normal">
                      Specific teams
                    </Label>
                  {assignmentMode === 'TEAM' && (
                    <div className="mt-2 space-y-2 rounded-md border border-input bg-muted/30 p-3 max-h-32 overflow-y-auto">
                      {subteams.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No teams yet—everyone will receive this test.
                        </p>
                      )}
                      {subteams.map((subteam) => (
                        <div
                          key={subteam.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm transition',
                            selectedSubteams.includes(subteam.id)
                              ? 'bg-primary/10 border-primary/40'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Checkbox
                            id={`subteam-${subteam.id}`}
                            checked={selectedSubteams.includes(subteam.id)}
                            onCheckedChange={() => toggleSubteam(subteam.id)}
                          />
                          <Label htmlFor={`subteam-${subteam.id}`} className="cursor-pointer font-normal flex-1">
                            {subteam.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="EVENT" id="assign-event" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="assign-event" className="cursor-pointer font-normal">
                      Users assigned to a specific event
                    </Label>
                  {assignmentMode === 'EVENT' && (
                    <div className="mt-2">
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={loadingEvents}
                      >
                        <option value="">
                          {loadingEvents ? 'Loading events...' : 'Select an event'}
                        </option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                      {!loadingEvents && events.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          No events found for your division.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Test will be assigned to all members with a roster assignment for this event.
                      </p>
                    </div>
                  )}
                </div>
                </div>
              </RadioGroup>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPublishDialogOpen(false)
                setCalendarModalOpen(true)
              }}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Calendar Modal */}
      <Dialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Test to Calendar?</DialogTitle>
            <DialogDescription>
              Would you like to add this test to the calendar for the people assigned to it?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              If you choose Yes, a calendar event will be created and shown to:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>All club members (if assigned to entire club)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Members of specific teams (if assigned to teams)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Users assigned to specific events (if assigned to events)</span>
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddToCalendar(false)
              setCalendarModalOpen(false)
              setConfirmPublishOpen(true)
            }} disabled={publishing}>
              No
            </Button>
            <Button
              onClick={() => {
                setAddToCalendar(true)
                setCalendarModalOpen(false)
                setConfirmPublishOpen(true)
              }}
              disabled={publishing}
            >
              Yes, Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmPublishOpen} onOpenChange={setConfirmPublishOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Publication</DialogTitle>
            <DialogDescription>
              Tests cannot be edited after they are published. You will only be able to update the test schedule and password.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to publish this test? Once published:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Questions and answers cannot be modified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Test settings (duration, attempts, lockdown) cannot be changed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>Assignments cannot be modified</span>
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConfirmPublishOpen(false)
              setAddToCalendar(false)
            }} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmPublishOpen(false)
                handlePublishTest()
              }}
              disabled={publishing}
              className="bg-primary"
            >
              {publishing ? 'Publishing...' : 'Yes, Publish Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface QuestionCardProps {
  question: QuestionDraft
  index: number
  total: number
  onChange: (updater: (question: QuestionDraft) => QuestionDraft) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onImageUpload: (field: 'context' | 'prompt', file: File, cursorPosition?: number | null) => void
  onAddRecommendedOptions: () => void
}

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onImageUpload,
  onAddRecommendedOptions,
}: QuestionCardProps) {
  const { toast } = useToast()
  const contextInputRef = useRef<HTMLInputElement>(null)
  const promptInputRef = useRef<HTMLInputElement>(null)
  const contextTextareaRef = useRef<HTMLTextAreaElement>(null)
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPositions, setCursorPositions] = useState<{ context: number | null; prompt: number | null }>({
    context: null,
    prompt: null,
  })
  const [imageLayout, setImageLayout] = useState<{ context: 'stacked' | 'side-by-side'; prompt: 'stacked' | 'side-by-side' }>({
    context: 'stacked',
    prompt: 'stacked',
  })

  const handleOptionUpdate = (optionId: string, updater: (option: OptionDraft) => OptionDraft) => {
    onChange((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? updater(option) : option
      ),
    }))
  }

  const addOption = () => {
    onChange((prev) => ({
      ...prev,
      options: [...prev.options, { id: nanoid(), label: '', isCorrect: false }],
    }))
  }

  const removeOption = (optionId: string) => {
    onChange((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option.id !== optionId),
    }))
  }

  const handleImageChange = (field: 'context' | 'prompt', fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    
    // Get cursor position from the appropriate textarea
    const textareaRef = field === 'context' ? contextTextareaRef : promptTextareaRef
    const cursorPos = textareaRef.current?.selectionStart ?? null
    
    // Store cursor position - we'll insert the image markdown at this position in the text
    // The image will be inserted into the text-only content, then we'll reconstruct
    setCursorPositions(prev => ({ ...prev, [field]: cursorPos }))
    
    // Pass the cursor position relative to text-only content
    // The parent will handle inserting at the right position
    onImageUpload(field, file, cursorPos)
  }

  const handleTextareaClick = (field: 'context' | 'prompt') => {
    const textareaRef = field === 'context' ? contextTextareaRef : promptTextareaRef
    // Update cursor position when user clicks in textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = textareaRef.current.selectionStart
        setCursorPositions(prev => ({ ...prev, [field]: pos }))
      }
    }, 0)
  }

  const handleTextareaKeyUp = (field: 'context' | 'prompt') => {
    const textareaRef = field === 'context' ? contextTextareaRef : promptTextareaRef
    // Update cursor position when user types or moves cursor
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart
      setCursorPositions(prev => ({ ...prev, [field]: pos }))
    }
  }


  const contextImages = extractImages(question.context)
  const promptImages = extractImages(question.prompt)
  const contextText = removeImageMarkdown(question.context)
  const promptText = removeImageMarkdown(question.prompt)

  const handleContextTextChange = (newText: string) => {
    const newImages = extractImages(question.context)
    const reconstructed = reconstructMarkdown(newText, newImages)
    onChange((prev) => ({ ...prev, context: reconstructed }))
  }

  const handlePromptTextChange = (newText: string) => {
    const newImages = extractImages(question.prompt)
    const reconstructed = reconstructMarkdown(newText, newImages)
    onChange((prev) => ({ ...prev, prompt: reconstructed }))
  }

  const removeImage = (field: 'context' | 'prompt', imageSrc: string) => {
    const currentContent = question[field]
    const images = extractImages(currentContent)
    const remainingImages = images.filter(img => img.src !== imageSrc)
    const text = removeImageMarkdown(currentContent)
    const reconstructed = reconstructMarkdown(text, remainingImages)
    onChange((prev) => ({ ...prev, [field]: reconstructed }))
  }

  const handleDragEnd = (field: 'context' | 'prompt', event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const currentContent = question[field]
    const images = extractImages(currentContent)
    const oldIndex = images.findIndex(img => img.src === active.id)
    const newIndex = images.findIndex(img => img.src === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    const newImages = arrayMove(images, oldIndex, newIndex)
    const text = removeImageMarkdown(currentContent)
    const reconstructed = reconstructMarkdown(text, newImages)
    onChange((prev) => ({ ...prev, [field]: reconstructed }))
  }

  const moveImage = (field: 'context' | 'prompt', imageSrc: string, direction: 'up' | 'down') => {
    const currentContent = question[field]
    const images = extractImages(currentContent)
    const imageIndex = images.findIndex(img => img.src === imageSrc)
    
    if (imageIndex === -1) return
    if (direction === 'up' && imageIndex === 0) return
    if (direction === 'down' && imageIndex === images.length - 1) return
    
    const newImages = [...images]
    const targetIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1
    ;[newImages[imageIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[imageIndex]]
    
    const text = removeImageMarkdown(currentContent)
    const reconstructed = reconstructMarkdown(text, newImages)
    onChange((prev) => ({ ...prev, [field]: reconstructed }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            Question {index + 1}{' '}
            <span className="font-normal text-muted-foreground/80">
              • {renderTypeLabel(question.type)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-6 p-4">
        <div>
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <Label htmlFor={`context-label-${index}`}>Context / stimulus (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                contextInputRef.current?.click()
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
            <input
              ref={contextInputRef}
              id={`context-input-${index}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files && event.target.files.length > 0) {
                  Array.from(event.target.files).forEach(file => {
                    // Create a DataTransfer object to simulate FileList
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    handleImageChange('context', dataTransfer.files)
                  })
                }
                event.target.value = ''
              }}
            />
          </div>
          {contextImages.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Images ({contextImages.length}) - Drag to reorder</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={imageLayout.context === 'stacked' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setImageLayout(prev => ({ ...prev, context: 'stacked' }))}
                    title="Stacked layout"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={imageLayout.context === 'side-by-side' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setImageLayout(prev => ({ ...prev, context: 'side-by-side' }))}
                    title="Side-by-side layout"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd('context', e)}
              >
                <SortableContext items={contextImages.map(img => img.src)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {contextImages.map((img, imgIndex) => (
                      <SortableImageItem
                        key={img.src}
                        id={img.src}
                        img={img}
                        index={imgIndex}
                        total={contextImages.length}
                        onRemove={() => removeImage('context', img.src)}
                        onMoveUp={() => moveImage('context', img.src, 'up')}
                        onMoveDown={() => moveImage('context', img.src, 'down')}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Editor</Label>
              <textarea
                ref={contextTextareaRef}
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={contextText}
                onChange={(event) => handleContextTextChange(event.target.value)}
                onClick={() => handleTextareaClick('context')}
                onKeyUp={() => handleTextareaKeyUp('context')}
                onSelect={() => handleTextareaKeyUp('context')}
                placeholder="Type your text here. Click where you want to insert an image, then click 'Add Image'."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Preview (how students will see it)</Label>
              <div className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm overflow-y-auto">
                {question.context ? (
                  <QuestionPrompt promptMd={question.context} className="text-sm" imageLayout={imageLayout.context} />
                ) : (
                  <p className="text-muted-foreground text-sm">Preview will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <Label htmlFor={`prompt-label-${index}`}>Prompt *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                promptInputRef.current?.click()
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
            <input
              ref={promptInputRef}
              id={`prompt-input-${index}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files && event.target.files.length > 0) {
                  Array.from(event.target.files).forEach(file => {
                    // Create a DataTransfer object to simulate FileList
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    handleImageChange('prompt', dataTransfer.files)
                  })
                }
                event.target.value = ''
              }}
            />
          </div>
          {promptImages.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Images ({promptImages.length})</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={imageLayout.prompt === 'stacked' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setImageLayout(prev => ({ ...prev, prompt: 'stacked' }))}
                    title="Stacked layout"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={imageLayout.prompt === 'side-by-side' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setImageLayout(prev => ({ ...prev, prompt: 'side-by-side' }))}
                    title="Side-by-side layout"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd('prompt', e)}
              >
                <SortableContext items={promptImages.map(img => img.src)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {promptImages.map((img, imgIndex) => (
                      <SortableImageItem
                        key={img.src}
                        id={img.src}
                        img={img}
                        index={imgIndex}
                        total={promptImages.length}
                        onRemove={() => removeImage('prompt', img.src)}
                        onMoveUp={() => moveImage('prompt', img.src, 'up')}
                        onMoveDown={() => moveImage('prompt', img.src, 'down')}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Editor</Label>
              <textarea
                ref={promptTextareaRef}
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={promptText}
                onChange={(event) => handlePromptTextChange(event.target.value)}
                onClick={() => handleTextareaClick('prompt')}
                onKeyUp={() => handleTextareaKeyUp('prompt')}
                onSelect={() => handleTextareaKeyUp('prompt')}
                placeholder="Type your question here. Click where you want to insert an image, then click 'Add Image'."
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Preview (how students will see it)</Label>
              <div className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm overflow-y-auto">
                {question.prompt ? (
                  <QuestionPrompt promptMd={question.prompt} className="text-sm" imageLayout={imageLayout.prompt} />
                ) : (
                  <p className="text-muted-foreground text-sm">Preview will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {question.type !== 'LONG_TEXT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Answer choices *</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  At least one filled choice required. 4 recommended for multiple choice.
                </p>
              </div>
              <div className="flex gap-2">
                {question.options.length < 4 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onAddRecommendedOptions}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to 4
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add choice
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {question.type === 'MCQ_SINGLE' ? (
                <RadioGroup
                  value={question.options.find((opt) => opt.isCorrect)?.id || ''}
                  onValueChange={(value) => {
                    onChange((prev) => ({
                      ...prev,
                      options: prev.options.map((opt) => ({
                        ...opt,
                        isCorrect: opt.id === value,
                      })),
                    }))
                  }}
                  className="space-y-2"
                >
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={option.id}
                      className="flex flex-col gap-2 rounded-md border border-input bg-background p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={option.id} id={`correct-${question.id}-${option.id}`} />
                        <Label htmlFor={`correct-${question.id}-${option.id}`} className="cursor-pointer font-normal text-sm">
                          Correct option
                        </Label>
                      </div>
                      <Input
                        value={option.label}
                        onChange={(event) =>
                          handleOptionUpdate(option.id, (prev) => ({
                            ...prev,
                            label: event.target.value,
                          }))
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                        disabled={question.options.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                question.options.map((option, optionIndex) => (
                  <div
                    key={option.id}
                    className="flex flex-col gap-2 rounded-md border border-input bg-background p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`correct-${question.id}-${option.id}`}
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => {
                          handleOptionUpdate(option.id, (prev) => ({
                            ...prev,
                            isCorrect: checked as boolean,
                          }))
                        }}
                      />
                      <Label htmlFor={`correct-${question.id}-${option.id}`} className="cursor-pointer font-normal text-sm">
                        Correct
                      </Label>
                    </div>
                    <Input
                      value={option.label}
                      onChange={(event) =>
                        handleOptionUpdate(option.id, (prev) => ({
                          ...prev,
                          label: event.target.value,
                        }))
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={question.options.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`shuffle-${question.id}`}
                checked={question.shuffleOptions}
                onCheckedChange={(checked) =>
                  onChange((prev) => ({
                    ...prev,
                    shuffleOptions: checked as boolean,
                  }))
                }
              />
              <Label htmlFor={`shuffle-${question.id}`} className="cursor-pointer font-normal text-sm">
                Shuffle choices per student
              </Label>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`points-${question.id}`}>Points *</Label>
            <Input
              id={`points-${question.id}`}
              type="number"
              min="0.5"
              step="0.5"
              value={question.points}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  points: Number.isFinite(Number(event.target.value))
                    ? Number(event.target.value)
                    : prev.points,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor={`explanation-${question.id}`}>
              {question.type === 'LONG_TEXT' ? 'Example Answer (optional)' : 'Explanation (optional)'}
            </Label>
            <textarea
              id={`explanation-${question.id}`}
              className="mt-2 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={question.explanation}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  explanation: event.target.value,
                }))
              }
              placeholder={
                question.type === 'LONG_TEXT'
                  ? 'Provide an example of a good answer for grading reference.'
                  : 'Share the reasoning for the correct answer.'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function renderTypeLabel(type: QuestionType) {
  switch (type) {
    case 'LONG_TEXT':
      return 'Free response'
    case 'MCQ_SINGLE':
      return 'Multiple choice'
    case 'MCQ_MULTI':
      return 'Select all that apply'
    default:
      return type
  }
}

// Sortable image item component
function SortableImageItem({ 
  id, 
  img, 
  index, 
  total, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}: { 
  id: string
  img: { alt: string; src: string }
  index: number
  total: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-2 rounded-md border border-input bg-muted/30 cursor-grab active:cursor-grabbing"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 relative rounded-md border border-input overflow-hidden bg-background min-w-[100px]">
        <img
          src={img.src}
          alt={img.alt}
          className="max-w-full max-h-32 object-contain block"
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            disabled={index === 0}
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            disabled={index === total - 1}
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="Remove image"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground pt-1">
        #{index + 1}
      </div>
    </div>
  )
}
