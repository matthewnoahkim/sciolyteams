import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership } from '@/lib/rbac'
import { Role } from '@prisma/client'

// DELETE /api/tournaments/[tournamentId]/register/[registrationId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tournamentId: string; registrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the registration
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Verify the registration belongs to the tournament
    if (registration.tournamentId !== params.tournamentId) {
      return NextResponse.json({ error: 'Registration does not belong to this tournament' }, { status: 400 })
    }

    // Verify user is an admin of the team
    const membership = await getUserMembership(session.user.id, registration.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this team' }, { status: 403 })
    }

    if (membership.role !== Role.ADMIN) {
      return NextResponse.json({ 
        error: `You must be an admin of ${registration.team.name} to deregister from tournaments` 
      }, { status: 403 })
    }

    // Delete the registration (cascade will handle event selections)
    await prisma.tournamentRegistration.delete({
      where: { id: params.registrationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deregister from tournament error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}

