import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserMembership } from '@/lib/rbac'
import { hashTestPassword } from '@/lib/test-security'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const questionOptionSchema = z.object({
  label: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number().int().min(0),
})

const questionSchema = z.object({
  type: z.enum(['MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_TEXT', 'LONG_TEXT', 'NUMERIC']),
  promptMd: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().min(0),
  order: z.number().int().min(0),
  sectionId: z.string().optional(),
  shuffleOptions: z.boolean().optional(),
  numericTolerance: z.number().min(0).optional(),
  options: z.array(questionOptionSchema).optional(),
})

const assignmentSchema = z
  .object({
    assignedScope: z.enum(['TEAM', 'SUBTEAM', 'PERSONAL']),
    subteamId: z.string().optional(),
    targetMembershipId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.assignedScope === 'SUBTEAM' && !value.subteamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'subteamId is required when assignedScope is SUBTEAM',
        path: ['subteamId'],
      })
    }
    if (value.assignedScope === 'PERSONAL' && !value.targetMembershipId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetMembershipId is required when assignedScope is PERSONAL',
        path: ['targetMembershipId'],
      })
    }
  })

type AssignmentInput = z.infer<typeof assignmentSchema>
type QuestionInput = z.infer<typeof questionSchema>

const createTestSchema = z.object({
  teamId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(720),
  randomizeQuestionOrder: z.boolean().optional(),
  randomizeOptionOrder: z.boolean().optional(),
  requireFullscreen: z.boolean().optional(),
  releaseScoresAt: z.string().datetime().optional(),
  maxAttempts: z.number().int().min(1).optional(),
  scoreReleaseMode: z.enum(['SCORE_ONLY', 'SCORE_WITH_WRONG', 'FULL_TEST']).optional(),
  assignments: z.array(assignmentSchema).optional(),
  questions: z.array(questionSchema).optional(),
})

// GET /api/tests?teamId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const membership = await getUserMembership(session.user.id, teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const isAdminUser = await isAdmin(session.user.id, teamId)

    const where: Prisma.TestWhereInput = {
      teamId,
    }

    if (!isAdminUser) {
      where.status = 'PUBLISHED'
      where.OR = [
        {
          assignments: {
            some: {
              OR: [
                { assignedScope: 'TEAM' },
                { subteamId: membership.subteamId },
                { targetMembershipId: membership.id },
              ],
            },
          },
        },
        {
          assignments: {
            none: {},
          },
        },
      ]
    }

    // Admins see all tests; members see published tests for them or unassigned ones
    const tests = await prisma.test.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        durationMinutes: true,
        startAt: true,
        endAt: true,
        allowLateUntil: true,
        requireFullscreen: true,
        releaseScoresAt: true,
        maxAttempts: true,
        scoreReleaseMode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Get tests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tests
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createTestSchema.parse(body)

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, validatedData.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can create tests' },
        { status: 403 }
      )
    }

    // Get membership ID
    const membership = await getUserMembership(session.user.id, validatedData.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    const {
      assignments,
      questions,
      teamId,
      name,
      description,
      instructions,
      durationMinutes,
      randomizeQuestionOrder,
      randomizeOptionOrder,
      requireFullscreen,
      releaseScoresAt,
      maxAttempts,
      scoreReleaseMode,
    } = validatedData

    const createdTest = await prisma.$transaction(async (tx) => {
      const baseTest = await tx.test.create({
        data: {
          teamId,
          name,
          description,
          instructions,
          status: 'DRAFT',
          durationMinutes,
          randomizeQuestionOrder: randomizeQuestionOrder ?? false,
          randomizeOptionOrder: randomizeOptionOrder ?? false,
          requireFullscreen: requireFullscreen ?? true,
          releaseScoresAt: releaseScoresAt ? new Date(releaseScoresAt) : null,
          maxAttempts: maxAttempts ?? null,
          scoreReleaseMode: scoreReleaseMode ?? 'FULL_TEST',
          createdByMembershipId: membership.id,
        },
      })

      const assignmentPayload: AssignmentInput[] =
        assignments && assignments.length > 0
          ? assignments
          : [{ assignedScope: 'TEAM', subteamId: undefined, targetMembershipId: undefined }]

      await tx.testAssignment.createMany({
        data: assignmentPayload.map((assignment) => ({
          testId: baseTest.id,
          assignedScope: assignment.assignedScope,
          subteamId: assignment.subteamId ?? null,
          targetMembershipId: assignment.targetMembershipId ?? null,
        })),
      })

      if (questions && questions.length > 0) {
        for (const question of questions) {
          const createdQuestion = await tx.question.create({
            data: {
              testId: baseTest.id,
              sectionId: question.sectionId,
              type: question.type,
              promptMd: question.promptMd,
              explanation: question.explanation,
              points: new Prisma.Decimal(question.points),
              order: question.order,
              shuffleOptions: question.shuffleOptions ?? false,
              numericTolerance:
                question.numericTolerance !== undefined
                  ? new Prisma.Decimal(question.numericTolerance)
                  : undefined,
            },
          })

          if (question.options && question.options.length > 0) {
            await tx.questionOption.createMany({
              data: question.options.map((opt) => ({
                questionId: createdQuestion.id,
                label: opt.label,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            })
          }
        }
      }

      await tx.testAudit.create({
        data: {
          testId: baseTest.id,
          actorMembershipId: membership.id,
          action: 'CREATE',
          details: { testName: baseTest.name },
        },
      })

      return tx.test.findUniqueOrThrow({
        where: { id: baseTest.id },
        include: {
          assignments: true,
          questions: {
            orderBy: { order: 'asc' },
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      })
    })

    return NextResponse.json({ test: createdTest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

