import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

const updateSubteamSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string; subteamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id, params.teamId)

    const body = await req.json()
    const { name } = updateSubteamSchema.parse(body)

    // Verify subteam belongs to this team
    const existingSubteam = await prisma.subteam.findUnique({
      where: { id: params.subteamId },
    })

    if (!existingSubteam) {
      return NextResponse.json({ error: 'Subteam not found' }, { status: 404 })
    }

    if (existingSubteam.teamId !== params.teamId) {
      return NextResponse.json({ error: 'Subteam does not belong to this team' }, { status: 403 })
    }

    const subteam = await prisma.subteam.update({
      where: { id: params.subteamId },
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

    return NextResponse.json({ subteam })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Update subteam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; subteamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin(session.user.id, params.teamId)

    // Verify subteam belongs to this team
    const existingSubteam = await prisma.subteam.findUnique({
      where: { id: params.subteamId },
    })

    if (!existingSubteam) {
      return NextResponse.json({ error: 'Subteam not found' }, { status: 404 })
    }

    if (existingSubteam.teamId !== params.teamId) {
      return NextResponse.json({ error: 'Subteam does not belong to this team' }, { status: 403 })
    }

    await prisma.subteam.delete({
      where: { id: params.subteamId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Delete subteam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

