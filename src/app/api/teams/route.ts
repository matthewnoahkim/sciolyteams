import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createInviteCodes } from '@/lib/invite-codes'
import { z } from 'zod'
import { Division, Role } from '@prisma/client'

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  division: z.enum(['B', 'C']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createTeamSchema.parse(body)

    // Create invite codes
    const { captainHash, memberHash, captainCode, memberCode, captainEncrypted, memberEncrypted } = await createInviteCodes()

    // Create team and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: validated.name,
          division: validated.division as Division,
          createdById: session.user.id,
          captainInviteCodeHash: captainHash,
          memberInviteCodeHash: memberHash,
          captainInviteCodeEncrypted: captainEncrypted,
          memberInviteCodeEncrypted: memberEncrypted,
        },
      })

      const membership = await tx.membership.create({
        data: {
          userId: session.user.id,
          teamId: team.id,
          role: Role.CAPTAIN,
        },
      })

      return { team, membership, captainCode, memberCode }
    })

    return NextResponse.json({
      team: result.team,
      inviteCodes: {
        captain: result.captainCode,
        member: result.memberCode,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        team: true,
        subteam: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

