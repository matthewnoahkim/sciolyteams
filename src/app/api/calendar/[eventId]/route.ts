import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isCaptain } from '@/lib/rbac'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startUTC: z.string().optional(),
  endUTC: z.string().optional(),
  location: z.string().optional(),
  color: z.string().optional(),
  scope: z.enum(['PERSONAL', 'SUBTEAM', 'TEAM']).optional(),
  subteamId: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the event first to check permissions
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.eventId },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, event.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check permissions
    const isCreator = event.creatorId === membership.id
    const isCpt = await isCaptain(session.user.id, event.teamId)

    // Captains can edit all events EXCEPT personal events made by other members
    // Members can only edit their own events
    const canEdit = isCreator || (isCpt && event.scope !== 'PERSONAL')

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this event' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = updateEventSchema.parse(body)

    // Build update data
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.startUTC !== undefined) updateData.startUTC = new Date(validatedData.startUTC)
    if (validatedData.endUTC !== undefined) updateData.endUTC = new Date(validatedData.endUTC)
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.scope !== undefined) updateData.scope = validatedData.scope
    if (validatedData.subteamId !== undefined) updateData.subteamId = validatedData.subteamId

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: params.eventId },
      data: updateData,
      include: {
        creator: {
          include: {
            user: true,
          },
        },
        subteam: true,
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

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Update calendar event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the event first to check permissions
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.eventId },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, event.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check permissions
    const isCreator = event.creatorId === membership.id
    const isCpt = await isCaptain(session.user.id, event.teamId)

    // Captains can delete all events EXCEPT personal events made by other members
    // Members can only delete their own events
    const canDelete = isCreator || (isCpt && event.scope !== 'PERSONAL')

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      )
    }

    await prisma.calendarEvent.delete({
      where: { id: params.eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

