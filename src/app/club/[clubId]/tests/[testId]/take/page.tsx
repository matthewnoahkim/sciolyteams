import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isAdmin } from '@/lib/rbac'
import { isTestAvailable } from '@/lib/test-security'
import { TakeTestClient } from '@/components/tests/take-test-client'

export default async function TakeTestPage({
  params,
}: {
  params: { clubId: string; testId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const membership = await getUserMembership(session.user.id, params.clubId)
  if (!membership) {
    redirect('/dashboard')
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
      startAt: true,
      endAt: true,
      allowLateUntil: true,
      requireFullscreen: true,
      allowCalculator: true,
      calculatorType: true,
      testPasswordHash: true,
      maxAttempts: true,
      scoreReleaseMode: true,
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

  const isAdminUser = await isAdmin(session.user.id, params.clubId)

  // Admins can take any test, but members need proper access
  if (!isAdminUser) {
    // Check if test is published
    if (test.status !== 'PUBLISHED') {
      redirect(`/club/${params.clubId}?tab=tests`)
    }

    // Check if test is available (scheduling)
    const availability = isTestAvailable(test)
    if (!availability.available) {
      redirect(`/club/${params.clubId}?tab=tests`)
    }

    // Get user's event assignments from roster for event-based test access
    const userEventAssignments = await prisma.rosterAssignment.findMany({
      where: {
        membershipId: membership.id,
        subteam: { teamId: params.clubId },
      },
      select: { eventId: true },
    })
    const userEventIds = userEventAssignments.map(ra => ra.eventId)

    // Check assignment - must match logic in API routes
    // If test has no assignments, user cannot access it
    if (test.assignments.length === 0) {
      redirect(`/club/${params.clubId}?tab=tests`)
    }

    const hasAccess = test.assignments.some(
      (a) =>
        // CLUB scope - everyone in the club gets access
        a.assignedScope === 'CLUB' ||
        // Subteam-based - user's primary subteam matches assignment's subteam
        (a.subteamId && membership.subteamId && a.subteamId === membership.subteamId) ||
        // PERSONAL scope - directly assigned to this user
        a.targetMembershipId === membership.id ||
        // Event-based assignments - user must have the event in their roster
        (a.eventId && userEventIds.includes(a.eventId))
    )

    if (!hasAccess) {
      redirect(`/club/${params.clubId}?tab=tests`)
    }
  }

  // Check for existing in-progress or not-started attempt
  const existingAttempt = await prisma.testAttempt.findFirst({
    where: {
      membershipId: membership.id,
      testId: test.id,
      status: {
        in: ['NOT_STARTED', 'IN_PROGRESS'],
      },
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
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <TakeTestClient
      test={test}
      membership={membership}
      existingAttempt={existingAttempt}
      isAdmin={isAdminUser}
    />
  )
}

