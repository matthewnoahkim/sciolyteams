'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  ClipboardList,
  LogOut, 
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { nanoid } from 'nanoid'

interface StaffMembership {
  id: string
  email: string
  name: string | null
  role: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  tournament: {
    id: string
    name: string
    division: 'B' | 'C'
    startDate: string
  }
  events: Array<{
    event: {
      id: string
      name: string
      division: 'B' | 'C'
    }
  }>
  tests: Array<{
    id: string
    name: string
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    eventId: string | null
    event?: {
      id: string
      name: string
    } | null
    questions: Array<{
      id: string
      type: string
      promptMd: string
      points: number
      order: number
      options: Array<{
        id: string
        label: string
        isCorrect: boolean
        order: number
      }>
    }>
  }>
}

interface TimelineItem {
  id: string
  name: string
  description: string | null
  dueDate: string
  type: string
}

interface ESPortalClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  staffMemberships: StaffMembership[]
}

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTI' | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMERIC'

interface QuestionDraft {
  id: string
  type: QuestionType
  promptMd: string
  explanation?: string
  points: number
  order: number
  shuffleOptions: boolean
  numericTolerance?: number
  options: Array<{
    id: string
    label: string
    isCorrect: boolean
    order: number
  }>
}

interface TestDraft {
  name: string
  description: string
  instructions: string
  durationMinutes: number
  eventId: string
  questions: QuestionDraft[]
}

