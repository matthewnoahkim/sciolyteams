import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ESPortalClient } from '@/components/es-portal-client'
import { ESLoginClient } from '@/components/es-login-client'
import { Suspense } from 'react'

interface ESPortalPageProps {
  searchParams: Promise<{ token?: string; tournament?: string }>
}

export default async function ESPortalPage({ searchParams }: ESPortalPageProps) {
  const { token, tournament } = await searchParams
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
            hostingRequestId: true,
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
    // Get hosting request division for display if available (as string, since hosting request supports "B&C")
    let displayDivision: string | undefined = inviteInfo?.tournament?.division
    if (inviteInfo?.tournament?.hostingRequestId) {
      const hostingRequest = await prisma.tournamentHostingRequest.findUnique({
        where: { id: inviteInfo.tournament.hostingRequestId },
        select: { division: true },
      })
      if (hostingRequest?.division) {
        displayDivision = hostingRequest.division
      }
    }
    
    // Serialize dates to strings for client component
    const serializedInviteInfo = inviteInfo ? {
      ...inviteInfo,
      tournament: {
        ...inviteInfo.tournament,
        division: displayDivision || inviteInfo.tournament.division,
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
            hostingRequestId: true,
            slug: true,
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
          orderBy: {
            event: {
              name: 'asc',
            },
          },
        },
      // Tests will be fetched separately via API organized by event
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
      // Get hosting request division for display if available (as string, since hosting request supports "B&C")
      let displayDivision: string | undefined = inviteInfo?.tournament?.division
      if (inviteInfo?.tournament?.hostingRequestId) {
        const hostingRequest = await prisma.tournamentHostingRequest.findUnique({
          where: { id: inviteInfo.tournament.hostingRequestId },
          select: { division: true },
        })
        if (hostingRequest?.division) {
          displayDivision = hostingRequest.division
        }
      }
      
      // The email didn't match but there's an invite - redirect to correct flow
      // Serialize dates to strings for client component
      const serializedInviteInfo = inviteInfo ? {
        ...inviteInfo,
        tournament: {
          ...inviteInfo.tournament,
          division: displayDivision || inviteInfo.tournament.division,
          startDate: inviteInfo.tournament.startDate.toISOString(),
          endDate: inviteInfo.tournament.endDate.toISOString(),
        },
      } : null
      return <ESLoginClient unauthorized email={session.user.email} inviteInfo={serializedInviteInfo} token={token} />
    }

    return <ESLoginClient unauthorized email={session.user.email} />
  }

  // Prefetch timelines server-side so the first paint isn't empty
  const timelineEntries = await Promise.all(
    staffMemberships.map(async membership => {
      const items = await prisma.tournamentTimeline.findMany({
        where: { tournamentId: membership.tournament.id },
        orderBy: { dueDate: 'asc' },
      })
      return [membership.tournament.id, items] as const
    })
  )

  const initialTimelines = Object.fromEntries(
    timelineEntries.map(([tournamentId, items]) => [
      tournamentId,
      items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        dueDate: item.dueDate.toISOString(),
        type: item.type,
      })),
    ])
  )

  // Prefetch tests server-side to eliminate loading delay
  // Get all event IDs that the user is assigned to
  const userEventIds = new Set<string>()
  staffMemberships.forEach(membership => {
    membership.events.forEach(e => userEventIds.add(e.event.id))
  })

  // Fetch all tests for events the user is assigned to (collaborative access)
  const tournamentIds = staffMemberships.map(m => m.tournament.id)
  const eventIdsArray = Array.from(userEventIds)
  
  const allTests = eventIdsArray.length > 0 ? await prisma.eSTest.findMany({
    where: {
      tournamentId: { in: tournamentIds },
      eventId: { in: eventIdsArray },
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  }) : []

  // Organize tests by tournament and event
  const testsByTournament = new Map<string, Map<string, typeof allTests>>()
  
  for (const test of allTests) {
    if (!test.eventId) continue
    
    if (!testsByTournament.has(test.tournamentId)) {
      testsByTournament.set(test.tournamentId, new Map())
    }
    const testsByEvent = testsByTournament.get(test.tournamentId)!
    
    if (!testsByEvent.has(test.eventId)) {
      testsByEvent.set(test.eventId, [])
    }
    testsByEvent.get(test.eventId)!.push(test)
  }

  // Get hosting request divisions for all tournaments
  const hostingRequests = await prisma.tournamentHostingRequest.findMany({
    where: {
      tournament: {
        id: { in: tournamentIds },
      },
    },
    select: {
      id: true,
      division: true,
      tournament: {
        select: {
          id: true,
        },
      },
    },
  })
  const hostingRequestMap = new Map(
    hostingRequests
      .filter(hr => hr.tournament !== null)
      .map(hr => [hr.tournament!.id, hr.division])
  )

  // Map staff memberships with tests organized by event
  const staffMembershipsWithTests = staffMemberships.map(membership => {
    // Use hosting request division for display if available (supports "B&C")
    const displayDivision = hostingRequestMap.get(membership.tournament.id) || membership.tournament.division
    
    return {
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
        division: displayDivision,
        startDate: membership.tournament.startDate.toISOString(),
        slug: membership.tournament.slug,
      },
      events: [...membership.events].sort((a, b) => a.event.name.localeCompare(b.event.name)).map(e => {
        // Look for tests for this event across ALL tournaments the user has access to
        let eventTests: typeof allTests = []
        for (const [tournamentId, eventMap] of testsByTournament.entries()) {
          const testsForEventInTournament = eventMap.get(e.event.id) || []
          eventTests = [...eventTests, ...testsForEventInTournament]
        }
        
        return {
          event: {
            id: e.event.id,
            name: e.event.name,
            division: e.event.division,
          },
          tests: eventTests.map(test => ({
            id: test.id,
            name: test.name,
            status: test.status,
            eventId: test.eventId,
            createdAt: test.createdAt.toISOString(),
            updatedAt: test.updatedAt.toISOString(),
            event: test.event ? {
              id: test.event.id,
              name: test.event.name,
            } : null,
            staff: test.staff ? {
              id: test.staff.id,
              name: test.staff.name,
              email: test.staff.email,
            } : undefined,
            createdBy: test.createdBy ? {
              id: test.createdBy.id,
              name: test.createdBy.name,
              email: test.createdBy.email,
            } : undefined,
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
        }
      }),
    }
  })

  // Use the staffMembershipsWithTests that includes server-side fetched tests
  const serializedStaffMemberships = staffMembershipsWithTests

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern" />}>
      <ESPortalClient 
        user={session.user} 
        staffMemberships={serializedStaffMemberships} 
        initialTimelines={initialTimelines}
        initialTournamentId={tournament || null}
      />
    </Suspense>
  )
}

