import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isCaptain } from '@/lib/rbac'
import { z } from 'zod'
import { CalendarScope } from '@prisma/client'

const createEventSchema = z.object({
  teamId: z.string(),
  scope: z.enum(['PERSONAL', 'SUBTEAM', 'TEAM']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startUTC: z.string().datetime(),
  endUTC: z.string().datetime(),
  location: z.string().optional(),
  subteamId: z.string().optional(),
  attendeeId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createEventSchema.parse(body)

    await requireMember(session.user.id, validated.teamId)

    const membership = await getUserMembership(session.user.id, validated.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Validate scope permissions
    if (validated.scope === 'TEAM' || validated.scope === 'SUBTEAM') {
      const isCpt = await isCaptain(session.user.id, validated.teamId)
      if (!isCpt) {
        return NextResponse.json(
          { error: 'Only captains can create team/subteam events' },
          { status: 403 }
        )
      }
    }

    // Validate scope-specific fields
    if (validated.scope === 'SUBTEAM' && !validated.subteamId) {
      return NextResponse.json({ error: 'Subteam ID required for SUBTEAM scope' }, { status: 400 })
    }

    if (validated.scope === 'PERSONAL' && !validated.attendeeId) {
      return NextResponse.json({ error: 'Attendee ID required for PERSONAL scope' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        teamId: validated.teamId,
        creatorId: membership.id,
        scope: validated.scope as CalendarScope,
        title: validated.title,
        description: validated.description || undefined,
        startUTC: new Date(validated.startUTC),
        endUTC: new Date(validated.endUTC),
        location: validated.location || undefined,
        subteamId: validated.subteamId || undefined,
        attendeeId: validated.attendeeId || undefined,
      },
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
        subteam: true,
        attendee: {
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
    })

    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Create calendar event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    await requireMember(session.user.id, teamId)

    const membership = await getUserMembership(session.user.id, teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, teamId)

    // Get events visible to this user
    // Captains can see team-wide events, all subteam events, and only their own personal events
    // Regular members only see team-wide, their subteam, and their personal events
    const events = await prisma.calendarEvent.findMany({
      where: {
        teamId,
        OR: [
          // Team-wide events (visible to all)
          { scope: CalendarScope.TEAM },
          // Subteam events
          ...(isCpt
            ? [
                // Captains see all subteam events
                { scope: CalendarScope.SUBTEAM },
              ]
            : membership.subteamId
            ? [
                // Regular members see only their subteam events
                {
                  scope: CalendarScope.SUBTEAM,
                  subteamId: membership.subteamId,
                },
              ]
            : []),
          // Personal events for this user only
          {
            scope: CalendarScope.PERSONAL,
            attendeeId: membership.id,
          },
        ],
      },
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
        subteam: true,
        attendee: {
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
        reactions: {
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
        startUTC: 'asc',
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get calendar events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

