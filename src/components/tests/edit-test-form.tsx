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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

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
  id: string // Can be existing question ID or new nanoid
  isNew: boolean // Track if this is a new question
  type: QuestionType
  prompt: string
  context: string
  explanation: string
  points: number
  options: OptionDraft[]
  shuffleOptions: boolean
}

interface EditTestFormProps {
  teamId: string
  teamName: string
  subteams: SubteamInfo[]
  test: {
    id: string
    name: string
    description: string | null
    instructions: string | null
    durationMinutes: number
    allowLateUntil: Date | null
    randomizeQuestionOrder: boolean
    randomizeOptionOrder: boolean
    requireFullscreen: boolean
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
  // Simple parsing: if promptMd contains "---" separator, split it
  // Otherwise, treat entire as prompt
  const parts = promptMd.split('---')
  if (parts.length === 2) {
    return { context: parts[0].trim(), prompt: parts[1].trim() }
  }
  return { context: '', prompt: promptMd.trim() }
}

// Compose promptMd from context and prompt
function composePrompt(question: QuestionDraft): string {
  const { context, prompt } = question
  if (context && prompt) return `${context}\n\n---\n\n${prompt}`
  if (context) return context
  return prompt
}

export function EditTestForm({ teamId, teamName, subteams, test }: EditTestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [assignmentMode, setAssignmentMode] = useState<'TEAM' | 'SUBTEAMS'>(() => {
    const hasSubteamAssignments = test.assignments.some(a => a.assignedScope === 'SUBTEAM')
    return hasSubteamAssignments ? 'SUBTEAMS' : 'TEAM'
  })
  
  const [selectedSubteams, setSelectedSubteams] = useState<string[]>(() => {
    return test.assignments
      .filter(a => a.assignedScope === 'SUBTEAM' && a.subteamId)
      .map(a => a.subteamId!)
  })

  const [details, setDetails] = useState({
    name: test.name,
    description: test.description || '',
    instructions: test.instructions || '',
    durationMinutes: test.durationMinutes.toString(),
    randomizeQuestionOrder: test.randomizeQuestionOrder,
    randomizeOptionOrder: test.randomizeOptionOrder,
    requireFullscreen: test.requireFullscreen,
  })

  // Convert existing questions to draft format
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    return test.questions.map((q) => {
      const { context, prompt } = parsePromptMd(q.promptMd)
      const type = (q.type === 'MCQ_SINGLE' || q.type === 'MCQ_MULTI' || q.type === 'LONG_TEXT') 
        ? q.type as QuestionType
        : 'MCQ_SINGLE' // Default fallback
      
      return {
        id: q.id,
        isNew: false,
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
      isNew: true,
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
      ;[newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
      return newQuestions
    })
  }

  const handleImageEmbed = async (questionId: string, field: 'context' | 'prompt', file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: 'Image too large',
        description: 'Maximum size is 2MB',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const imageMarkdown = `![${file.name}](${dataUrl})`
      
      updateQuestion(questionId, (prev) => {
        if (field === 'context') {
          return { ...prev, context: prev.context ? `${prev.context}\n\n${imageMarkdown}` : imageMarkdown }
        } else {
          return { ...prev, prompt: prev.prompt ? `${prev.prompt}\n\n${imageMarkdown}` : imageMarkdown }
        }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!details.name.trim()) {
      toast({
        title: 'Error',
        description: 'Test name is required',
        variant: 'destructive',
      })
      return
    }

    const durationValue = parseInt(details.durationMinutes, 10)
    if (isNaN(durationValue) || durationValue < 1 || durationValue > 720) {
      toast({
        title: 'Error',
        description: 'Duration must be between 1 and 720 minutes',
        variant: 'destructive',
      })
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.prompt.trim()) {
        toast({
          title: 'Error',
          description: `Question ${i + 1} must have a prompt`,
          variant: 'destructive',
        })
        return
      }
      if (q.type !== 'LONG_TEXT') {
        // Filter out empty options for validation
        const filledOptions = q.options.filter((opt) => opt.label.trim())
        
        if (filledOptions.length < 1) {
          toast({
            title: 'Error',
            description: `Question ${i + 1} must have at least one filled answer choice`,
            variant: 'destructive',
          })
          return
        }
        
        const correctCount = filledOptions.filter((opt) => opt.isCorrect).length
        if (correctCount === 0) {
          toast({
            title: 'Error',
            description: `Question ${i + 1} must have at least one correct answer`,
            variant: 'destructive',
          })
          return
        }
        if (q.type === 'MCQ_SINGLE' && correctCount !== 1) {
          toast({
            title: 'Error',
            description: `Question ${i + 1} must have exactly one correct answer`,
            variant: 'destructive',
          })
          return
        }
      }
    }

    const assignments =
      assignmentMode === 'TEAM'
        ? [{ assignedScope: 'TEAM' as const }]
        : selectedSubteams.map((subteamId) => ({
            assignedScope: 'SUBTEAM' as const,
            subteamId,
          }))

    const payload = {
      name: details.name.trim(),
      description: details.description.trim() || undefined,
      instructions: details.instructions.trim() || undefined,
      durationMinutes: durationValue,
      randomizeQuestionOrder: details.randomizeQuestionOrder,
      randomizeOptionOrder: details.randomizeOptionOrder,
      requireFullscreen: details.requireFullscreen,
    }

    setSaving(true)
    try {
      // Update test details
      const response = await fetch(`/api/tests/${test.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
                  .filter((option) => option.label.trim()) // Filter out empty options
                  .map((option, optIndex) => ({
                    label: option.label.trim(),
                    isCorrect: option.isCorrect,
                    order: optIndex,
                  })),
        }

        if (question.isNew) {
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

      toast({
        title: 'Test Updated',
        description: 'Your changes have been saved',
      })

      router.push(`/teams/${teamId}/tests/${test.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update test',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teams/${teamId}/tests/${test.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Test</h1>
          <p className="text-muted-foreground mt-1">Update test details and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-name">Test title *</Label>
            <Input
              id="test-name"
              value={details.name}
              onChange={(e) => setDetails((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Test name"
            />
          </div>
          <div>
            <Label htmlFor="test-description">Description</Label>
            <Input
              id="test-description"
              value={details.description}
              onChange={(e) => setDetails((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Test description"
            />
          </div>
          <div>
            <Label htmlFor="test-instructions">Instructions</Label>
            <textarea
              id="test-instructions"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={details.instructions}
              onChange={(e) => setDetails((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instructions for students"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="720"
                value={details.durationMinutes}
                onChange={(e) => setDetails((prev) => ({ ...prev, durationMinutes: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Randomize Question Order</Label>
                <p className="text-xs text-muted-foreground">Shuffle questions for each student</p>
              </div>
              <input
                type="checkbox"
                checked={details.randomizeQuestionOrder}
                onChange={(e) => setDetails((prev) => ({ ...prev, randomizeQuestionOrder: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Randomize Option Order</Label>
                <p className="text-xs text-muted-foreground">Shuffle answer choices for each student</p>
              </div>
              <input
                type="checkbox"
                checked={details.randomizeOptionOrder}
                onChange={(e) => setDetails((prev) => ({ ...prev, randomizeOptionOrder: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Fullscreen Lockdown</Label>
                <p className="text-xs text-muted-foreground">Force fullscreen mode during test</p>
              </div>
              <input
                type="checkbox"
                checked={details.requireFullscreen}
                onChange={(e) => setDetails((prev) => ({ ...prev, requireFullscreen: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>
          </div>
          <div className="pt-4 border-t">
            <Label>Assignments</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="assign-team"
                  checked={assignmentMode === 'TEAM'}
                  onChange={() => setAssignmentMode('TEAM')}
                />
                <Label htmlFor="assign-team" className="font-normal cursor-pointer">
                  Everyone on the team
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="assign-subteams"
                  checked={assignmentMode === 'SUBTEAMS'}
                  onChange={() => setAssignmentMode('SUBTEAMS')}
                />
                <Label htmlFor="assign-subteams" className="font-normal cursor-pointer">
                  Specific subteams
                </Label>
              </div>
              {assignmentMode === 'SUBTEAMS' && (
                <div className="ml-6 space-y-2">
                  {subteams.map((subteam) => (
                    <div key={subteam.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`subteam-${subteam.id}`}
                        checked={selectedSubteams.includes(subteam.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubteams((prev) => [...prev, subteam.id])
                          } else {
                            setSelectedSubteams((prev) => prev.filter((id) => id !== subteam.id))
                          }
                        }}
                      />
                      <Label htmlFor={`subteam-${subteam.id}`} className="font-normal cursor-pointer">
                        {subteam.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              onAddRecommendedOptions={() => addRecommendedOptions(question.id)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
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
