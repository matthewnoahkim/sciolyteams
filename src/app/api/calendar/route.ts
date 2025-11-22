import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isAdmin } from '@/lib/rbac'
import { generateAttendanceCode, hashAttendanceCode } from '@/lib/attendance'
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
  color: z.string().optional(),
  rsvpEnabled: z.boolean().optional(),
  important: z.boolean().optional(),
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
      const isAdminUser = await isAdmin(session.user.id, validated.teamId)
      if (!isAdminUser) {
        return NextResponse.json(
          { error: 'Only admins can create team/subteam events' },
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

    // For PERSONAL events, RSVP should not be enabled
    const rsvpEnabled = validated.scope === 'PERSONAL' 
      ? false 
      : (validated.rsvpEnabled !== undefined ? validated.rsvpEnabled : true)

    // Build the event data object
    const eventData: any = {
      teamId: validated.teamId,
      creatorId: membership.id,
      scope: validated.scope as CalendarScope,
      title: validated.title,
      startUTC: new Date(validated.startUTC),
      endUTC: new Date(validated.endUTC),
      color: validated.color || '#3b82f6',
      rsvpEnabled,
      important: validated.important || false,
    }

    // Only add optional fields if they have values
    if (validated.description) {
      eventData.description = validated.description
    }
    if (validated.location) {
      eventData.location = validated.location
    }
    if (validated.subteamId) {
      eventData.subteamId = validated.subteamId
    }
    if (validated.attendeeId) {
      eventData.attendeeId = validated.attendeeId
    }

    const event = await prisma.calendarEvent.create({
      data: eventData,
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
    })

    // Automatically create attendance record for TEAM and SUBTEAM events
    if (validated.scope === 'TEAM' || validated.scope === 'SUBTEAM') {
      try {
        const initialCode = generateAttendanceCode()
        const codeHash = await hashAttendanceCode(initialCode)

        await prisma.attendance.create({
          data: {
            calendarEventId: event.id,
            teamId: validated.teamId,
            codeHash: codeHash,
            graceMinutes: 0, // Default grace period, can be customized later
            status: 'UPCOMING',
          },
        })
      } catch (attendanceError) {
        console.error('Failed to create attendance record:', attendanceError)
        // Delete the event we just created since attendance creation failed
        await prisma.calendarEvent.delete({ where: { id: event.id } })
        throw new Error('Failed to create attendance record: ' + (attendanceError instanceof Error ? attendanceError.message : 'Unknown error'))
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid event data', 
        message: 'Please check all required fields',
        details: error.errors 
      }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 })
    }
    
    console.error('Create calendar event error:', error)
    
    // Make Prisma errors more readable
    let userFriendlyMessage = 'Failed to create event'
    if (error instanceof Error) {
      if (error.message.includes('Unknown argument')) {
        userFriendlyMessage = 'Invalid event data submitted'
      } else if (error.message.includes('Foreign key constraint')) {
        userFriendlyMessage = 'Invalid team or subteam selected'
      } else if (error.message.includes('Unique constraint')) {
        userFriendlyMessage = 'This event conflicts with an existing record'
      } else if (error.message.includes('attendance')) {
        userFriendlyMessage = 'Failed to create attendance tracking for this event'
      }
    }
    
    return NextResponse.json({ 
      error: userFriendlyMessage,
      message: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : String(error))
        : 'An error occurred while creating the event'
    }, { status: 500 })
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

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, teamId)

    // Get events visible to this user
    // Admins can see team-wide events, all subteam events, and only their own personal events
    // Regular members only see team-wide, their subteam, and their personal events
    const events = await prisma.calendarEvent.findMany({
      where: {
        teamId,
        OR: [
          // Team-wide events (visible to all)
          { scope: CalendarScope.TEAM },
          // Subteam events
          ...(isAdminUser
            ? [
        // Admins see all subteam events
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
        attachments: {
          include: {
            uploadedBy: {
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

