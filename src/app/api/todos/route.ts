import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isAdmin } from '@/lib/rbac'
import { z } from 'zod'

const createTodoSchema = z.object({
  teamId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  membershipId: z.string().optional(), // Admin can create for other users
})

// GET /api/todos?teamId=xxx - List todos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const membershipId = searchParams.get('membershipId')
    const showAll = searchParams.get('showAll') === 'true'

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    await requireMember(session.user.id, teamId)

    const membership = await getUserMembership(session.user.id, teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    const isAdminUser = await isAdmin(session.user.id, teamId)

    // Build where clause
    const where: Record<string, unknown> = { teamId }

    if (showAll && isAdminUser) {
      // Admin viewing all todos
      if (membershipId) {
        where.membershipId = membershipId
      }
    } else {
      // Regular user can only see their own todos
      where.membershipId = membership.id
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        membership: {
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
        },
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ todos })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get todos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/todos - Create a todo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createTodoSchema.parse(body)

    await requireMember(session.user.id, validated.teamId)

    const membership = await getUserMembership(session.user.id, validated.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    const isAdminUser = await isAdmin(session.user.id, validated.teamId)

    // Determine whose todo this is
    let targetMembershipId = membership.id

    // Admin can create todos for other users
    if (validated.membershipId && validated.membershipId !== membership.id) {
      if (!isAdminUser) {
        return NextResponse.json(
          { error: 'Only admins can create todos for other users' },
          { status: 403 }
        )
      }
      // Verify target membership exists and is in the same team
      const targetMembership = await prisma.membership.findUnique({
        where: { id: validated.membershipId },
      })
      if (!targetMembership || targetMembership.teamId !== validated.teamId) {
        return NextResponse.json({ error: 'Invalid membership' }, { status: 400 })
      }
      targetMembershipId = validated.membershipId
    }

    const todo = await prisma.todo.create({
      data: {
        teamId: validated.teamId,
        membershipId: targetMembershipId,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
      include: {
        membership: {
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
        },
      },
    })

    return NextResponse.json({ todo }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Create todo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

