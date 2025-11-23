import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ProctorEventKind } from '@prisma/client'

const proctorEventSchema = z.object({
  kind: z.nativeEnum(ProctorEventKind),
  meta: z.record(z.any()).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string; attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = proctorEventSchema.parse(body)

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
        team: {
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

    const proctorEvent = await prisma.proctorEvent.create({
      data: {
        attemptId: params.attemptId,
        kind: validatedData.kind,
        meta: validatedData.meta || undefined,
      },
    })

    return NextResponse.json({ proctorEvent }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create proctor event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
