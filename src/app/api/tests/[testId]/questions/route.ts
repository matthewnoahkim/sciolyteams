import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCaptain, getUserMembership } from '@/lib/rbac'
import { verifyTestPassword } from '@/lib/test-security'
import { z } from 'zod'

const createQuestionSchema = z.object({
  type: z.enum(['MCQ_SINGLE', 'MCQ_MULTI', 'SHORT_TEXT', 'LONG_TEXT', 'NUMERIC']),
  promptMd: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().min(0),
  order: z.number().int().min(0),
  sectionId: z.string().optional(),
  shuffleOptions: z.boolean().optional(),
  numericTolerance: z.number().min(0).optional(),
  options: z.array(z.object({
    label: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.number().int().min(0),
  })).optional(),
  adminPassword: z.string().min(6),
})

// POST /api/tests/[testId]/questions
export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createQuestionSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, test.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can add questions' },
        { status: 403 }
      )
    }

    // Verify admin password
    if (test.requirePasswordToEdit && test.adminPasswordHash) {
      const isValid = await verifyTestPassword(
        test.adminPasswordHash,
        validatedData.adminPassword
      )
      if (!isValid) {
        return NextResponse.json(
          { error: 'NEED_ADMIN_PASSWORD', message: 'Invalid admin password' },
          { status: 401 }
        )
      }
    }

    // Create question with options in a transaction
    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          testId: params.testId,
          sectionId: validatedData.sectionId,
          type: validatedData.type,
          promptMd: validatedData.promptMd,
          explanation: validatedData.explanation,
          points: validatedData.points,
          order: validatedData.order,
          shuffleOptions: validatedData.shuffleOptions ?? false,
          numericTolerance: validatedData.numericTolerance,
        },
      })

      // Create options if provided
      if (validatedData.options && validatedData.options.length > 0) {
        await tx.questionOption.createMany({
          data: validatedData.options.map((opt) => ({
            questionId: q.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        })
      }

      // Return question with options
      return tx.question.findUnique({
        where: { id: q.id },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

