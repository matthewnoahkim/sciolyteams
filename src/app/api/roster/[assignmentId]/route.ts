import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCaptain } from '@/lib/rbac'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignment = await prisma.rosterAssignment.findUnique({
      where: { id: params.assignmentId },
      include: {
        subteam: {
          include: {
            team: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await requireCaptain(session.user.id, assignment.subteam.team.id)

    await prisma.rosterAssignment.delete({
      where: { id: params.assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Delete roster assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

