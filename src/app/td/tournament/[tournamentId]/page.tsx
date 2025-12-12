import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { TDTournamentManageClient } from '@/components/td-tournament-manage-client'

interface Props {
  params: Promise<{ tournamentId: string }>
}

export default async function TournamentManagePage({ params }: Props) {
  const { tournamentId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/td')
  }

  // Verify the user has access to this tournament
  const request = await prisma.tournamentHostingRequest.findFirst({
    where: {
      directorEmail: {
        equals: session.user.email,
        mode: 'insensitive',
      },
      status: 'APPROVED',
      tournament: {
        id: tournamentId,
      },
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          slug: true,
          division: true,
          startDate: true,
          endDate: true,
          location: true,
          description: true,
          price: true,
        },
      },
    },
  })

  if (!request || !request.tournament) {
    notFound()
  }

  // Fetch staff for this tournament
  const staff = await prisma.tournamentStaff.findMany({
    where: {
      tournamentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      eventAssignments: {
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
        select: {
          id: true,
          name: true,
          status: true,
          eventId: true,
        },
      },
    },
    orderBy: {
      invitedAt: 'asc',
    },
  })

  // Fetch timeline items
  const timeline = await prisma.tournamentTimeline.findMany({
    where: {
      tournamentId,
    },
    orderBy: {
      dueDate: 'asc',
    },
  })

  // Fetch events for this division
  const events = await prisma.event.findMany({
    where: {
      division: request.tournament.division,
    },
    select: {
      id: true,
      name: true,
      division: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Serialize dates for client component
  const serializedTournament = {
    ...request.tournament,
    startDate: request.tournament.startDate.toISOString(),
    endDate: request.tournament.endDate.toISOString(),
  }

  const serializedStaff = staff.map(s => ({
    ...s,
    invitedAt: s.invitedAt.toISOString(),
    acceptedAt: s.acceptedAt?.toISOString() || null,
  }))

  const serializedTimeline = timeline.map(t => ({
    ...t,
    dueDate: t.dueDate.toISOString(),
  }))

  return (
    <TDTournamentManageClient
      user={session.user}
      tournament={serializedTournament}
      initialStaff={serializedStaff}
      initialTimeline={serializedTimeline}
      events={events}
    />
  )
}

