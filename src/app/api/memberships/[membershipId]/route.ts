import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCaptain } from '@/lib/rbac'
import { z } from 'zod'

const updateMembershipSchema = z.object({
  subteamId: z.string().nullable(),
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

    await requireCaptain(session.user.id, membership.teamId)

    const body = await req.json()
    const { subteamId } = updateMembershipSchema.parse(body)

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

    const updated = await prisma.membership.update({
      where: { id: params.membershipId },
      data: { subteamId },
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

