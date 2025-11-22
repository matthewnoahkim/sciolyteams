import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, getUserMembership } from '@/lib/rbac'
import { z } from 'zod'

const assignSchema = z.object({
  assignments: z.array(z.object({
    assignedScope: z.enum(['TEAM', 'SUBTEAM', 'PERSONAL']),
    subteamId: z.string().optional(),
    targetMembershipId: z.string().optional(),
  })),
})

// POST /api/tests/[testId]/assign
export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = assignSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user is an admin
    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can assign tests' },
        { status: 403 }
      )
    }

    // Delete existing assignments and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete old assignments
      await tx.testAssignment.deleteMany({
        where: { testId: params.testId },
      })

      // Create new assignments
      await tx.testAssignment.createMany({
        data: validatedData.assignments.map((a) => ({
          testId: params.testId,
          assignedScope: a.assignedScope,
          subteamId: a.subteamId,
          targetMembershipId: a.targetMembershipId,
        })),
      })
    })

    // Fetch updated assignments
    const assignments = await prisma.testAssignment.findMany({
      where: { testId: params.testId },
      include: {
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Assign test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

