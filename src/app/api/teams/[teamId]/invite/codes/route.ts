import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCaptain } from '@/lib/rbac'
import { decryptInviteCode } from '@/lib/invite-codes'

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireCaptain(session.user.id, params.teamId)

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: {
        captainInviteCodeEncrypted: true,
        memberInviteCodeEncrypted: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if codes need to be regenerated (for existing teams that were created before encrypted codes)
    const needsRegeneration = team.captainInviteCodeEncrypted === 'NEEDS_REGENERATION'

    if (needsRegeneration) {
      return NextResponse.json({
        needsRegeneration: true,
        message: 'Invite codes need to be regenerated',
      })
    }

    // Decrypt the codes
    const captainCode = decryptInviteCode(team.captainInviteCodeEncrypted)
    const memberCode = decryptInviteCode(team.memberInviteCodeEncrypted)

    return NextResponse.json({
      needsRegeneration: false,
      captainCode,
      memberCode,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get invite codes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

