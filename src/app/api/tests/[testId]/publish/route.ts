import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserMembership } from '@/lib/rbac'
import { hashTestPassword } from '@/lib/test-security'
import { z } from 'zod'

const publishSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  testPassword: z.string().min(6).optional(),
  releaseScoresAt: z.string().datetime().optional(),
  sendEmails: z.boolean().optional(),
})

// POST /api/tests/[testId]/publish
export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = publishSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        questions: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can publish tests' },
        { status: 403 }
      )
    }

    // Check if test has questions
    if (test.questions.length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish test without questions' },
        { status: 400 }
      )
    }

    // Validate dates
    const startAt = new Date(validatedData.startAt)
    const endAt = new Date(validatedData.endAt)
    if (endAt <= startAt) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Hash test password if provided
    const testPasswordHash = validatedData.testPassword
      ? await hashTestPassword(validatedData.testPassword)
      : null

    // Get membership for audit
    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Update test status, scheduling, password, and score release
    const updatedTest = await prisma.test.update({
      where: { id: params.testId },
      data: {
        status: 'PUBLISHED',
        startAt,
        endAt,
        testPasswordHash,
        releaseScoresAt: validatedData.releaseScoresAt
          ? new Date(validatedData.releaseScoresAt)
          : null,
      },
    })

    // Create audit log
    await prisma.testAudit.create({
      data: {
        testId: test.id,
        actorMembershipId: membership.id,
        action: 'PUBLISH',
        details: {
          testName: test.name,
          questionCount: test.questions.length,
        },
      },
    })

    // TODO: Send emails if sendEmails is true
    // Get assignments and send notifications to assigned users

    return NextResponse.json({ test: updatedTest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Publish test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

