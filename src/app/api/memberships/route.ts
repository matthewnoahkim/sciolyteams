import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember } from '@/lib/rbac'

// GET /api/memberships?teamId=xxx - List team memberships
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    await requireMember(session.user.id, teamId)

    const memberships = await prisma.membership.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { user: { name: 'asc' } },
      ],
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get memberships error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

