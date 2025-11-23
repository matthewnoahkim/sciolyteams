import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/rbac'

// GET /api/tests/[testId]/attempts - Get all attempts for a test (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      select: { teamId: true },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const isAdminUser = await isAdmin(session.user.id, test.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can view test attempts' },
        { status: 403 }
      )
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { testId: params.testId },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: {
            question: {
              order: 'asc',
            },
          },
        },
        proctorEvents: {
          orderBy: {
            ts: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to match client interface
    const transformedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      membershipId: attempt.membershipId,
      status: attempt.status,
      startedAt: attempt.startedAt?.toISOString() || null,
      submittedAt: attempt.submittedAt?.toISOString() || null,
      gradeEarned: attempt.gradeEarned ? Number(attempt.gradeEarned) : null,
      proctoringScore: attempt.proctoringScore ? Number(attempt.proctoringScore) : null,
      tabSwitchCount: attempt.tabSwitchCount || 0,
      user: attempt.membership?.user
        ? {
            id: attempt.membership.user.id,
            name: attempt.membership.user.name,
            email: attempt.membership.user.email,
          }
        : null,
      answers: attempt.answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        answerText: answer.answerText,
        selectedOptionIds: answer.selectedOptionIds,
        numericAnswer: answer.numericAnswer ? Number(answer.numericAnswer) : null,
        pointsAwarded: answer.pointsAwarded ? Number(answer.pointsAwarded) : null,
        gradedAt: answer.gradedAt?.toISOString() || null,
        graderNote: answer.graderNote,
        question: {
          id: answer.question.id,
          promptMd: answer.question.promptMd,
          type: answer.question.type,
          points: Number(answer.question.points),
          sectionId: answer.question.sectionId,
          options: answer.question.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
          })),
        },
      })),
    }))

    const sections = await prisma.testSection.findMany({
      where: { testId: params.testId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
      },
    })

    return NextResponse.json({ attempts: transformedAttempts, sections })
  } catch (error) {
    console.error('Get test attempts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
