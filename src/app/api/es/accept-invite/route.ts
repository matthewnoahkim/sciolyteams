import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/es/accept-invite - Accept an ES/TD invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body as { token: string }

    if (!token) {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
    }

    // Find the staff invitation
    const staff = await prisma.tournamentStaff.findUnique({
      where: { inviteToken: token },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if invitation is for this user's email
    if (staff.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ 
        error: 'This invitation is for a different email address',
        expectedEmail: staff.email,
      }, { status: 403 })
    }

    // Check if already accepted
    if (staff.status === 'ACCEPTED') {
      return NextResponse.json({ 
        staff,
        message: 'Invitation already accepted',
      })
    }

    // Accept the invitation
    const updatedStaff = await prisma.tournamentStaff.update({
      where: { id: staff.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        userId: session.user.id,
        name: staff.name || session.user.name,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ 
      staff: updatedStaff,
      message: 'Invitation accepted successfully',
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}

// GET /api/es/accept-invite - Get invitation details by token (for showing info before sign-in)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
    }

    // Find the staff invitation
    const staff = await prisma.tournamentStaff.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tournament: {
          select: {
            id: true,
            name: true,
            division: true,
            startDate: true,
            endDate: true,
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
  }
}

