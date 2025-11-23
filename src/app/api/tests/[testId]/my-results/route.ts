import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isAdmin } from '@/lib/rbac'
import { areScoresReleased, filterAttemptDataByVisibility } from '@/lib/test-security'

// GET /api/tests/[testId]/my-results
// Get the current user's test results (filtered by release settings)
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
        releaseScoresAt: true,
        scoreReleaseVisibility: true,
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

    // Get the most recent completed attempt
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        membershipId: membership.id,
        testId: params.testId,
        status: {
          in: ['SUBMITTED', 'GRADED'],
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
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
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'No completed attempt found' }, { status: 404 })
    }

    // Filter data based on release settings
    const filteredData = filterAttemptDataByVisibility(attempt, test, isAdminUser)

    return NextResponse.json({
      test: {
        id: test.id,
        name: test.name,
        releaseScoresAt: test.releaseScoresAt,
        scoreReleaseVisibility: test.scoreReleaseVisibility,
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        ...filteredData,
      },
      scoresReleased: areScoresReleased(test),
    })
  } catch (error) {
    console.error('Get my results error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

