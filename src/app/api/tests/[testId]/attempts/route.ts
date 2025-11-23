import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/rbac'

// GET /api/tests/[testId]/attempts
// Admin-only endpoint to view all attempts for a test
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
      select: {
        id: true,
        teamId: true,
        name: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can view test attempts' },
        { status: 403 }
      )
    }

    // Get all attempts for this test with full details
    const attempts = await prisma.testAttempt.findMany({
      where: { testId: params.testId },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: {
            question: {
              order: 'asc',
            },
          },
        },
        proctorEvents: {
          orderBy: {
            ts: 'asc',
          },
        },
        gradeAdjustments: {
          include: {
            attempt: false,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // Get membership info for each attempt
    const membershipIds = [...new Set(attempts.map((a) => a.membershipId))]
    const memberships = await prisma.membership.findMany({
      where: {
        id: { in: membershipIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const membershipMap = new Map(memberships.map((m) => [m.id, m]))

    // Attach membership info to each attempt
    const attemptsWithUsers = attempts.map((attempt) => ({
      ...attempt,
      membership: membershipMap.get(attempt.membershipId) || null,
    }))

    return NextResponse.json({ attempts: attemptsWithUsers })
  } catch (error) {
    console.error('Get test attempts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

