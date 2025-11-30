import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id, params.clubId)

    const body = await req.json()
    const { name } = updateTeamSchema.parse(body)

    // Verify team belongs to this club
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (existingTeam.clubId !== params.clubId) {
      return NextResponse.json({ error: 'Team does not belong to this club' }, { status: 403 })
    }

    const team = await prisma.team.update({
      where: { id: params.teamId },
      data: { name },
      include: {
        members: {
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
            members: true,
          },
        },
      },
    })

    return NextResponse.json({ team })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Update team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { clubId: string; teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id, params.clubId)

    // Verify team belongs to this club
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (existingTeam.clubId !== params.clubId) {
      return NextResponse.json({ error: 'Team does not belong to this club' }, { status: 403 })
    }

    await prisma.team.delete({
      where: { id: params.teamId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Delete team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

