import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isCaptain } from '@/lib/rbac'
import { sendAnnouncementEmail } from '@/lib/email'
import { z } from 'zod'
import { AnnouncementScope } from '@prisma/client'

const createAnnouncementSchema = z.object({
  teamId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  scope: z.enum(['TEAM', 'SUBTEAM']),
  subteamIds: z.array(z.string()).optional(),
  sendEmail: z.boolean().default(true),
  calendarEventId: z.string().optional(),
  important: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createAnnouncementSchema.parse(body)

    // Only captains can create announcements
    const isCpt = await isCaptain(session.user.id, validated.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can create announcements' },
        { status: 403 }
      )
    }

    await requireMember(session.user.id, validated.teamId)

    const membership = await getUserMembership(session.user.id, validated.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Validate subteam IDs if provided
    if (validated.scope === 'SUBTEAM' && (!validated.subteamIds || validated.subteamIds.length === 0)) {
      return NextResponse.json({ error: 'Subteam IDs required for SUBTEAM scope' }, { status: 400 })
    }

    // Create announcement with visibilities
    const announcement = await prisma.$transaction(async (tx) => {
      const ann = await tx.announcement.create({
        data: {
          teamId: validated.teamId,
          authorId: membership.id,
          title: validated.title,
          content: validated.content,
          calendarEventId: validated.calendarEventId,
          important: validated.important || false,
        },
      })

      // Create visibility records
      if (validated.scope === 'TEAM') {
        await tx.announcementVisibility.create({
          data: {
            announcementId: ann.id,
            scope: AnnouncementScope.TEAM,
          },
        })
      } else if (validated.subteamIds) {
        await Promise.all(
          validated.subteamIds.map((subteamId) =>
            tx.announcementVisibility.create({
              data: {
                announcementId: ann.id,
                scope: AnnouncementScope.SUBTEAM,
                subteamId,
              },
            })
          )
        )
      }

      return ann
    })

    // Send emails if requested
    if (validated.sendEmail) {
      const team = await prisma.team.findUnique({
        where: { id: validated.teamId },
        select: { name: true },
      })

      // Get all team memberships with role info
      const allMemberships = await prisma.membership.findMany({
        where: { teamId: validated.teamId },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      })

      // Get the author (captain who posted)
      const author = allMemberships.find(m => m.id === membership.id)
      const authorEmail = author?.user.email

      // Get all captains (will be CC'd)
      const captains = allMemberships.filter(m => m.role === 'CAPTAIN')
      const captainEmails = captains.map(c => c.user.email)

      // Get target members based on scope (will be BCC'd)
      let targetMembers: { email: string; id: string }[] = []

      if (validated.scope === 'TEAM') {
        // All members
        targetMembers = allMemberships
          .filter(m => m.role === 'MEMBER') // Only regular members (not captains)
          .map(m => ({ email: m.user.email, id: m.user.id }))
      } else if (validated.subteamIds) {
        // Members in selected subteams
        const subteamMemberships = allMemberships.filter(m => 
          m.role === 'MEMBER' && m.subteamId && validated.subteamIds?.includes(m.subteamId)
        )
        targetMembers = subteamMemberships.map(m => ({ email: m.user.email, id: m.user.id }))
      }

      // Get calendar event details if this announcement is linked to an event
      let calendarEventDetails = null
      if (validated.calendarEventId) {
        const calEvent = await prisma.calendarEvent.findUnique({
          where: { id: validated.calendarEventId },
          select: {
            startUTC: true,
            endUTC: true,
            location: true,
            description: true,
            rsvpEnabled: true,
          },
        })
        if (calEvent) {
          calendarEventDetails = calEvent
        }
      }

      // Send one email with CC and BCC (don't await)
      Promise.resolve().then(async () => {
        const result = await sendAnnouncementEmail({
          to: [authorEmail!], // Send to author as primary recipient
          cc: captainEmails.length > 0 ? captainEmails : undefined, // CC all captains
          bcc: targetMembers.map(u => u.email), // BCC all members
          replyTo: authorEmail,
          teamId: validated.teamId,
          teamName: team?.name || 'Team',
          title: validated.title,
          content: validated.content,
          announcementId: announcement.id,
          calendarEvent: calendarEventDetails || undefined,
        })

        // Log email for all recipients
        const allRecipients = [
          ...captains.map(c => ({ id: c.userId, email: c.user.email })),
          ...targetMembers,
        ]

        await Promise.all(
          allRecipients.map(recipient =>
            prisma.emailLog.create({
              data: {
                announcementId: announcement.id,
                toUserId: recipient.id,
                subject: `[${team?.name}] ${validated.title}`,
                providerMessageId: result.messageId,
              },
            })
          )
        )
      }).catch(error => console.error('Email sending error:', error))
    }

    const fullAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcement.id },
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
        calendarEvent: {
          include: {
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
            subteam: true,
          },
        },
      },
    })

    return NextResponse.json({ announcement: fullAnnouncement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Create announcement error:', error)
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

    // Get announcements visible to this user
    // Captains can see all announcements, regular members only see team-wide and their subteam
    const announcements = await prisma.announcement.findMany({
      where: {
        teamId,
        // Captains see all announcements for the team
        ...(isCpt ? {} : {
          OR: [
            // Team-wide announcements
            {
              visibilities: {
                some: {
                  scope: AnnouncementScope.TEAM,
                },
              },
            },
            // Subteam announcements for user's subteam
            ...(membership.subteamId
              ? [{
                  visibilities: {
                    some: {
                      scope: AnnouncementScope.SUBTEAM,
                      subteamId: membership.subteamId,
                    },
                  },
                }]
              : []),
          ],
        }),
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
        replies: {
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
            createdAt: 'asc',
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
        _count: {
          select: {
            replies: true,
            reactions: true,
          },
        },
        calendarEvent: {
          include: {
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
            subteam: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get announcements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

