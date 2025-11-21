import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, isCaptain } from '@/lib/rbac'
import { z } from 'zod'

const createExpenseSchema = z.object({
  teamId: z.string(),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  amount: z.number().min(0),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

// GET /api/expenses?teamId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    await requireMember(session.user.id, teamId)

    const expenses = await prisma.expense.findMany({
      where: { teamId },
      orderBy: { date: 'desc' },
      include: {
        purchaseRequest: {
          select: {
            id: true,
            requesterId: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createExpenseSchema.parse(body)

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, validatedData.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can add expenses' },
        { status: 403 }
      )
    }

    // Get the user's membership ID
    const membership = await prisma.membership.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: validatedData.teamId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    const expense = await prisma.expense.create({
      data: {
        teamId: validatedData.teamId,
        description: validatedData.description,
        category: validatedData.category,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        addedById: membership.id,
      },
      include: {
        purchaseRequest: {
          select: {
            id: true,
            requesterId: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

