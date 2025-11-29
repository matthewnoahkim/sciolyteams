import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership } from '@/lib/rbac'
import { Role } from '@prisma/client'
import { z } from 'zod'

const registerSchema = z.object({
  registrations: z.array(z.object({
    teamId: z.string(),
    subteamId: z.string().optional(),
    eventIds: z.array(z.string()).min(1, 'At least one event must be selected'),
  })).min(1, 'At least one team must be registered'),
})

// POST /api/tournaments/[tournamentId]/register
export async function POST(
  req: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = registerSchema.parse(body)

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.tournamentId },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Validate all registrations
    for (const reg of validated.registrations) {
      // Verify user is an admin of the team
      const membership = await getUserMembership(session.user.id, reg.teamId)
      if (!membership) {
        return NextResponse.json({ error: `You must be a member of team ${reg.teamId}` }, { status: 403 })
      }
      
      // Check if user is an admin
      if (membership.role !== Role.ADMIN) {
        return NextResponse.json({ 
          error: `You must be an admin of ${membership.team.name} to register for tournaments` 
        }, { status: 403 })
      }

      // If subteamId is provided, verify it belongs to the team
      if (reg.subteamId) {
        const subteam = await prisma.subteam.findFirst({
          where: {
            id: reg.subteamId,
            teamId: reg.teamId,
          },
        })
        if (!subteam) {
          return NextResponse.json({ error: 'Subteam does not belong to the specified team' }, { status: 400 })
        }
      }

      // Check if already registered (with same subteam if specified)
      // Use findFirst for nullable subteamId since findUnique can have issues with null in composite keys
      const existingRegistration = await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentId: params.tournamentId,
          teamId: reg.teamId,
          subteamId: reg.subteamId ?? null,
        },
      })

      if (existingRegistration) {
        return NextResponse.json({ error: 'This team/subteam is already registered for this tournament' }, { status: 400 })
      }

      // Verify all events exist and match tournament division
      const events = await prisma.event.findMany({
        where: {
          id: { in: reg.eventIds },
          division: tournament.division,
        },
      })

      if (events.length !== reg.eventIds.length) {
        return NextResponse.json({ error: 'Some events are invalid or do not match tournament division' }, { status: 400 })
      }
    }

    // Create all registrations
    const registrations = await Promise.all(
      validated.registrations.map(reg =>
        prisma.tournamentRegistration.create({
          data: {
            tournamentId: params.tournamentId,
            teamId: reg.teamId,
            subteamId: reg.subteamId ?? null, // Use ?? to properly handle undefined
            registeredById: session.user.id,
            status: 'CONFIRMED',
            eventSelections: {
              create: reg.eventIds.map(eventId => ({
                eventId,
              })),
            },
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                division: true,
              },
            },
            subteam: {
              select: {
                id: true,
                name: true,
              },
            },
            eventSelections: {
              include: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        })
      )
    )

    return NextResponse.json({ registrations })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Register for tournament error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}

