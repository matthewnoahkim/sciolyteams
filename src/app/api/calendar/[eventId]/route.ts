import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isCaptain } from '@/lib/rbac'

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

    // Check permissions: must be creator or captain
    const isCreator = event.creatorId === membership.id
    const isCpt = await isCaptain(session.user.id, event.teamId)

    if (!isCreator && !isCpt) {
      return NextResponse.json(
        { error: 'Only the creator or team captain can delete this event' },
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

