import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isAdmin } from '@/lib/rbac'
import { isTestAvailable, getClientIp, generateClientFingerprint, verifyTestPassword } from '@/lib/test-security'

// POST /api/tests/[testId]/attempts/start
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
    const { fingerprint, testPassword } = body

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: {
        assignments: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, test.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Check if user is admin (admins bypass password)
    const isAdminUser = await isAdmin(session.user.id, test.teamId)

    // Verify test password if required (non-admins only)
    if (!isAdminUser && test.testPasswordHash) {
      if (!testPassword) {
        return NextResponse.json(
          { error: 'NEED_TEST_PASSWORD', message: 'Test password required' },
          { status: 401 }
        )
      }
      const isValid = await verifyTestPassword(
        test.testPasswordHash,
        testPassword
      )
      if (!isValid) {
        return NextResponse.json(
          { error: 'NEED_TEST_PASSWORD', message: 'Invalid test password' },
          { status: 401 }
        )
      }
    }

    // Check if test is available
    const availability = isTestAvailable(test)
    if (!availability.available) {
      return NextResponse.json(
        { error: availability.reason },
        { status: 403 }
      )
    }

    // Check assignment (admins bypass this check)
    if (!isAdminUser) {
      const hasAccess = test.assignments.some(
        (a) =>
          a.assignedScope === 'CLUB' ||
          a.subteamId === membership.subteamId ||
          a.targetMembershipId === membership.id
      )

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Test not assigned to you' },
          { status: 403 }
        )
      }
    }

    // Check for existing in-progress or not-started attempt
    let attempt = await prisma.testAttempt.findFirst({
      where: {
          membershipId: membership.id,
          testId: params.testId,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS'],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (attempt) {
      // Resume existing attempt
      return NextResponse.json({ attempt })
    }

    // Check maxAttempts (if set) - count all completed attempts
    if (test.maxAttempts !== null && !isAdminUser) {
      const completedAttempts = await prisma.testAttempt.count({
        where: {
          membershipId: membership.id,
          testId: params.testId,
          status: {
            in: ['SUBMITTED', 'GRADED'],
          },
        },
      })

      if (completedAttempts >= test.maxAttempts) {
        return NextResponse.json(
          {
            error: 'Maximum attempts reached',
            message: `You have reached the maximum number of attempts (${test.maxAttempts}) for this test`,
          },
          { status: 403 }
        )
      }
    }

    // Create new attempt
    const ipAddress = getClientIp(req.headers)
    const userAgent = req.headers.get('user-agent')

    attempt = await prisma.testAttempt.create({
      data: {
        testId: params.testId,
        membershipId: membership.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        clientFingerprintHash: fingerprint || null,
        ipAtStart: ipAddress,
        userAgentAtStart: userAgent,
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('Start attempt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


