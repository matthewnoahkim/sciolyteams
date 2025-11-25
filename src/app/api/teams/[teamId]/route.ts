import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, requireAdmin } from '@/lib/rbac'
import { z } from 'zod'

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  backgroundType: z.enum(['grid', 'solid', 'gradient']).optional(),
  backgroundColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
  gradientStartColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
  gradientEndColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), z.null()]).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireMember(session.user.id, params.teamId)

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        memberships: {
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
            rosterAssignments: {
              include: {
                event: true,
              },
            },
          },
        },
        subteams: {
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
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update teams
    await requireAdmin(session.user.id, params.teamId)

    const body = await req.json()
    const validatedData = updateTeamSchema.parse(body)

    // Verify team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Build update data object
    const updateData: any = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.backgroundType !== undefined) {
      updateData.backgroundType = validatedData.backgroundType
    }
    if (validatedData.backgroundColor !== undefined) {
      updateData.backgroundColor = validatedData.backgroundColor
    }
    if (validatedData.gradientStartColor !== undefined) {
      updateData.gradientStartColor = validatedData.gradientStartColor
    }
    if (validatedData.gradientEndColor !== undefined) {
      updateData.gradientEndColor = validatedData.gradientEndColor
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: params.teamId },
      data: updateData,
    })

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Update team error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete teams
    await requireAdmin(session.user.id, params.teamId)

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Delete team (cascading deletes will handle related records)
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

