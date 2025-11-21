import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const saveAnswerSchema = z.object({
  questionId: z.string(),
  answerText: z.string().optional(),
  selectedOptionIds: z.array(z.string()).optional(),
  numericAnswer: z.number().optional(),
})

// PATCH /api/tests/[testId]/attempts/[attemptId]/answers
// Autosave answers
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
    const { answers } = body // Array of answers

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: true,
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot save answers to submitted attempt' },
        { status: 400 }
      )
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

    // Upsert answers
    const operations = answers.map((answer: any) => {
      const validated = saveAnswerSchema.parse(answer)
      const selectedOptionValue =
        validated.selectedOptionIds !== undefined
          ? validated.selectedOptionIds
          : Prisma.JsonNull

      return prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: params.attemptId,
            questionId: validated.questionId,
          },
        },
        create: {
          attemptId: params.attemptId,
          questionId: validated.questionId,
          answerText: validated.answerText,
          selectedOptionIds: selectedOptionValue,
          numericAnswer: validated.numericAnswer,
        },
        update: {
          answerText: validated.answerText,
          selectedOptionIds: selectedOptionValue,
          numericAnswer: validated.numericAnswer,
        },
      })
    })

    await prisma.$transaction(operations)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Save answers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

