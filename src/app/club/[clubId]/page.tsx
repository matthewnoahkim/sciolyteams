import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeamPage } from '@/components/team-page'
import { Suspense } from 'react'
import { PageLoading } from '@/components/ui/loading-spinner'

// Enable ISR (Incremental Static Regeneration) for faster page loads
// Revalidate every 60 seconds in production
export const revalidate = 60

export default async function TeamDetailPage({ params }: { params: { clubId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Check membership
  const membership = await prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId: params.clubId,
      },
    },
  })

  if (!membership) {
    redirect('/dashboard')
  }

  const team = await prisma.team.findUnique({
    where: { id: params.clubId },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          subteam: true,
          rosterAssignments: {
            include: {
              event: true,
            },
          },
        },
      },
      subteams: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              rosterAssignments: true,
            },
          },
        },
      },
    },
  })

  if (!team) {
    redirect('/dashboard')
  }

  // Fetch all tab data in parallel for instant loading
  const [attendances, expenses, purchaseRequests, eventBudgets, calendarEvents, tests] = await Promise.all([
    // Attendance data
    prisma.attendance.findMany({
      where: { calendarEvent: { teamId: params.clubId } },
      include: {
        calendarEvent: {
          include: {
            subteam: true,
          },
        },
        checkIns: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            checkIns: true,
          },
        },
      },
      orderBy: {
        calendarEvent: {
          startUTC: 'desc',
        },
      },
    }),
    // Expenses data
    prisma.expense.findMany({
      where: { teamId: params.clubId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
        purchaseRequest: {
          select: {
            id: true,
            requesterId: true,
            description: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    }),
    // Purchase requests data
    prisma.purchaseRequest.findMany({
      where: { teamId: params.clubId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    // Event budgets data
    prisma.eventBudget.findMany({
      where: { teamId: params.clubId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            division: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    // Calendar events data
    prisma.calendarEvent.findMany({
      where: { teamId: params.clubId },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        startUTC: 'desc',
      },
    }),
    // Tests data
    prisma.test.findMany({
      where: { teamId: params.clubId },
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
        allowCalculator: true,
        calculatorType: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

  // Calculate budget totals (same logic as API)
  const budgetsWithTotals = await Promise.all(
    eventBudgets.map(async (budget) => {
      const totalSpent = await prisma.expense.aggregate({
        where: {
          teamId: params.clubId,
          eventId: budget.eventId,
          ...(budget.subteamId && {
            addedBy: {
              subteamId: budget.subteamId,
            },
          }),
        },
        _sum: {
          amount: true,
        },
      })

      const totalRequested = await prisma.purchaseRequest.aggregate({
        where: {
          teamId: params.clubId,
          eventId: budget.eventId,
          status: 'PENDING',
          ...(budget.subteamId && {
            subteamId: budget.subteamId,
          }),
        },
        _sum: {
          estimatedAmount: true,
        },
      })

      const spent = totalSpent._sum.amount || 0
      const requested = totalRequested._sum.estimatedAmount || 0
      const remaining = budget.maxBudget - spent - requested

      return {
        ...budget,
        totalSpent: spent,
        totalRequested: requested,
        remaining,
      }
    })
  )

  return (
    <Suspense fallback={
      <PageLoading 
        title="Loading club" 
        description="Fetching team data and member information..." 
        variant="orbit" 
      />
    }>
      <TeamPage
        team={team}
        currentMembership={membership}
        user={session.user}
        initialData={{
          attendances,
          expenses,
          purchaseRequests,
          eventBudgets: budgetsWithTotals,
          calendarEvents,
          tests,
        }}
      />
    </Suspense>
  )
}

