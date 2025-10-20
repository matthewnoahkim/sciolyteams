import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isCaptain } from '@/lib/rbac'
import { z } from 'zod'

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
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

    // Update announcement
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: params.announcementId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.content && { content: validated.content }),
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
      },
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

    await prisma.announcement.delete({
      where: { id: params.announcementId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

