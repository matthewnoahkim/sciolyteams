import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTabTrackingSchema = z.object({
  tabSwitchCount: z.number().int().min(0).optional(),
  timeOffPageSeconds: z.number().int().min(0).optional(),
})

// PATCH /api/tests/[testId]/attempts/[attemptId]/tab-tracking
export async function PATCH(
  req: NextRequest,
  { params }: { params: { testId: string; attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateTabTrackingSchema.parse(body)

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: true,
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Verify ownership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        teamId: attempt.test.teamId,
      },
    })

    if (!membership || membership.id !== attempt.membershipId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot update tracking for submitted attempt' },
        { status: 400 }
      )
    }

    // Update tab tracking
    const updateData: any = {}
    if (validatedData.tabSwitchCount !== undefined) {
      updateData.tabSwitchCount = validatedData.tabSwitchCount
    }
    if (validatedData.timeOffPageSeconds !== undefined) {
      updateData.timeOffPageSeconds = validatedData.timeOffPageSeconds
    }

    await prisma.testAttempt.update({
      where: { id: params.attemptId },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update tab tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

