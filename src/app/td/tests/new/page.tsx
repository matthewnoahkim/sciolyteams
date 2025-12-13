import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewTestBuilder } from '@/components/tests/new-test-builder'
import { nanoid } from 'nanoid'

interface Props {
  searchParams: Promise<{ eventId?: string; tournamentId?: string }>
}

// Helper to check if user is a tournament director for a tournament
async function isTournamentDirector(userId: string, userEmail: string, tournamentId: string): Promise<boolean> {
  // Check if user is tournament admin
  const admin = await prisma.tournamentAdmin.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
  })
  
  if (admin) return true
  
  // Check if user created the tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { createdById: true },
  })
  
  if (tournament?.createdById === userId) return true
  
  // Check if user is the director on the hosting request
  const hostingRequest = await prisma.tournamentHostingRequest.findFirst({
    where: {
      tournament: {
        id: tournamentId,
      },
      directorEmail: {
        equals: userEmail,
        mode: 'insensitive',
      },
      status: 'APPROVED',
    },
  })
  
  return !!hostingRequest
}

export default async function TDNewTestPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/td')
  }

  const { eventId, tournamentId } = await searchParams

  if (!tournamentId) {
    redirect('/td')
  }

  // Verify user is a tournament director for this tournament
  const isTD = await isTournamentDirector(session.user.id, session.user.email, tournamentId)
  
  if (!isTD) {
    redirect('/td')
  }

  // Get tournament info
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      division: true,
    },
  })
  
  if (!tournament) {
    redirect('/td')
  }

  // Get event info if eventId is provided
  let event = null
  if (eventId) {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
      },
    })
  }

  // For TD test creation, we need to either:
  // 1. Create a temporary staff membership, or
  // 2. Use an existing staff membership if one exists, or
  // 3. Use a placeholder/dummy staff membership ID
  
  // Check if TD has an existing staff membership (some TDs might also be staff)
  const existingStaff = await prisma.tournamentStaff.findFirst({
    where: {
      tournamentId,
      OR: [
        { userId: session.user.id },
        { email: { equals: session.user.email, mode: 'insensitive' } },
      ],
      status: 'ACCEPTED',
    },
    select: {
      id: true,
    },
  })

  // If no existing staff membership, we'll create one on-the-fly when saving the test
  // For now, we'll use a placeholder. The API will handle creating/using the appropriate staff membership.
  // Actually, let's create a staff membership if it doesn't exist, so the test builder has what it needs.
  let staffMembershipId = existingStaff?.id
  
  if (!staffMembershipId) {
    // Create a staff membership for the TD if one doesn't exist
    // This allows TDs to create tests without being explicitly added as staff
    const inviteToken = nanoid(32)
    const newStaff = await prisma.tournamentStaff.create({
      data: {
        tournamentId,
        email: session.user.email,
        name: session.user.name,
        role: 'TOURNAMENT_DIRECTOR',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        userId: session.user.id,
        inviteToken,
        ...(eventId && {
          events: {
            create: {
              eventId,
            },
          },
        }),
      },
      select: {
        id: true,
      },
    })
    staffMembershipId = newStaff.id
  } else if (eventId) {
    // If staff membership exists but doesn't have this event, add it
    const staffWithEvent = await prisma.tournamentStaff.findFirst({
      where: {
        id: staffMembershipId,
        events: {
          some: {
            eventId,
          },
        },
      },
    })
    
    if (!staffWithEvent) {
      await prisma.eventSupervisorAssignment.create({
        data: {
          staffId: staffMembershipId,
          eventId,
        },
      })
    }
  }

  return (
    <NewTestBuilder
      esMode={true}
      staffMembershipId={staffMembershipId}
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      tournamentDivision={tournament.division}
      eventId={event?.id}
      eventName={event?.name}
    />
  )
}

