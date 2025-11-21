import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCaptain } from '@/lib/rbac'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  category: z.string().optional(),
  amount: z.number().min(0).optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// PATCH /api/expenses/[expenseId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateExpenseSchema.parse(body)

    // Get the expense to check team
    const expense = await prisma.expense.findUnique({
      where: { id: params.expenseId },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, expense.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can edit expenses' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date)
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const updatedExpense = await prisma.expense.update({
      where: { id: params.expenseId },
      data: updateData,
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

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update expense error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/expenses/[expenseId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the expense to check team
    const expense = await prisma.expense.findUnique({
      where: { id: params.expenseId },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is a captain
    const isCpt = await isCaptain(session.user.id, expense.teamId)
    if (!isCpt) {
      return NextResponse.json(
        { error: 'Only captains can delete expenses' },
        { status: 403 }
      )
    }

    await prisma.expense.delete({
      where: { id: params.expenseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