export function ESPortalClient({ user, staffMemberships }: ESPortalClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>(staffMemberships[0]?.tournament.id || '')
  const [timelines, setTimelines] = useState<Record<string, TimelineItem[]>>({})
  const [loadingTimelines, setLoadingTimelines] = useState<Set<string>>(new Set())
  const [editingTest, setEditingTest] = useState<string | null>(null)
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Test editor state
  const [testDraft, setTestDraft] = useState<TestDraft>({
    name: '',
    description: '',
    instructions: '',
    durationMinutes: 60,
    eventId: '',
    questions: [],
  })

  const handleSignOut = () => {
    signOut({ callbackUrl: '/es' })
  }

  // Fetch timeline for a tournament
  const fetchTimeline = async (tournamentId: string) => {
    if (loadingTimelines.has(tournamentId) || timelines[tournamentId]) return
    
    setLoadingTimelines(prev => new Set([...prev, tournamentId]))
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/timeline`)
      if (res.ok) {
        const data = await res.json()
        setTimelines(prev => ({ ...prev, [tournamentId]: data.timeline }))
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoadingTimelines(prev => {
        const next = new Set(prev)
        next.delete(tournamentId)
        return next
      })
    }
  }

  useEffect(() => {
    if (activeTab) {
      fetchTimeline(activeTab)
    }
  }, [activeTab])

  const activeMembership = staffMemberships.find(m => m.tournament.id === activeTab)

  const addQuestion = () => {
    const newQuestion: QuestionDraft = {
      id: nanoid(),
      type: 'MCQ_SINGLE',
      promptMd: '',
      points: 1,
      order: testDraft.questions.length,
      shuffleOptions: false,
      options: [
        { id: nanoid(), label: '', isCorrect: true, order: 0 },
        { id: nanoid(), label: '', isCorrect: false, order: 1 },
      ],
    }
    setTestDraft(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const updateQuestion = (questionId: string, updates: Partial<QuestionDraft>) => {
    setTestDraft(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }))
  }

  const removeQuestion = (questionId: string) => {
    setTestDraft(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId).map((q, i) => ({ ...q, order: i })),
    }))
  }

  const addOption = (questionId: string) => {
    setTestDraft(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...q.options,
              { id: nanoid(), label: '', isCorrect: false, order: q.options.length },
            ],
          }
        }
        return q
      }),
    }))
  }

  const updateOption = (questionId: string, optionId: string, updates: Partial<{ label: string; isCorrect: boolean }>) => {
    setTestDraft(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          let newOptions = q.options.map(o => 
            o.id === optionId ? { ...o, ...updates } : o
          )
          // For single choice, only one option can be correct
          if (updates.isCorrect && q.type === 'MCQ_SINGLE') {
            newOptions = newOptions.map(o => ({
              ...o,
              isCorrect: o.id === optionId,
            }))
          }
          return { ...q, options: newOptions }
        }
        return q
      }),
    }))
  }

  const removeOption = (questionId: string, optionId: string) => {
    setTestDraft(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter(o => o.id !== optionId).map((o, i) => ({ ...o, order: i })),
          }
        }
        return q
      }),
    }))
  }

  const handleCreateTest = async () => {
    if (!activeMembership || !testDraft.name) return

    setSaving(true)
    try {
      const res = await fetch('/api/es/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: activeMembership.id,
          tournamentId: activeMembership.tournament.id,
          eventId: testDraft.eventId || undefined,
          name: testDraft.name,
          description: testDraft.description || undefined,
          instructions: testDraft.instructions || undefined,
          durationMinutes: testDraft.durationMinutes,
          questions: testDraft.questions.map(q => ({
            type: q.type,
            promptMd: q.promptMd,
            explanation: q.explanation,
            points: q.points,
            order: q.order,
            shuffleOptions: q.shuffleOptions,
            numericTolerance: q.numericTolerance,
            options: q.type.startsWith('MCQ') ? q.options : undefined,
          })),
        }),
      })

      if (res.ok) {
        toast({
          title: 'Test created',
          description: 'Your test has been saved as a draft.',
        })
        setCreateTestDialogOpen(false)
        setTestDraft({
          name: '',
          description: '',
          instructions: '',
          durationMinutes: 60,
          eventId: '',
          questions: [],
        })
        router.refresh()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create test',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTest = async (testId: string, status?: 'PUBLISHED') => {
    setSaving(true)
    try {
      const res = await fetch('/api/es/tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          ...(status && { status }),
          name: testDraft.name,
          description: testDraft.description || undefined,
          instructions: testDraft.instructions || undefined,
          durationMinutes: testDraft.durationMinutes,
          eventId: testDraft.eventId || undefined,
          questions: testDraft.questions.map(q => ({
            id: q.id.length > 20 ? undefined : q.id, // New questions have nanoid which is shorter
            type: q.type,
            promptMd: q.promptMd,
            explanation: q.explanation,
            points: q.points,
            order: q.order,
            shuffleOptions: q.shuffleOptions,
            numericTolerance: q.numericTolerance,
            options: q.type.startsWith('MCQ') ? q.options.map(o => ({
              id: o.id.length > 20 ? undefined : o.id,
              label: o.label,
              isCorrect: o.isCorrect,
              order: o.order,
            })) : undefined,
          })),
        }),
      })

      if (res.ok) {
        toast({
          title: status === 'PUBLISHED' ? 'Test published' : 'Test saved',
          description: status === 'PUBLISHED' 
            ? 'Your test is now available to the tournament.' 
            : 'Your changes have been saved.',
        })
        setEditingTest(null)
        router.refresh()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save test')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save test',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const startEditingTest = (test: StaffMembership['tests'][0]) => {
    setTestDraft({
      name: test.name,
      description: '',
      instructions: '',
      durationMinutes: 60,
      eventId: test.eventId || '',
      questions: test.questions.map(q => ({
        id: q.id,
        type: q.type as QuestionType,
        promptMd: q.promptMd,
        points: q.points,
        order: q.order,
        shuffleOptions: false,
        options: q.options.map(o => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
      })),
    })
    setEditingTest(test.id)
  }

  const getTimelineStatus = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" variant="light" />
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white font-semibold">Event Supervisor Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/30">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block max-w-[120px] md:max-w-none">
              <p className="text-xs sm:text-sm font-medium truncate text-white">
                {user.name || user.email}
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 truncate">{user.email}</p>
            </div>
            <ThemeToggle variant="header" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="px-2 sm:px-3 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.name?.split(' ')[0] || 'Event Supervisor'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your tournament assignments and create tests for your events.
          </p>
        </div>

        {staffMemberships.length === 0 ? (
          <Card className="bg-card/90 backdrop-blur border border-white/10">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Assignments</h3>
              <p className="text-muted-foreground">
                You don&apos;t have any tournament assignments yet. Contact a Tournament Director to get invited.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-white/10">
              {staffMemberships.map(membership => (
                <TabsTrigger 
                  key={membership.tournament.id} 
                  value={membership.tournament.id}
                  className="data-[state=active]:bg-teamy-primary data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {membership.tournament.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {staffMemberships.map(membership => (
              <TabsContent key={membership.tournament.id} value={membership.tournament.id} className="space-y-6">
                {/* Tournament Info */}
                <Card className="bg-card/90 backdrop-blur border border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{membership.tournament.name}</CardTitle>
                        <CardDescription>
                          Division {membership.tournament.division} • {format(new Date(membership.tournament.startDate), 'MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge className="bg-teamy-primary/10 text-teamy-primary border-teamy-primary/20">
                        {membership.role === 'EVENT_SUPERVISOR' ? 'Event Supervisor' : 'Tournament Director'}
                      </Badge>
                    </div>
                  </CardHeader>
                  {membership.events.length > 0 && (
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Your Assigned Events:</h4>
                      <div className="flex flex-wrap gap-2">
                        {membership.events.map(e => (
                          <Badge key={e.event.id} variant="secondary" className="bg-teamy-primary/5 dark:bg-white/5">
                            {e.event.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Timeline */}
                {timelines[membership.tournament.id] && timelines[membership.tournament.id].length > 0 && (
                  <Card className="bg-card/90 backdrop-blur border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-teamy-primary" />
                        Timeline & Deadlines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {timelines[membership.tournament.id].map(item => {
                          const status = getTimelineStatus(item.dueDate)
                          return (
                            <div 
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                status === 'overdue' 
                                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30' 
                                  : status === 'today'
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {status === 'overdue' ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : status === 'today' ? (
                                  <Clock className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="h-5 w-5 text-teamy-primary" />
                                )}
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  status === 'overdue' ? 'text-red-600' : status === 'today' ? 'text-amber-600' : ''
                                }`}>
                                  {format(new Date(item.dueDate), 'MMM d, yyyy')}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {item.type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tests Section */}
                <Card className="bg-card/90 backdrop-blur border border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teamy-primary" />
                        Your Tests
                      </CardTitle>
                      <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-teamy-primary text-white hover:bg-teamy-primary-dark">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Test
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create New Test</DialogTitle>
                            <DialogDescription>
                              Create a test for your assigned event. You can add multiple choice and free response questions.
                            </DialogDescription>
                          </DialogHeader>
                          <TestEditor
                            testDraft={testDraft}
                            setTestDraft={setTestDraft}
                            events={membership.events.map(e => e.event)}
                            addQuestion={addQuestion}
                            updateQuestion={updateQuestion}
                            removeQuestion={removeQuestion}
                            addOption={addOption}
                            updateOption={updateOption}
                            removeOption={removeOption}
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateTestDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateTest}
                              disabled={saving || !testDraft.name}
                              className="bg-teamy-primary text-white hover:bg-teamy-primary-dark"
                            >
                              {saving ? 'Creating...' : 'Create Test'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membership.tests.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No tests created yet. Click &ldquo;Create Test&rdquo; to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {membership.tests.map(test => (
                          <div 
                            key={test.id}
                            className="p-4 rounded-lg border border-white/10 bg-white/60 dark:bg-slate-900/60"
                          >
                            {editingTest === test.id ? (
                              <div className="space-y-4">
                                <TestEditor
                                  testDraft={testDraft}
                                  setTestDraft={setTestDraft}
                                  events={membership.events.map(e => e.event)}
                                  addQuestion={addQuestion}
                                  updateQuestion={updateQuestion}
                                  removeQuestion={removeQuestion}
                                  addOption={addOption}
                                  updateOption={updateOption}
                                  removeOption={removeOption}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditingTest(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleUpdateTest(test.id)}
                                    disabled={saving}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                  </Button>
                                  {test.status === 'DRAFT' && (
                                    <Button 
                                      onClick={() => handleUpdateTest(test.id, 'PUBLISHED')}
                                      disabled={saving}
                                      className="bg-teamy-primary text-white hover:bg-teamy-primary-dark"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Save & Publish
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{test.name}</h4>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        test.status === 'PUBLISHED' 
                                          ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                          : test.status === 'CLOSED'
                                            ? 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      }
                                    >
                                      {test.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {test.event?.name || 'No event assigned'} • {test.questions.length} questions
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => startEditingTest(test)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-card/80 dark:bg-slate-900/80 backdrop-blur py-4 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Test Editor Component
function TestEditor({
  testDraft,
  setTestDraft,
  events,
  addQuestion,
  updateQuestion,
  removeQuestion,
  addOption,
  updateOption,
  removeOption,
}: {
  testDraft: TestDraft
  setTestDraft: React.Dispatch<React.SetStateAction<TestDraft>>
  events: Array<{ id: string; name: string }>
  addQuestion: () => void
  updateQuestion: (questionId: string, updates: Partial<QuestionDraft>) => void
  removeQuestion: (questionId: string) => void
  addOption: (questionId: string) => void
  updateOption: (questionId: string, optionId: string, updates: Partial<{ label: string; isCorrect: boolean }>) => void
  removeOption: (questionId: string, optionId: string) => void
}) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Test Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Test Name *</Label>
          <Input
            id="name"
            value={testDraft.name}
            onChange={e => setTestDraft(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Anatomy Practice Test"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event">Event</Label>
          <Select
            value={testDraft.eventId}
            onValueChange={value => setTestDraft(prev => ({ ...prev, eventId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={testDraft.durationMinutes}
            onChange={e => setTestDraft(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={testDraft.instructions}
          onChange={e => setTestDraft(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Enter test instructions for participants..."
          rows={3}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Questions ({testDraft.questions.length})</h3>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>

        {testDraft.questions.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">No questions yet. Click &ldquo;Add Question&rdquo; to start building your test.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testDraft.questions.map((question, index) => (
              <div 
                key={question.id}
                className="border rounded-lg bg-background"
              >
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Q{index + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {question.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {question.promptMd || 'No prompt yet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{question.points} pts</span>
                    {expandedQuestions.has(question.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {expandedQuestions.has(question.id) && (
                  <div className="p-4 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={value => updateQuestion(question.id, { type: value as QuestionType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MCQ_SINGLE">Multiple Choice (Single)</SelectItem>
                            <SelectItem value="MCQ_MULTI">Multiple Choice (Multi)</SelectItem>
                            <SelectItem value="SHORT_TEXT">Short Answer</SelectItem>
                            <SelectItem value="LONG_TEXT">Long Answer</SelectItem>
                            <SelectItem value="NUMERIC">Numeric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={e => updateQuestion(question.id, { points: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Question Prompt</Label>
                      <Textarea
                        value={question.promptMd}
                        onChange={e => updateQuestion(question.id, { promptMd: e.target.value })}
                        placeholder="Enter your question..."
                        rows={3}
                      />
                    </div>

                    {/* Options for MCQ questions */}
                    {question.type.startsWith('MCQ') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Answer Options</Label>
                          <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type={question.type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                                checked={option.isCorrect}
                                onChange={e => updateOption(question.id, option.id, { isCorrect: e.target.checked })}
                                className="h-4 w-4 text-teamy-primary"
                                name={`question-${question.id}`}
                              />
                              <Input
                                value={option.label}
                                onChange={e => updateOption(question.id, option.id, { label: e.target.value })}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1"
                              />
                              {question.options.length > 2 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeOption(question.id, option.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove Question
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

