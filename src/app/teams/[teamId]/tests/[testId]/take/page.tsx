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
  params: { teamId: string; testId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const membership = await getUserMembership(session.user.id, params.teamId)
  if (!membership) {
    redirect('/teams')
  }

  const test = await prisma.test.findFirst({
    where: {
      id: params.testId,
      teamId: params.teamId,
    },
    include: {
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

  const isAdminUser = await isAdmin(session.user.id, params.teamId)

  // Admins can take any test, but members need proper access
  if (!isAdminUser) {
    // Check if test is published
    if (test.status !== 'PUBLISHED') {
      redirect(`/teams/${params.teamId}?tab=tests`)
    }

    // Check if test is available (scheduling)
    const availability = isTestAvailable(test)
    if (!availability.available) {
      redirect(`/teams/${params.teamId}?tab=tests`)
    }

    // Check assignment
    const hasAccess = test.assignments.length === 0 || test.assignments.some(
      (a) =>
        a.assignedScope === 'TEAM' ||
        a.subteamId === membership.subteamId ||
        a.targetMembershipId === membership.id
    )

    if (!hasAccess) {
      redirect(`/teams/${params.teamId}?tab=tests`)
    }
  }

  // Check for existing attempt
  const existingAttempt = await prisma.testAttempt.findUnique({
    where: {
      membershipId_testId: {
        membershipId: membership.id,
        testId: test.id,
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

