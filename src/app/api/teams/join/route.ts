import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyInviteCode } from '@/lib/invite-codes'
import { logActivity } from '@/lib/activity-log'
import { z } from 'zod'
import { Role } from '@prisma/client'

const joinSchema = z.object({
  code: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code } = joinSchema.parse(body)

    // Find all teams and check which one this code belongs to
    const teams = await prisma.team.findMany()
    
    let matchedTeam: typeof teams[0] | null = null
    let role: Role | null = null

    for (const team of teams) {
      const isAdminCode = await verifyInviteCode(code, team.adminInviteCodeHash)
      if (isAdminCode) {
        matchedTeam = team
        role = Role.ADMIN
        break
      }

      const isMemberCode = await verifyInviteCode(code, team.memberInviteCodeHash)
      if (isMemberCode) {
        matchedTeam = team
        role = Role.MEMBER
        break
      }
    }

    if (!matchedTeam || !role) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code', code: 'INVALID_CODE' },
        { status: 401 }
      )
    }

    // Check if user is already a member
    const existing = await prisma.membership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: matchedTeam.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this team', code: 'ALREADY_MEMBER' },
        { status: 400 }
      )
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: session.user.id,
        teamId: matchedTeam.id,
        role,
      },
      include: {
        team: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Log the team join
    await logActivity({
      action: 'USER_JOINED_TEAM',
      description: `${membership.user.name || membership.user.email} joined team "${matchedTeam.name}" as ${role}`,
      userId: session.user.id,
      metadata: {
        teamId: matchedTeam.id,
        teamName: matchedTeam.name,
        role,
        membershipId: membership.id,
      },
    })

    return NextResponse.json({
      membership,
      message: `Successfully joined team as ${role.toLowerCase()}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Join team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

