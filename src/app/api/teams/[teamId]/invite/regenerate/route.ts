import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireCaptain } from '@/lib/rbac'
import { generateInviteCode, hashInviteCode, encryptInviteCode } from '@/lib/invite-codes'
import { z } from 'zod'

const regenerateSchema = z.object({
  type: z.enum(['captain', 'member']),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireCaptain(session.user.id, params.teamId)

    const body = await req.json()
    const { type } = regenerateSchema.parse(body)

    const newCode = generateInviteCode()
    const newHash = await hashInviteCode(newCode)
    const newEncrypted = encryptInviteCode(newCode)

    const updateData = type === 'captain' 
      ? { 
          captainInviteCodeHash: newHash,
          captainInviteCodeEncrypted: newEncrypted 
        }
      : { 
          memberInviteCodeHash: newHash,
          memberInviteCodeEncrypted: newEncrypted 
        }

    await prisma.team.update({
      where: { id: params.teamId },
      data: updateData,
    })

    return NextResponse.json({
      type,
      code: newCode,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Regenerate invite code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

