import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/es/tests - List ES tests for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff memberships for this user
    const staffMemberships = await prisma.tournamentStaff.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { email: { equals: session.user.email, mode: 'insensitive' } },
        ],
        status: 'ACCEPTED',
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            division: true,
            startDate: true,
          },
        },
        events: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                division: true,
              },
            },
          },
        },
        tests: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json({ staffMemberships })
  } catch (error) {
    console.error('Error fetching ES tests:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}

// POST /api/es/tests - Create a new ES test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { staffId, tournamentId, eventId, name, description, instructions, durationMinutes, questions } = body as {
      staffId: string
      tournamentId: string
      eventId?: string
      name: string
      description?: string
      instructions?: string
      durationMinutes?: number
      questions?: Array<{
        type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMERIC'
        promptMd: string
        explanation?: string
        points: number
        order: number
        shuffleOptions?: boolean
        numericTolerance?: number
        options?: Array<{
          label: string
          isCorrect: boolean
          order: number
        }>
      }>
    }

    if (!staffId || !tournamentId || !name) {
      return NextResponse.json({ error: 'Staff ID, tournament ID, and name are required' }, { status: 400 })
    }

    // Verify the user owns this staff membership
    const staff = await prisma.tournamentStaff.findFirst({
      where: {
        id: staffId,
        OR: [
          { userId: session.user.id },
          { email: { equals: session.user.email, mode: 'insensitive' } },
        ],
        status: 'ACCEPTED',
      },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Not authorized to create tests for this staff membership' }, { status: 403 })
    }

    // Create the test with questions
    const test = await prisma.eSTest.create({
      data: {
        staffId,
        tournamentId,
        eventId,
        name,
        description,
        instructions,
        durationMinutes: durationMinutes || 60,
        questions: questions && questions.length > 0
          ? {
              create: questions.map((q, index) => ({
                type: q.type,
                promptMd: q.promptMd,
                explanation: q.explanation,
                points: q.points,
                order: q.order ?? index,
                shuffleOptions: q.shuffleOptions || false,
                numericTolerance: q.numericTolerance,
                options: q.options && q.options.length > 0
                  ? {
                      create: q.options.map((opt, optIndex) => ({
                        label: opt.label,
                        isCorrect: opt.isCorrect,
                        order: opt.order ?? optIndex,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ test })
  } catch (error) {
    console.error('Error creating ES test:', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}

// PUT /api/es/tests - Update an ES test
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testId, name, description, instructions, durationMinutes, status, eventId, questions } = body as {
      testId: string
      name?: string
      description?: string
      instructions?: string
      durationMinutes?: number
      status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
      eventId?: string
      questions?: Array<{
        id?: string
        type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMERIC'
        promptMd: string
        explanation?: string
        points: number
        order: number
        shuffleOptions?: boolean
        numericTolerance?: number
        options?: Array<{
          id?: string
          label: string
          isCorrect: boolean
          order: number
        }>
      }>
    }

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Verify the user owns this test
    const existingTest = await prisma.eSTest.findFirst({
      where: {
        id: testId,
        staff: {
          OR: [
            { userId: session.user.id },
            { email: { equals: session.user.email, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found or not authorized' }, { status: 404 })
    }

    // Use a transaction to update test and questions
    const updatedTest = await prisma.$transaction(async (tx) => {
      // Update the test
      const test = await tx.eSTest.update({
        where: { id: testId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(instructions !== undefined && { instructions }),
          ...(durationMinutes && { durationMinutes }),
          ...(status && { status }),
          ...(eventId !== undefined && { eventId }),
        },
      })

      // If questions are provided, update them
      if (questions) {
        // Delete removed questions (questions not in the new array)
        const newQuestionIds = questions.filter(q => q.id).map(q => q.id!)
        await tx.eSTestQuestion.deleteMany({
          where: {
            testId,
            id: { notIn: newQuestionIds },
          },
        })

        // Upsert questions
        for (const q of questions) {
          if (q.id) {
            // Update existing question
            await tx.eSTestQuestion.update({
              where: { id: q.id },
              data: {
                type: q.type,
                promptMd: q.promptMd,
                explanation: q.explanation,
                points: q.points,
                order: q.order,
                shuffleOptions: q.shuffleOptions || false,
                numericTolerance: q.numericTolerance,
              },
            })

            // Handle options
            if (q.options) {
              const newOptionIds = q.options.filter(o => o.id).map(o => o.id!)
              await tx.eSTestQuestionOption.deleteMany({
                where: {
                  questionId: q.id,
                  id: { notIn: newOptionIds },
                },
              })

              for (const opt of q.options) {
                if (opt.id) {
                  await tx.eSTestQuestionOption.update({
                    where: { id: opt.id },
                    data: {
                      label: opt.label,
                      isCorrect: opt.isCorrect,
                      order: opt.order,
                    },
                  })
                } else {
                  await tx.eSTestQuestionOption.create({
                    data: {
                      questionId: q.id,
                      label: opt.label,
                      isCorrect: opt.isCorrect,
                      order: opt.order,
                    },
                  })
                }
              }
            }
          } else {
            // Create new question
            await tx.eSTestQuestion.create({
              data: {
                testId,
                type: q.type,
                promptMd: q.promptMd,
                explanation: q.explanation,
                points: q.points,
                order: q.order,
                shuffleOptions: q.shuffleOptions || false,
                numericTolerance: q.numericTolerance,
                options: q.options && q.options.length > 0
                  ? {
                      create: q.options.map((opt, optIndex) => ({
                        label: opt.label,
                        isCorrect: opt.isCorrect,
                        order: opt.order ?? optIndex,
                      })),
                    }
                  : undefined,
              },
            })
          }
        }
      }

      return test
    })

    // Fetch the complete updated test
    const completeTest = await prisma.eSTest.findUnique({
      where: { id: testId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ test: completeTest })
  } catch (error) {
    console.error('Error updating ES test:', error)
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
  }
}

// DELETE /api/es/tests - Delete an ES test
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Verify the user owns this test
    const existingTest = await prisma.eSTest.findFirst({
      where: {
        id: testId,
        staff: {
          OR: [
            { userId: session.user.id },
            { email: { equals: session.user.email, mode: 'insensitive' } },
          ],
        },
      },
    })

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found or not authorized' }, { status: 404 })
    }

    await prisma.eSTest.delete({
      where: { id: testId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ES test:', error)
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
}

