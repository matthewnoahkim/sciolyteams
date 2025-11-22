'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

export function NewTestBuilder({ teamId, teamName, subteams }: NewTestBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [assignmentMode, setAssignmentMode] = useState<'TEAM' | 'SUBTEAMS'>('TEAM')
  const [selectedSubteams, setSelectedSubteams] = useState<string[]>([])

  const [details, setDetails] = useState({
    name: '',
    description: '',
    instructions: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    durationMinutes: '60',
    startAt: '',
    endAt: '',
    randomizeQuestionOrder: false,
    randomizeOptionOrder: false,
    requireFullscreen: true,
    releaseScoresAt: '',
  })

  const [questions, setQuestions] = useState<QuestionDraft[]>([])

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

    if (!details.startAt) {
      errors.push('Test start date and time is required.')
    }
    if (!details.endAt) {
      errors.push('Test end date and time is required.')
    }

    if (details.startAt && details.endAt) {
      const start = new Date(details.startAt)
      const end = new Date(details.endAt)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        errors.push('Invalid date or time selection.')
      } else if (end <= start) {
        errors.push('End time must be after the start time.')
      }
    }

    const durationValue = parseInt(details.durationMinutes, 10)
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      errors.push('Duration must be a positive number of minutes.')
    }

    if (assignmentMode === 'SUBTEAMS' && selectedSubteams.length === 0) {
      errors.push('Select at least one subteam or assign to the entire team.')
    }

    if (details.adminPassword.length < 6) {
      errors.push('Admin password must be at least 6 characters.')
    }

    if (details.adminPassword !== details.adminPasswordConfirm) {
      errors.push('Admin password confirmation does not match.')
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
        if (question.options.length < 2) {
          errors.push(`Question ${index + 1} needs at least two options.`)
        }

        const blankOption = question.options.some((option) => !option.label.trim())
        if (blankOption) {
          errors.push(`Question ${index + 1} has a blank answer choice.`)
        }

        const correctCount = question.options.filter((option) => option.isCorrect).length
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

  const handleSave = async () => {
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
      startAt: details.startAt ? new Date(details.startAt).toISOString() : undefined,
      endAt: details.endAt ? new Date(details.endAt).toISOString() : undefined,
      randomizeQuestionOrder: details.randomizeQuestionOrder,
      randomizeOptionOrder: details.randomizeOptionOrder,
      requireFullscreen: details.requireFullscreen,
      adminPassword: details.adminPassword,
      releaseScoresAt: details.releaseScoresAt
        ? new Date(details.releaseScoresAt).toISOString()
        : undefined,
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
            : question.options.map((option, optIndex) => ({
                label: option.label.trim(),
                isCorrect: option.isCorrect,
                order: optIndex,
              })),
      })),
    }

    setSaving(true)
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create test')
      }

      toast({
        title: 'Test saved',
        description: 'Your test draft has been created successfully.',
      })
      router.push(`/teams/${teamId}?tab=tests`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Failed to save test',
        description: error.message || 'Something went wrong while saving the test.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Team • {teamName}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create a New Test</h1>
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Test'}
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
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Add prompts, images, and answer options. Everything auto-formats like Google Forms.
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
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-[320px] space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="h-4 w-4" />
                Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startAt">Opens *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={details.startAt}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, startAt: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endAt">Closes *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={details.endAt}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, endAt: event.target.value }))
                  }
                  required
                />
              </div>
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
                <Label htmlFor="releaseScoresAt">Release scores (optional)</Label>
                <Input
                  id="releaseScoresAt"
                  type="datetime-local"
                  value={details.releaseScoresAt}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, releaseScoresAt: event.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

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
                <Label htmlFor="adminPassword">Admin password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={details.adminPassword}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, adminPassword: event.target.value }))
                  }
                  placeholder="Required to edit or publish"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminPasswordConfirm">Confirm password *</Label>
                <Input
                  id="adminPasswordConfirm"
                  type="password"
                  value={details.adminPasswordConfirm}
                  onChange={(event) =>
                    setDetails((prev) => ({ ...prev, adminPasswordConfirm: event.target.value }))
                  }
                  required
                />
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
              <Label className="text-sm font-medium">Answer choices *</Label>
              <Button type="button" size="sm" variant="outline" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" />
                Add choice
              </Button>
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
                    disabled={question.options.length <= 2}
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
            <Label htmlFor={`explanation-${question.id}`}>Explanation (optional)</Label>
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
              placeholder="Share the reasoning for the correct answer."
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
