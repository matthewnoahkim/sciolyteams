import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCaptain, getUserMembership } from '@/lib/rbac'
import { hashTestPassword } from '@/lib/test-security'
import { z } from 'zod'

const createTestSchema = z.object({
  teamId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(720),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  allowLateUntil: z.string().datetime().optional(),
  randomizeQuestionOrder: z.boolean().optional(),
  randomizeOptionOrder: z.boolean().optional(),
  requireFullscreen: z.boolean().optional(),
  requirePasswordToEdit: z.boolean().optional(),
  adminPassword: z.string().min(6).optional(),
  releaseScoresAt: z.string().datetime().optional(),
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

    const isCpt = await isCaptain(session.user.id, teamId)

    // Captains see all tests; members see only published tests they're assigned to
    const tests = await prisma.test.findMany({
      where: {
        teamId,
        ...(isCpt
          ? {}
          : {
              status: 'PUBLISHED',
              assignments: {
                some: {
                  OR: [
                    { assignedScope: 'TEAM' },
                    { subteamId: membership.subteamId },
                    { targetMembershipId: membership.id },
                  ],
                },
              },
            }),
      },
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

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, validatedData.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can create tests' },
        { status: 403 }
      )
    }

    // Get membership ID
    const membership = await getUserMembership(session.user.id, validatedData.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Hash admin password if provided
    const adminPasswordHash = validatedData.adminPassword
      ? await hashTestPassword(validatedData.adminPassword)
      : null

    // Create test
    const test = await prisma.test.create({
      data: {
        teamId: validatedData.teamId,
        name: validatedData.name,
        description: validatedData.description,
        instructions: validatedData.instructions,
        status: 'DRAFT',
        durationMinutes: validatedData.durationMinutes,
        startAt: validatedData.startAt ? new Date(validatedData.startAt) : null,
        endAt: validatedData.endAt ? new Date(validatedData.endAt) : null,
        allowLateUntil: validatedData.allowLateUntil
          ? new Date(validatedData.allowLateUntil)
          : null,
        randomizeQuestionOrder: validatedData.randomizeQuestionOrder ?? false,
        randomizeOptionOrder: validatedData.randomizeOptionOrder ?? false,
        requireFullscreen: validatedData.requireFullscreen ?? true,
        requirePasswordToEdit: validatedData.requirePasswordToEdit ?? true,
        adminPasswordHash,
        releaseScoresAt: validatedData.releaseScoresAt
          ? new Date(validatedData.releaseScoresAt)
          : null,
        createdByMembershipId: membership.id,
      },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.testAudit.create({
      data: {
        testId: test.id,
        actorMembershipId: membership.id,
        action: 'CREATE',
        details: { testName: test.name },
      },
    })

    return NextResponse.json({ test }, { status: 201 })
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

