'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'

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
  subteams: SubteamInfo[]
  test?: {
    id: string
    name: string
    description: string | null
    instructions: string | null
    durationMinutes: number
    maxAttempts: number | null
    scoreReleaseMode: 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST'
    randomizeQuestionOrder: boolean
    randomizeOptionOrder: boolean
    requireFullscreen: boolean
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    assignments: Array<{
      assignedScope: 'TEAM' | 'SUBTEAM' | 'PERSONAL'
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

export function NewTestBuilder({ teamId, teamName, subteams, test }: NewTestBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishFormData, setPublishFormData] = useState({
    startAt: '',
    endAt: '',
    testPassword: '',
    testPasswordConfirm: '',
    releaseScoresAt: '',
  })

  const isEditMode = !!test

  const [assignmentMode, setAssignmentMode] = useState<'TEAM' | 'SUBTEAMS'>(() => {
    if (test) {
      const hasSubteamAssignments = test.assignments.some(a => a.assignedScope === 'SUBTEAM')
      return hasSubteamAssignments ? 'SUBTEAMS' : 'TEAM'
    }
    return 'TEAM'
  })
  
  const [selectedSubteams, setSelectedSubteams] = useState<string[]>(() => {
    if (test) {
      return test.assignments
        .filter(a => a.assignedScope === 'SUBTEAM' && a.subteamId)
        .map(a => a.subteamId!)
    }
    return []
  })

  const [details, setDetails] = useState({
    name: test?.name || '',
    description: test?.description || '',
    instructions: test?.instructions || '',
    durationMinutes: test?.durationMinutes?.toString() || '60',
    maxAttempts: test?.maxAttempts?.toString() || '',
    scoreReleaseMode: (test?.scoreReleaseMode || 'FULL_TEST') as 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST',
    randomizeQuestionOrder: test?.randomizeQuestionOrder || false,
    randomizeOptionOrder: test?.randomizeOptionOrder || false,
    requireFullscreen: test?.requireFullscreen ?? true,
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

  const handleImageEmbed = (questionId: string, field: 'context' | 'prompt', file: File) => {
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
        const combined = existing
          ? `${existing.trimEnd()}\n\n${imageMarkdown}`
          : imageMarkdown
        return {
          ...question,
          [field]: combined,
        }
      })
      toast({
        title: 'Image embedded',
        description: 'The image was embedded into the question content.',
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

  const validationSummary = useMemo(() => {
    const errors: string[] = []

    if (!details.name.trim()) {
      errors.push('Test name is required.')
    }

    const durationValue = parseInt(details.durationMinutes, 10)
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      errors.push('Duration must be a positive number of minutes.')
    }

    if (assignmentMode === 'SUBTEAMS' && selectedSubteams.length === 0) {
      errors.push('Select at least one subteam or assign to the entire team.')
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
      durationValue: Number.isFinite(parseInt(details.durationMinutes, 10))
        ? parseInt(details.durationMinutes, 10)
        : 0,
    }
  }, [assignmentMode, details, questions, selectedSubteams])

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
    if (validationSummary.errors.length > 0) {
      toast({
        title: 'Please fix the highlighted issues',
        description: validationSummary.errors.join('\n'),
        variant: 'destructive',
      })
      return
    }

    const assignments =
      assignmentMode === 'TEAM'
        ? [{ assignedScope: 'TEAM' as const }]
        : selectedSubteams.map((subteamId) => ({
            assignedScope: 'SUBTEAM' as const,
            subteamId,
          }))

    const payload = {
      teamId,
      name: details.name.trim(),
      description: details.description.trim() || undefined,
      instructions: details.instructions.trim() || undefined,
      durationMinutes: validationSummary.durationValue,
      maxAttempts: details.maxAttempts ? parseInt(details.maxAttempts, 10) : undefined,
      scoreReleaseMode: details.scoreReleaseMode,
      randomizeQuestionOrder: details.randomizeQuestionOrder,
      randomizeOptionOrder: details.randomizeOptionOrder,
      requireFullscreen: details.requireFullscreen,
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
            maxAttempts: payload.maxAttempts,
            scoreReleaseMode: payload.scoreReleaseMode,
            randomizeQuestionOrder: payload.randomizeQuestionOrder,
            randomizeOptionOrder: payload.randomizeOptionOrder,
            requireFullscreen: payload.requireFullscreen,
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
          router.push(`/teams/${teamId}?tab=tests`)
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
          router.push(`/teams/${teamId}?tab=tests`)
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
        description: 'The test is now visible to assigned members',
      })

      if (!isEditMode) {
        sessionStorage.removeItem('newTestId')
      }
      setPublishDialogOpen(false)
      router.push(`/teams/${teamId}?tab=tests`)
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
            onClick={() => router.push(`/teams/${teamId}?tab=tests`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving} variant="outline">
            {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save as Draft'}
          </Button>
          <Button 
            onClick={() => handleSave(true)} 
            disabled={saving || validationSummary.errors.length > 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
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
              onImageUpload={(field, file) => handleImageEmbed(question.id, field, file)}
              onAddRecommendedOptions={() => addRecommendedOptions(question.id)}
            />
          ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-[320px] space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Assignments
              </CardTitle>
              <CardDescription>
                Choose who should receive the test. Admins can always preview drafts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignmentScope"
                  id="assign-team"
                  checked={assignmentMode === 'TEAM'}
                  onChange={() => setAssignmentMode('TEAM')}
                  className="h-4 w-4"
                />
                <Label htmlFor="assign-team" className="cursor-pointer">
                  Entire team
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="assignmentScope"
                  id="assign-subteams"
                  checked={assignmentMode === 'SUBTEAMS'}
                  onChange={() => setAssignmentMode('SUBTEAMS')}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <Label htmlFor="assign-subteams" className="cursor-pointer">
                    Specific subteams
                  </Label>
                  <div className="mt-2 space-y-2 rounded-md border border-input bg-muted/30 p-3">
                    {subteams.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No subteams yet—everyone will receive this test.
                      </p>
                    )}
                    {subteams.map((subteam) => (
                      <label
                        key={subteam.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm transition',
                          assignmentMode === 'SUBTEAMS' && selectedSubteams.includes(subteam.id)
                            ? 'bg-primary/10 border-primary/40'
                            : 'hover:bg-muted'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedSubteams.includes(subteam.id)}
                          onChange={() => toggleSubteam(subteam.id)}
                          disabled={assignmentMode !== 'SUBTEAMS'}
                        />
                        {subteam.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                Security & Lockdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="duration">Allotted time (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="720"
                  value={details.durationMinutes}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, durationMinutes: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxAttempts">Max attempts per user (optional)</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="100"
                  value={details.maxAttempts}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, maxAttempts: event.target.value }))
                  }
                  placeholder="Unlimited if not set"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for unlimited attempts
                </p>
              </div>
              <div>
                <Label htmlFor="scoreReleaseMode">Score release mode</Label>
                <select
                  id="scoreReleaseMode"
                  className="w-full h-12 rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm"
                  value={details.scoreReleaseMode}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      scoreReleaseMode: event.target.value as 'SCORE_ONLY' | 'SCORE_WITH_WRONG' | 'FULL_TEST',
                    }))
                  }
                >
                  <option value="FULL_TEST">Full test (answers, correctness, feedback)</option>
                  <option value="SCORE_WITH_WRONG">Score + which questions were wrong</option>
                  <option value="SCORE_ONLY">Score only</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls what students see after submission
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="requireFullscreen"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={details.requireFullscreen}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, requireFullscreen: event.target.checked }))
                  }
                />
                <Label htmlFor="requireFullscreen" className="cursor-pointer">
                  Require fullscreen lockdown
                </Label>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1 font-medium text-foreground">
                  <ShieldAlert className="h-4 w-4" />
                  Lockdown is best-effort
                </p>
                <p>
                  Students will be prompted to stay in fullscreen and we log focus changes, pasted
                  content, and dev tools usage. Pair with live proctoring for high-stakes tests.
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1 font-medium text-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Need to randomize?
                </p>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={details.randomizeQuestionOrder}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          randomizeQuestionOrder: event.target.checked,
                        }))
                      }
                    />
                    Randomize question order per student
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={details.randomizeOptionOrder}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          randomizeOptionOrder: event.target.checked,
                        }))
                      }
                    />
                    Shuffle answer choices
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Test</DialogTitle>
            <DialogDescription>
              Schedule the test and set a password if needed. Students will need the password to take the test.
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} disabled={publishing}>
              Cancel
            </Button>
            <Button
              onClick={handlePublishTest}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish'}
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
  onImageUpload: (field: 'context' | 'prompt', file: File) => void
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
  const contextInputRef = useRef<HTMLInputElement>(null)
  const promptInputRef = useRef<HTMLInputElement>(null)

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
    onImageUpload(field, file)
  }

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
          <Label className="flex items-center justify-between text-sm font-medium">
            Context / stimulus (optional)
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => contextInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
            <input
              ref={contextInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleImageChange('context', event.target.files)
                event.target.value = ''
              }}
            />
          </Label>
          <textarea
            className="mt-2 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={question.context}
            onChange={(event) =>
              onChange((prev) => ({ ...prev, context: event.target.value }))
            }
            placeholder="Provide diagrams, reading passages, or any supporting text."
          />
        </div>

        <div>
          <Label className="flex items-center justify-between text-sm font-medium">
            Prompt *
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => promptInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
            <input
              ref={promptInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleImageChange('prompt', event.target.files)
                event.target.value = ''
              }}
            />
          </Label>
          <textarea
            className="mt-2 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={question.prompt}
            onChange={(event) =>
              onChange((prev) => ({ ...prev, prompt: event.target.value }))
            }
            placeholder="Ask the question exactly as students should see it."
            required
          />
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
              {question.options.map((option, optionIndex) => (
                <div
                  key={option.id}
                  className="flex flex-col gap-2 rounded-md border border-input bg-background p-3 sm:flex-row sm:items-center"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type={question.type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                      name={`correct-${question.id}`}
                      className="h-4 w-4"
                      checked={option.isCorrect}
                      onChange={(event) => {
                        const checked = event.target.checked
                        if (question.type === 'MCQ_SINGLE') {
                          onChange((prev) => ({
                            ...prev,
                            options: prev.options.map((opt) => ({
                              ...opt,
                              isCorrect: opt.id === option.id ? checked : false,
                            })),
                          }))
                        } else {
                          handleOptionUpdate(option.id, (prev) => ({
                            ...prev,
                            isCorrect: checked,
                          }))
                        }
                      }}
                    />
                    {question.type === 'MCQ_SINGLE' ? 'Correct option' : 'Correct'}
                  </label>
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
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={question.shuffleOptions}
                onChange={(event) =>
                  onChange((prev) => ({
                    ...prev,
                    shuffleOptions: event.target.checked,
                  }))
                }
              />
              Shuffle choices per student
            </label>
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
