import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserMembership } from '@/lib/rbac'
import { verifyTestPassword, hashTestPassword } from '@/lib/test-security'
import { z } from 'zod'

const updateTestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(720).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  allowLateUntil: z.string().datetime().optional().nullable(),
  randomizeQuestionOrder: z.boolean().optional(),
  randomizeOptionOrder: z.boolean().optional(),
  requireFullscreen: z.boolean().optional(),
  releaseScoresAt: z.string().datetime().optional().nullable(),
  maxAttempts: z.number().int().min(1).optional().nullable(),
  scoreReleaseMode: z.enum(['NONE', 'SCORE_ONLY', 'SCORE_WITH_WRONG', 'FULL_TEST']).optional(),
})

// GET /api/tests/[testId]
export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
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
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const isAdminUser = await isAdmin(session.user.id, test.teamId)

    // Check if member has access to this test
    if (!isAdminUser && test.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Test not available' }, { status: 403 })
    }

    if (!isAdminUser) {
      // Check assignment
      const hasAccess = test.assignments.some(
        (a) =>
          a.assignedScope === 'TEAM' ||
          a.subteamId === membership.subteamId ||
          a.targetMembershipId === membership.id
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Test not assigned to you' }, { status: 403 })
      }
    }

    // Hide correct answers from non-admins
    if (!isAdminUser) {
      test.questions = test.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o, isCorrect: false })),
      }))
    }

    // Get user's attempt information
    const userAttempts = await prisma.testAttempt.findMany({
      where: {
        membershipId: membership.id,
        testId: params.testId,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        gradeEarned: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const completedAttempts = userAttempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED'
    ).length

    return NextResponse.json({
      test,
      userAttempts: isAdminUser ? null : userAttempts,
      completedAttempts: isAdminUser ? null : completedAttempts,
    })
  } catch (error) {
    console.error('Get test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tests/[testId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateTestSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can edit tests' },
        { status: 403 }
      )
    }


    // Get membership for audit
    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description
    if (validatedData.instructions !== undefined)
      updateData.instructions = validatedData.instructions
    if (validatedData.durationMinutes !== undefined)
      updateData.durationMinutes = validatedData.durationMinutes
    
    // Handle start/end time updates with validation
    const currentStartAt = test.startAt ? new Date(test.startAt) : null
    const currentEndAt = test.endAt ? new Date(test.endAt) : null
    
    const newStartAt = validatedData.startAt !== undefined
      ? (validatedData.startAt ? new Date(validatedData.startAt) : null)
      : currentStartAt
    const newEndAt = validatedData.endAt !== undefined
      ? (validatedData.endAt ? new Date(validatedData.endAt) : null)
      : currentEndAt
    
    // Validate that end time is after start time if both are set
    if (newStartAt && newEndAt && newEndAt <= newStartAt) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }
    
    if (validatedData.startAt !== undefined)
      updateData.startAt = newStartAt
    if (validatedData.endAt !== undefined)
      updateData.endAt = newEndAt
    if (validatedData.allowLateUntil !== undefined)
      updateData.allowLateUntil = validatedData.allowLateUntil
        ? new Date(validatedData.allowLateUntil)
        : null
    if (validatedData.randomizeQuestionOrder !== undefined)
      updateData.randomizeQuestionOrder = validatedData.randomizeQuestionOrder
    if (validatedData.randomizeOptionOrder !== undefined)
      updateData.randomizeOptionOrder = validatedData.randomizeOptionOrder
    if (validatedData.requireFullscreen !== undefined)
      updateData.requireFullscreen = validatedData.requireFullscreen
    if (validatedData.releaseScoresAt !== undefined)
      updateData.releaseScoresAt = validatedData.releaseScoresAt
        ? new Date(validatedData.releaseScoresAt)
        : null
    if (validatedData.maxAttempts !== undefined)
      updateData.maxAttempts = validatedData.maxAttempts
    if (validatedData.scoreReleaseMode !== undefined)
      updateData.scoreReleaseMode = validatedData.scoreReleaseMode

    const updatedTest = await prisma.test.update({
      where: { id: params.testId },
      data: updateData,
    })

    // Create audit log
    await prisma.testAudit.create({
      data: {
        testId: test.id,
        actorMembershipId: membership.id,
        action: 'UPDATE',
        details: { changes: Object.keys(updateData) },
      },
    })

    return NextResponse.json({ test: updatedTest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tests/[testId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can delete tests' },
        { status: 403 }
      )
    }

    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Create audit log before deletion
    await prisma.testAudit.create({
      data: {
        testId: test.id,
        actorMembershipId: membership.id,
        action: 'DELETE',
        details: { testName: test.name },
      },
    })

    await prisma.test.delete({
      where: { id: params.testId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

