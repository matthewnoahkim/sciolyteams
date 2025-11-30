import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tabTrackingSchema = z.object({
  tabSwitchCount: z.number().int().min(0),
  timeOffPageSeconds: z.number().int().min(0),
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
    const validatedData = tabTrackingSchema.parse(body)

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      select: { membershipId: true, testId: true },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        club: {
          tests: {
            some: {
              id: params.testId,
            },
          },
        },
      },
    })

    if (!membership || membership.id !== attempt.membershipId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: params.attemptId },
      data: {
        tabSwitchCount: validatedData.tabSwitchCount,
        timeOffPageSeconds: validatedData.timeOffPageSeconds,
      },
    })

    return NextResponse.json({ attempt: updatedAttempt })
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
