import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { TDTournamentManageClient } from '@/components/td-tournament-manage-client'

interface Props {
  params: Promise<{ requestId: string }>
}

export default async function TournamentManageByRequestPage({ params }: Props) {
  const { requestId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/td')
  }

  // Fetch the hosting request and verify ownership
  const request = await prisma.tournamentHostingRequest.findFirst({
    where: {
      id: requestId,
      directorEmail: {
        equals: session.user.email,
        mode: 'insensitive',
      },
      status: 'APPROVED',
    },
    include: {
      tournament: true,
    },
  })

  if (!request) {
    notFound()
  }

  // If no tournament exists, create one
  let tournament = request.tournament
  if (!tournament) {
    // Generate a slug from the tournament name
    const baseSlug = request.preferredSlug || 
      request.tournamentName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    
    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    while (await prisma.tournament.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Determine division - handle "B&C" case
    let division: 'B' | 'C' = 'C'
    if (request.division === 'B') {
      division = 'B'
    } else if (request.division === 'C') {
      division = 'C'
    }

    // Create the tournament
    tournament = await prisma.tournament.create({
      data: {
        name: request.tournamentName,
        slug,
        division,
        description: request.otherNotes,
        isOnline: request.tournamentFormat === 'satellite',
        startDate: new Date(),
        endDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        location: request.location,
        approved: true,
        createdById: session.user.id,
        hostingRequestId: requestId,
      },
    })
  }

  // Fetch staff for this tournament
  const staff = await prisma.tournamentStaff.findMany({
    where: {
      tournamentId: tournament.id,
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
      tournamentId: tournament.id,
    },
    orderBy: {
      dueDate: 'asc',
    },
  })

  // Fetch events for this division
  const events = await prisma.event.findMany({
    where: {
      division: tournament.division,
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
    id: tournament.id,
    name: tournament.name,
    slug: tournament.slug,
    division: tournament.division,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
    startTime: tournament.startTime.toISOString(),
    endTime: tournament.endTime.toISOString(),
    location: tournament.location,
    description: tournament.description,
    isOnline: tournament.isOnline,
    price: tournament.price,
    additionalTeamPrice: tournament.additionalTeamPrice,
    feeStructure: tournament.feeStructure,
    registrationStartDate: tournament.registrationStartDate?.toISOString() || null,
    registrationEndDate: tournament.registrationEndDate?.toISOString() || null,
    earlyBirdDiscount: tournament.earlyBirdDiscount,
    earlyBirdDeadline: tournament.earlyBirdDeadline?.toISOString() || null,
    lateFee: tournament.lateFee,
    lateFeeStartDate: tournament.lateFeeStartDate?.toISOString() || null,
    otherDiscounts: tournament.otherDiscounts,
    eligibilityRequirements: tournament.eligibilityRequirements,
    eventsRun: tournament.eventsRun,
    level: request.tournamentLevel || null,
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

