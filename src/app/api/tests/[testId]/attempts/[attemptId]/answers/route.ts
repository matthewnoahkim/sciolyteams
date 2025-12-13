import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership } from '@/lib/rbac'
import { z } from 'zod'

const saveAnswerSchema = z.object({
  questionId: z.string(),
  answerText: z.string().optional().nullable(),
  selectedOptionIds: z.array(z.string()).optional().nullable(),
  numericAnswer: z.number().optional().nullable(),
  markedForReview: z.boolean().optional(),
})

// POST /api/tests/[testId]/attempts/[attemptId]/answers
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
    const validatedData = saveAnswerSchema.parse(body)

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
        { error: 'Cannot modify submitted attempt' },
        { status: 400 }
      )
    }

    // Verify ownership - check if user is a member of the club and owns this attempt
    const membership = await getUserMembership(session.user.id, attempt.test.clubId)
    if (!membership || membership.id !== attempt.membershipId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify question belongs to this test
    const question = await prisma.question.findFirst({
      where: {
        id: validatedData.questionId,
        testId: params.testId,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Upsert answer
    const updateData: any = {
      answerText: validatedData.answerText,
      selectedOptionIds: validatedData.selectedOptionIds ?? undefined,
      numericAnswer: validatedData.numericAnswer,
    }
    
    // Only update markedForReview if it's explicitly provided (not undefined)
    if (validatedData.markedForReview !== undefined) {
      updateData.markedForReview = validatedData.markedForReview
    }

    const answer = await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: params.attemptId,
          questionId: validatedData.questionId,
        },
      },
      update: updateData,
      create: {
        attemptId: params.attemptId,
        questionId: validatedData.questionId,
        answerText: validatedData.answerText,
        selectedOptionIds: validatedData.selectedOptionIds ?? undefined,
        numericAnswer: validatedData.numericAnswer,
        markedForReview: validatedData.markedForReview ?? false,
      },
    })

    return NextResponse.json({ answer })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Save answer error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
