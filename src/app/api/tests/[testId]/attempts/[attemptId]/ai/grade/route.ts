import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership, isAdmin } from '@/lib/rbac'
import { logActivity } from '@/lib/activity-log'
import { requestFrqSuggestion } from '@/lib/ai-grading'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const requestSchema = z.object({
  mode: z.enum(['single', 'all']).default('single'),
  answerId: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string; attemptId: string }> | { testId: string; attemptId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await req.json().catch(() => ({}))
    const validated = requestSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: resolvedParams.testId },
      select: { clubId: true },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const isAdminUser = await isAdmin(session.user.id, test.clubId)
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Only admins can request AI grading' }, { status: 403 })
    }

    const adminMembership = await getUserMembership(session.user.id, test.clubId)

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: resolvedParams.attemptId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.testId !== resolvedParams.testId) {
      return NextResponse.json({ error: 'Attempt does not belong to this test' }, { status: 400 })
    }

    const frqAnswers = attempt.answers.filter(
      (answer) => answer.question.type === 'SHORT_TEXT' || answer.question.type === 'LONG_TEXT'
    )

    if (frqAnswers.length === 0) {
      return NextResponse.json({ error: 'No FRQ answers available for AI grading' }, { status: 400 })
    }

    let targets = frqAnswers
    if (validated.mode === 'single') {
      if (!validated.answerId) {
        return NextResponse.json({ error: 'answerId is required for single mode' }, { status: 400 })
      }
      const targetAnswer = frqAnswers.find((answer) => answer.id === validated.answerId)
      if (!targetAnswer) {
        return NextResponse.json({ error: 'FRQ answer not found' }, { status: 404 })
      }
      targets = [targetAnswer]
    }

    await logActivity({
      action: 'AI_GRADE_REQUEST',
      description: `Admin requested AI grade suggestions for ${targets.length} FRQ(s)`,
      userId: session.user.id,
      logType: 'ADMIN_ACTION',
      metadata: {
        testId: resolvedParams.testId,
        attemptId: resolvedParams.attemptId,
        answerIds: targets.map((answer) => answer.id),
        mode: validated.mode,
      },
      route: `/api/tests/${resolvedParams.testId}/attempts/${resolvedParams.attemptId}/ai/grade`,
    })

    const suggestions = []

    for (const answer of targets) {
      const maxPoints = Number(answer.question.points)
      const aiSuggestion = await requestFrqSuggestion({
        questionPrompt: answer.question.promptMd,
        rubric: answer.question.explanation,
        maxPoints,
        studentResponse: answer.answerText,
      })

      const saved = await prisma.aiGradingSuggestion.create({
        data: {
          testId: resolvedParams.testId,
          attemptId: resolvedParams.attemptId,
          answerId: answer.id,
          questionId: answer.questionId,
          requestedByUserId: session.user.id,
          requestedByMembershipId: adminMembership?.id,
          suggestedPoints: new Prisma.Decimal(aiSuggestion.suggestedScore),
          maxPoints: new Prisma.Decimal(aiSuggestion.maxScore || maxPoints),
          explanation: aiSuggestion.summary,
          strengths: aiSuggestion.strengths,
          gaps: aiSuggestion.gaps,
          rubricAlignment: aiSuggestion.rubricAlignment,
          rawResponse: aiSuggestion.rawResponse,
        },
      })

      suggestions.push({
        id: saved.id,
        answerId: saved.answerId,
        questionId: saved.questionId,
        suggestedPoints: Number(saved.suggestedPoints),
        maxPoints: Number(saved.maxPoints),
        explanation: saved.explanation,
        strengths: saved.strengths,
        gaps: saved.gaps,
        rubricAlignment: saved.rubricAlignment,
        status: saved.status,
        createdAt: saved.createdAt.toISOString(),
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('AI grading error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message?.includes('OpenAI')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request AI suggestion' },
      { status: 500 }
    )
  }
}

