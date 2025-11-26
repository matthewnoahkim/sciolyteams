import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isAdmin } from '@/lib/rbac'
import { generateAttendanceCode, hashAttendanceCode } from '@/lib/attendance'
import { z } from 'zod'
import { CalendarScope } from '@prisma/client'

// Helper function to generate recurring event occurrences
function generateRecurrenceInstances(
  startDate: Date,
  endDate: Date,
  recurrenceRule: string,
  recurrenceInterval: number,
  recurrenceDaysOfWeek: number[] | undefined,
  recurrenceEndDate: Date | undefined,
  recurrenceCount: number | undefined
): Date[] {
  const instances: Date[] = []
  const eventDuration = endDate.getTime() - startDate.getTime()
  let currentDate = new Date(startDate)
  let count = 0
  const maxIterations = recurrenceCount || 365 // Safety limit
  const endLimit = recurrenceEndDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year max

  while (count < maxIterations && currentDate <= endLimit) {
    // For weekly recurrence, check if current day matches selected days
    if (recurrenceRule === 'WEEKLY' && recurrenceDaysOfWeek && recurrenceDaysOfWeek.length > 0) {
      const dayOfWeek = currentDate.getDay()
      if (recurrenceDaysOfWeek.includes(dayOfWeek)) {
        instances.push(new Date(currentDate))
        count++
      }
      // Always increment by 1 day for weekly with specific days
      currentDate.setDate(currentDate.getDate() + 1)
    } else {
      // Add current instance
      instances.push(new Date(currentDate))
      count++

      // Move to next occurrence
      switch (recurrenceRule) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + recurrenceInterval)
          break
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + (7 * recurrenceInterval))
          break
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + recurrenceInterval)
          break
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + recurrenceInterval)
          break
      }
    }

    // Stop if we've reached the count limit or end date
    if (recurrenceCount && count >= recurrenceCount) break
    if (recurrenceEndDate && currentDate > recurrenceEndDate) break
  }

  return instances
}

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
  targetRoles: z.array(z.enum(['COACH', 'CAPTAIN', 'MEMBER'])).optional(),
  targetEvents: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  recurrenceInterval: z.number().int().min(1).max(99).optional(),
  recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  recurrenceEndDate: z.string().datetime().optional(),
  recurrenceCount: z.number().int().min(1).max(999).optional(),
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

    // Handle recurring events
    if (validated.isRecurring && validated.recurrenceRule) {
      // Add recurrence fields to parent event
      eventData.isRecurring = true
      eventData.recurrenceRule = validated.recurrenceRule
      eventData.recurrenceInterval = validated.recurrenceInterval || 1
      
      if (validated.recurrenceDaysOfWeek) {
        eventData.recurrenceDaysOfWeek = validated.recurrenceDaysOfWeek
      }
      if (validated.recurrenceEndDate) {
        eventData.recurrenceEndDate = new Date(validated.recurrenceEndDate)
      }
      if (validated.recurrenceCount) {
        eventData.recurrenceCount = validated.recurrenceCount
      }
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
    })

    // Create child events for recurring events
    if (validated.isRecurring && validated.recurrenceRule) {
      const instances = generateRecurrenceInstances(
        new Date(validated.startUTC),
        new Date(validated.endUTC),
        validated.recurrenceRule,
        validated.recurrenceInterval || 1,
        validated.recurrenceDaysOfWeek,
        validated.recurrenceEndDate ? new Date(validated.recurrenceEndDate) : undefined,
        validated.recurrenceCount
      )

      // Skip the first instance (that's the parent event)
      const childInstances = instances.slice(1)
      const eventDuration = new Date(validated.endUTC).getTime() - new Date(validated.startUTC).getTime()

      // Create child events
      if (childInstances.length > 0) {
        await prisma.calendarEvent.createMany({
          data: childInstances.map((instanceStart) => {
            const instanceEnd = new Date(instanceStart.getTime() + eventDuration)
            return {
              teamId: validated.teamId,
              creatorId: membership.id,
              scope: validated.scope as CalendarScope,
              title: validated.title,
              description: validated.description,
              startUTC: instanceStart,
              endUTC: instanceEnd,
              location: validated.location,
              color: validated.color || '#3b82f6',
              rsvpEnabled,
              important: validated.important || false,
              subteamId: validated.subteamId,
              attendeeId: validated.attendeeId,
              parentEventId: event.id,
            }
          }),
        })
      }
    }

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

    // Create calendar event targets for role and event targeting
    if (validated.scope === 'TEAM' || validated.scope === 'SUBTEAM') {
      try {
        // Create target records for roles
        if (validated.targetRoles && validated.targetRoles.length > 0) {
          await Promise.all(
            validated.targetRoles.map((role) =>
              prisma.calendarEventTarget.create({
                data: {
                  calendarEventId: event.id,
                  targetRole: role,
                },
              })
            )
          )
        }

        // Create target records for events
        if (validated.targetEvents && validated.targetEvents.length > 0) {
          await Promise.all(
            validated.targetEvents.map((eventId) =>
              prisma.calendarEventTarget.create({
                data: {
                  calendarEventId: event.id,
                  eventId,
                },
              })
            )
          )
        }
      } catch (targetError) {
        console.error('Failed to create event targets:', targetError)
        // Don't fail the whole operation, just log the error
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

    // Get user's event assignments from roster (for filtering targeted events)
    const userRosterAssignments = await prisma.rosterAssignment.findMany({
      where: {
        membershipId: membership.id,
        subteam: { teamId },
      },
      select: { 
        eventId: true,
        subteamId: true,
      },
    })
    const userEventIds = userRosterAssignments.map(ra => ra.eventId)
    const userSubteamIds = [...new Set(userRosterAssignments.map(ra => ra.subteamId))]

    // Get events visible to this user
    // Admins can see team-wide events, all subteam events, and only their own personal events
    // Regular members only see team-wide, their subteam, and their personal events
    const events = await prisma.calendarEvent.findMany({
      where: {
        teamId,
        OR: [
          // Team-wide events (visible to all) - will be filtered further below
          { scope: CalendarScope.TEAM },
          // Subteam events
          ...(isAdminUser
            ? [
                // Admins see all subteam events
                { scope: CalendarScope.SUBTEAM },
              ]
            : membership.subteamId
            ? [
                // Regular members see their primary subteam events
                {
                  scope: CalendarScope.SUBTEAM,
                  subteamId: membership.subteamId,
                },
                // Also see events for subteams they have roster assignments in
                ...(userSubteamIds.length > 0 ? [{
                  scope: CalendarScope.SUBTEAM,
                  subteamId: { in: userSubteamIds },
                }] : []),
              ]
            : userSubteamIds.length > 0
            ? [
                // Members without primary subteam but with roster assignments
                {
                  scope: CalendarScope.SUBTEAM,
                  subteamId: { in: userSubteamIds },
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
        targets: true, // Include targets for filtering
        test: {
          select: {
            id: true,
            assignments: {
              select: {
                assignedScope: true,
                subteamId: true,
                targetMembershipId: true,
                eventId: true,
              },
            },
          },
        },
      },
      orderBy: {
        startUTC: 'asc',
      },
    })

    // Filter events for non-admins based on targets and test assignments
    const filteredEvents = isAdminUser
      ? events
      : events.filter(event => {
          // If this is a test-linked calendar event, check test assignment visibility
          // This applies to both TEAM and SUBTEAM scope events
          if (event.testId && event.test) {
            const testAssignments = event.test.assignments
            
            // If test has no assignments, hide it
            if (testAssignments.length === 0) {
              return false
            }

            // Check if user has access to this test based on assignments
            // This logic must match the test visibility logic in /api/tests
            const hasTestAccess = testAssignments.some(a => {
              // CLUB scope - everyone gets access
              if (a.assignedScope === 'CLUB') {
                return true
              }
              // Subteam-based - user's primary subteam matches assignment's subteam
              if (a.subteamId && membership.subteamId && a.subteamId === membership.subteamId) {
                return true
              }
              // PERSONAL scope - directly assigned to this user
              if (a.targetMembershipId === membership.id) {
                return true
              }
              // Event-based assignments - user must have the event in their roster
              if (a.eventId && userEventIds.includes(a.eventId)) {
                return true
              }
              return false
            })

            return hasTestAccess
          }

          // For non-test SUBTEAM events, already filtered by the query
          if (event.scope === CalendarScope.SUBTEAM) {
            return true
          }

          // For non-test PERSONAL events, already filtered by the query
          if (event.scope === CalendarScope.PERSONAL) {
            return true
          }

          // For non-test TEAM events, check CalendarEventTarget records
          const targets = event.targets || []
          
          // If no targets, event is visible to everyone in the team
          if (targets.length === 0) {
            return true
          }

          // Check if user matches any target
          return targets.some(target => {
            // Role-based targeting
            if (target.targetRole) {
              // Map membership role to target role format
              const userRole = membership.role === 'ADMIN' ? 'COACH' : 'MEMBER'
              if (target.targetRole === userRole) {
                return true
              }
              // Also check membership.roles array for CAPTAIN etc.
              if ((membership as any).roles?.includes(target.targetRole)) {
                return true
              }
            }
            // Event-based targeting (Science Olympiad events)
            if (target.eventId && userEventIds.includes(target.eventId)) {
              return true
            }
            return false
          })
        })

    // Remove internal fields from response
    const cleanedEvents = filteredEvents.map(({ test, targets, ...event }) => event)

    return NextResponse.json({ events: cleanedEvents })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get calendar events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

