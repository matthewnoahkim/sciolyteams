import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Lock,
  Users,
  Shuffle,
  ShieldAlert,
  FileText,
  Key,
} from 'lucide-react'
import { PasswordCopyButton } from '@/components/tests/password-copy-button'
import { EditTestSchedule } from '@/components/tests/edit-test-schedule'
import { DuplicateTestButton } from '@/components/tests/duplicate-test-button'
import { TestAttemptsView } from '@/components/tests/test-attempts-view'
import { NewTestBuilder } from '@/components/tests/new-test-builder'

const STATUS_CONFIG: Record<
  'DRAFT' | 'PUBLISHED' | 'CLOSED',
  { label: string; variant: 'secondary' | 'default' | 'destructive' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PUBLISHED: { label: 'Published', variant: 'default' },
  CLOSED: { label: 'Closed', variant: 'destructive' },
}

export default async function TeamTestDetailPage({
  params,
}: {
  params: { clubId: string; testId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId: params.clubId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  })

  if (!membership) {
    redirect('/teams')
  }

  // Only admins can view the authoring dashboard
  if (String(membership.role) !== 'ADMIN') {
    redirect(`/club/${params.clubId}?tab=tests`)
  }

  const test = await prisma.test.findFirst({
    where: {
      id: params.testId,
      teamId: params.clubId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      instructions: true,
      status: true,
      durationMinutes: true,
      maxAttempts: true,
      scoreReleaseMode: true,
      startAt: true,
      endAt: true,
      allowLateUntil: true,
      randomizeQuestionOrder: true,
      randomizeOptionOrder: true,
      requireFullscreen: true,
      releaseScoresAt: true,
      testPasswordHash: true,
      testPasswordPlaintext: true,
      createdAt: true,
      updatedAt: true,
      assignments: {
        include: {
          subteam: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!test) {
    notFound()
  }

  // If the test is a draft, show the builder/editor interface
  if (test.status === 'DRAFT') {
    const team = await prisma.team.findUnique({
      where: { id: params.clubId },
      select: {
        id: true,
        name: true,
        division: true,
        subteams: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    })

    if (!team) {
      redirect('/teams')
    }

    // Transform the test data to match NewTestBuilder's expected format
    const transformedTest = {
      id: test.id,
      name: test.name,
      description: test.description,
      instructions: test.instructions,
      durationMinutes: test.durationMinutes,
      maxAttempts: test.maxAttempts,
      scoreReleaseMode: test.scoreReleaseMode,
      randomizeQuestionOrder: test.randomizeQuestionOrder,
      randomizeOptionOrder: test.randomizeOptionOrder,
      requireFullscreen: test.requireFullscreen,
      status: test.status,
      assignments: test.assignments,
      questions: test.questions.map(q => ({
        id: q.id,
        type: q.type,
        promptMd: q.promptMd,
        explanation: q.explanation,
        points: Number(q.points),
        shuffleOptions: q.shuffleOptions,
        options: q.options.map(o => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
      })),
    }

    return (
      <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
        <div className="px-4 py-8 lg:px-8">
          <NewTestBuilder 
            teamId={team.id} 
            teamName={team.name}
            teamDivision={team.division}
            subteams={team.subteams}
            test={transformedTest}
          />
        </div>
      </div>
    )
  }

  // Otherwise, show the detail view for published tests
  const statusConfig = STATUS_CONFIG[test.status]

  const assignmentSummary =
    test.assignments.length === 0
      ? 'Everyone on the team'
      : test.assignments
          .map((assignment) => {
            if (assignment.assignedScope === 'TEAM') {
              return 'Everyone on the team'
            }
            if (assignment.assignedScope === 'SUBTEAM') {
              return assignment.subteam?.name ?? 'Subteam assignment'
            }
            return 'Specific member'
          })
          .join(', ')

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <div className="container mx-auto max-w-6xl space-y-8 py-8 px-4 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <Link href={`/club/${params.clubId}?tab=tests`} className="w-fit">
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{test.name}</h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {test.requireFullscreen && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Lockdown
              </Badge>
            )}
          </div>
          {test.description && (
            <p className="text-muted-foreground">{test.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <DuplicateTestButton
            testId={test.id}
            testName={test.name}
            teamId={params.clubId}
          />
        </div>
      </div>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Overview
                </CardTitle>
                {test.status === 'PUBLISHED' && (
                  <EditTestSchedule
                    testId={test.id}
                    currentStartAt={test.startAt ? new Date(test.startAt) : null}
                    currentEndAt={test.endAt ? new Date(test.endAt) : null}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                label="Start"
                value={test.startAt ? formatDateTime(test.startAt) : 'Not set'}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                label="End"
                value={test.endAt ? formatDateTime(test.endAt) : 'Not set'}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                label="Duration"
                value={`${test.durationMinutes} minutes`}
              />
              <InfoItem
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                label="Assigned to"
                value={assignmentSummary}
              />
              {test.maxAttempts && (
                <InfoItem
                  icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  label="Max Attempts"
                  value={`${test.maxAttempts} per user`}
                />
              )}
              {test.status === 'PUBLISHED' && test.testPasswordHash && (
                <div className="flex gap-3 sm:col-span-2">
                  <div className="mt-1">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/70">
                      Test Password
                    </p>
                    {test.testPasswordPlaintext ? (
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm font-mono">
                          {test.testPasswordPlaintext}
                        </code>
                        <PasswordCopyButton password={test.testPasswordPlaintext} />
                      </div>
                    ) : (
                      <div className="mt-1 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Password is set, but original password is not available. This test was likely published before password viewing was enabled.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          To view the password, you can update it in the test settings or republish the test with a new password.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Instructions
              </CardTitle>
              <CardDescription>
                Shown to students before they start the assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                {test.instructions?.trim() ? test.instructions : 'No special instructions provided.'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
                Delivery settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <SettingToggle
                label="Randomize question order"
                enabled={test.randomizeQuestionOrder}
              />
              <SettingToggle
                label="Randomize choice order"
                enabled={test.randomizeOptionOrder}
              />
              <SettingToggle
                label="Require fullscreen lockdown"
                enabled={test.requireFullscreen}
              />
              <SettingToggle
                label="Scores released"
                note={
                  test.releaseScoresAt
                    ? formatDateTime(test.releaseScoresAt)
                    : 'After manual release'
                }
              />
              <SettingToggle
                label="Score release mode"
                note={
                  String(test.scoreReleaseMode) === 'NONE'
                    ? 'No scores released'
                    : String(test.scoreReleaseMode) === 'SCORE_ONLY'
                    ? 'Score only'
                    : String(test.scoreReleaseMode) === 'SCORE_WITH_WRONG'
                    ? 'Score + wrong questions'
                    : 'Full test'
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                Questions ({test.questions.length})
              </CardTitle>
              <CardDescription>
                Review prompts, answer options, and explanations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {test.questions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No questions have been added yet.
                </p>
              )}

              {test.questions.map((question, index) => (
                <div key={question.id} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Question {index + 1}
                    </p>
                    <Badge variant="outline" className="uppercase">
                      {question.type.replace('MCQ_', '').replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium leading-6">{question.promptMd}</p>
                    <p className="text-sm text-muted-foreground">
                      Points: {Number(question.points)}
                    </p>
                  </div>

                  {question.options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Answers
                      </p>
                      <ul className="space-y-2">
                        {question.options.map((option) => (
                          <li
                            key={option.id}
                            className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 p-3"
                          >
                            <Badge variant={option.isCorrect ? 'default' : 'secondary'}>
                              {option.isCorrect ? 'Correct' : 'Option'}
                            </Badge>
                            <span>{option.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="rounded-md bg-muted/20 p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Explanation</p>
                      <p className="mt-1 whitespace-pre-wrap">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attempts View - Admin Only */}
          <TestAttemptsView testId={test.id} testName={test.name} />
      </div>
    </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground/70">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SettingToggle({
  label,
  enabled,
  note,
}: {
  label: string
  enabled?: boolean
  note?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {enabled !== undefined && (
        <Badge variant={enabled ? 'default' : 'secondary'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      )}
    </div>
  )
}


