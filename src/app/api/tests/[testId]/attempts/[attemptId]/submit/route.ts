import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClientIp, autoGradeQuestion, calculateProctoringScore } from '@/lib/test-security'
import { z } from 'zod'

const submitSchema = z.object({
  clientFingerprint: z.string().optional(),
  timeRemaining: z.number().optional(),
})

// POST /api/tests/[testId]/attempts/[attemptId]/submit
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
    const validatedData = submitSchema.parse(body)

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: true,
        proctorEvents: true,
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Attempt already submitted' },
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

    // Auto-grade all objective questions
    const gradingResults = attempt.test.questions.map((question) => {
      const answer = attempt.answers.find((a) => a.questionId === question.id)
      if (!answer) {
        return { questionId: question.id, pointsAwarded: 0, needsManualGrade: false }
      }

      // Check if needs manual grading
      if (question.type === 'SHORT_TEXT' || question.type === 'LONG_TEXT') {
        return { questionId: question.id, pointsAwarded: 0, needsManualGrade: true }
      }

      // Auto-grade
      const result = autoGradeQuestion(
        {
          type: question.type,
          points: Number(question.points),
          numericTolerance: question.numericTolerance ? Number(question.numericTolerance) : null,
          options: question.options,
        },
        {
          selectedOptionIds: answer.selectedOptionIds as string[] | undefined,
          numericAnswer: answer.numericAnswer ? Number(answer.numericAnswer) : null,
        }
      )

      return {
        questionId: question.id,
        pointsAwarded: result.pointsAwarded,
        needsManualGrade: false,
      }
    })

    // Calculate total grade (only from auto-graded questions)
    const totalAutoGraded = gradingResults
      .filter((r) => !r.needsManualGrade)
      .reduce((sum, r) => sum + r.pointsAwarded, 0)

    // Calculate proctoring score
    const proctoringScore = calculateProctoringScore(attempt.proctorEvents)

    // Get IP at submit
    const ipAtSubmit = getClientIp(req.headers)

    // Update attempt and answers in transaction
    await prisma.$transaction(async (tx) => {
      // Update attempt
      await tx.testAttempt.update({
        where: { id: params.attemptId },
        data: {
          status: gradingResults.some((r) => r.needsManualGrade) ? 'SUBMITTED' : 'GRADED',
          submittedAt: new Date(),
          gradeEarned: totalAutoGraded,
          proctoringScore,
          ipAtSubmit,
        },
      })

      // Create or update answer records for all questions
      for (const result of gradingResults) {
        await tx.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: params.attemptId,
              questionId: result.questionId,
            },
          },
          update: {
            pointsAwarded: result.pointsAwarded,
            gradedAt: result.needsManualGrade ? null : new Date(),
          },
          create: {
            attemptId: params.attemptId,
            questionId: result.questionId,
            answerText: null,
            selectedOptionIds: null,
            numericAnswer: null,
            pointsAwarded: result.pointsAwarded,
            gradedAt: result.needsManualGrade ? null : new Date(),
          },
        })
      }
    })

    // Fetch updated attempt
    const updatedAttempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        proctorEvents: true,
      },
    })

    return NextResponse.json({
      attempt: updatedAttempt,
      needsManualGrading: gradingResults.some((r) => r.needsManualGrade),
      proctoringScore,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Submit attempt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

