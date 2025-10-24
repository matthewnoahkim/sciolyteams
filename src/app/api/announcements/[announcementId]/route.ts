import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isCaptain } from '@/lib/rbac'
import { z } from 'zod'

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  important: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateAnnouncementSchema.parse(body)

    // Get the announcement first to check permissions
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.announcementId },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, announcement.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check permissions: must be a captain (captains can edit all announcements)
    const isCpt = await isCaptain(session.user.id, announcement.teamId)

    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only team captains can edit announcements' },
        { status: 403 }
      )
    }

    // Update announcement and linked calendar event if exists
    const updatedAnnouncement = await prisma.$transaction(async (tx) => {
      const updated = await tx.announcement.update({
        where: { id: params.announcementId },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.content && { content: validated.content }),
          ...(validated.important !== undefined && { important: validated.important }),
        },
        include: {
          author: {
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
          visibilities: {
            include: {
              subteam: true,
            },
          },
          calendarEvent: true,
        },
      })

      // If announcement is linked to a calendar event, sync title and important field
      if (updated.calendarEventId) {
        const updateData: any = {}
        if (validated.title) updateData.title = validated.title
        if (validated.important !== undefined) updateData.important = validated.important
        
        if (Object.keys(updateData).length > 0) {
          await tx.calendarEvent.update({
            where: { id: updated.calendarEventId },
            data: updateData,
          })
        }
      }

      return updated
    })

    return NextResponse.json({ announcement: updatedAnnouncement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Update announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the announcement first to check permissions
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.announcementId },
      include: {
        author: {
          include: {
            user: true,
          },
        },
        calendarEvent: true,
      },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const membership = await getUserMembership(session.user.id, announcement.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check permissions: must be author or captain
    const isAuthor = announcement.authorId === membership.id
    const isCpt = await isCaptain(session.user.id, announcement.teamId)

    if (!isAuthor && !isCpt) {
      return NextResponse.json(
        { error: 'Only the author or team captain can delete this announcement' },
        { status: 403 }
      )
    }

    // Delete announcement and linked calendar event in transaction
    await prisma.$transaction(async (tx) => {
      // Delete the announcement first (this will set calendarEventId to null due to cascade)
      await tx.announcement.delete({
        where: { id: params.announcementId },
      })

      // If there's a linked calendar event, delete it too
      if (announcement.calendarEventId) {
        await tx.calendarEvent.delete({
          where: { id: announcement.calendarEventId },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

