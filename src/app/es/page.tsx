import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ESPortalClient } from '@/components/es-portal-client'
import { ESLoginClient } from '@/components/es-login-client'

interface ESPortalPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ESPortalPage({ searchParams }: ESPortalPageProps) {
  const { token } = await searchParams
  const session = await getServerSession(authOptions)

  // If there's a token, fetch invite info for display
  let inviteInfo = null
  if (token) {
    inviteInfo = await prisma.tournamentStaff.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tournament: {
          select: {
            id: true,
            name: true,
            division: true,
            startDate: true,
            endDate: true,
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  }

  // If not signed in, show login page with invite info if available
  if (!session?.user?.email) {
    // Serialize dates to strings for client component
    const serializedInviteInfo = inviteInfo ? {
      ...inviteInfo,
      tournament: {
        ...inviteInfo.tournament,
        startDate: inviteInfo.tournament.startDate.toISOString(),
        endDate: inviteInfo.tournament.endDate.toISOString(),
      },
    } : null
    return <ESLoginClient inviteInfo={serializedInviteInfo} token={token} />
  }

  // If there's a token, try to accept the invitation
  if (token && inviteInfo && inviteInfo.status === 'PENDING') {
    // Check if the email matches
    if (inviteInfo.email.toLowerCase() === session.user.email.toLowerCase()) {
      // Accept the invitation
      await prisma.tournamentStaff.update({
        where: { id: inviteInfo.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          userId: session.user.id,
          name: inviteInfo.name || session.user.name,
        },
      })
    }
  }

  // Check if the user has any staff memberships
  const staffMemberships = await prisma.tournamentStaff.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { email: { equals: session.user.email, mode: 'insensitive' } },
      ],
      status: 'ACCEPTED',
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          division: true,
          startDate: true,
        },
      },
      events: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              division: true,
            },
          },
        },
      },
      tests: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
    orderBy: {
      tournament: {
        startDate: 'asc',
      },
    },
  })

  // If no memberships found, show unauthorized message
  if (staffMemberships.length === 0) {
    // Check if there's a pending invitation for this email
    const pendingInvite = await prisma.tournamentStaff.findFirst({
      where: {
        email: { equals: session.user.email, mode: 'insensitive' },
        status: 'PENDING',
      },
    })

    // If there's a pending invite that matches but wasn't auto-accepted (edge case), show appropriate message
    if (pendingInvite && pendingInvite.inviteToken === token) {
      // The email didn't match but there's an invite - redirect to correct flow
      // Serialize dates to strings for client component
      const serializedInviteInfo = inviteInfo ? {
        ...inviteInfo,
        tournament: {
          ...inviteInfo.tournament,
          startDate: inviteInfo.tournament.startDate.toISOString(),
          endDate: inviteInfo.tournament.endDate.toISOString(),
        },
      } : null
      return <ESLoginClient unauthorized email={session.user.email} inviteInfo={serializedInviteInfo} token={token} />
    }

    return <ESLoginClient unauthorized email={session.user.email} />
  }

  // Serialize and map to StaffMembership interface
  const serializedStaffMemberships = staffMemberships.map(membership => ({
    id: membership.id,
    email: membership.email,
    name: membership.name,
    role: membership.role,
    status: membership.status,
    invitedAt: membership.invitedAt.toISOString(),
    acceptedAt: membership.acceptedAt?.toISOString() || null,
    tournament: {
      id: membership.tournament.id,
      name: membership.tournament.name,
      division: membership.tournament.division,
      startDate: membership.tournament.startDate.toISOString(),
    },
    events: membership.events.map(e => ({
      event: {
        id: e.event.id,
        name: e.event.name,
        division: e.event.division,
      },
    })),
    tests: membership.tests.map(test => ({
      id: test.id,
      name: test.name,
      status: test.status,
      eventId: test.eventId,
      event: test.event ? {
        id: test.event.id,
        name: test.event.name,
      } : null,
      questions: test.questions.map(q => ({
        id: q.id,
        type: q.type,
        promptMd: q.promptMd,
        points: Number(q.points),
        order: q.order,
        options: q.options.map(o => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
      })),
    })),
  }))

  return <ESPortalClient user={session.user} staffMemberships={serializedStaffMemberships} />
}

