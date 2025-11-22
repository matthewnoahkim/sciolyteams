import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

const updateMembershipSchema = z.object({
  subteamId: z.string().nullable().optional(),
  roles: z
    .array(z.enum(['COACH', 'CAPTAIN']))
    .optional()
    .transform((roles) => roles ?? undefined),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { membershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.membership.findUnique({
      where: { id: params.membershipId },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    await requireAdmin(session.user.id, membership.teamId)

    const body = await req.json()
    const { subteamId, roles } = updateMembershipSchema.parse(body)

    // If subteamId is provided, verify it belongs to the same team and check size limit
    if (subteamId) {
      const subteam = await prisma.subteam.findUnique({
        where: { id: subteamId },
      })

      if (!subteam || subteam.teamId !== membership.teamId) {
        return NextResponse.json({ error: 'Invalid subteam' }, { status: 400 })
      }

      // Check subteam size cap (15 members per subteam)
      const subteamMemberCount = await prisma.membership.count({
        where: { subteamId },
      })

      if (subteamMemberCount >= 15) {
        return NextResponse.json(
          { error: 'Subteam is full (maximum 15 members per subteam)' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (subteamId !== undefined) {
      updateData.subteamId = subteamId
    }
    if (roles !== undefined) {
      updateData.roles = roles
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const updated = await prisma.membership.update({
      where: { id: params.membershipId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        subteam: true,
      },
    })

    return NextResponse.json({ membership: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Update membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { membershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.membership.findUnique({
      where: { id: params.membershipId },
      include: {
        team: {
          include: {
            memberships: {
              where: {
                role: 'ADMIN',
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if the requester is an admin of the team
    const requesterMembership = await prisma.membership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: membership.teamId,
        },
      },
    })

    if (!requesterMembership) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 })
    }

    const isRequesterAdmin = requesterMembership.role === 'ADMIN'
    const isSelfRemoval = membership.userId === session.user.id

    // Only admins can remove others, or users can remove themselves
    if (!isRequesterAdmin && !isSelfRemoval) {
      return NextResponse.json({ error: 'Only admins can remove other members' }, { status: 403 })
    }

    // Check if this is the last admin
    if (membership.role === 'ADMIN' && membership.team.memberships.length === 1) {
      return NextResponse.json(
        { error: 'Cannot remove the only admin. Please promote another member to admin first or delete the team.' },
        { status: 400 }
      )
    }

    // Delete the membership (cascade will handle related records)
    await prisma.membership.delete({
      where: { id: params.membershipId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete membership error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

