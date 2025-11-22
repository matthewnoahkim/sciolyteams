import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, isAdmin, getUserMembership } from '@/lib/rbac'
import { z } from 'zod'

const createEventBudgetSchema = z.object({
  teamId: z.string(),
  eventId: z.string(),
  subteamId: z.string().optional().nullable(),
  maxBudget: z.number().min(0),
  budgetId: z.string().optional(), // For editing existing budgets
})

// GET /api/event-budgets?teamId=xxx
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

    // Get user's membership to check role and subteam
    const membership = await getUserMembership(session.user.id, teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if user is admin
    const isAdminUser = await isAdmin(session.user.id, teamId)

    // Build where clause to filter budgets
    // Admins see all budgets, regular members only see their subteam's budgets or team-wide budgets
    const whereClause: any = {
      teamId,
    }

    if (!isAdminUser) {
      // Non-admin members can only see:
      // 1. Team-wide budgets (subteamId is null)
      // 2. Budgets for their own subteam
      if (membership.subteamId) {
        whereClause.OR = [
          { subteamId: null }, // Team-wide budgets
          { subteamId: membership.subteamId }, // Their subteam's budgets
        ]
      } else {
        // Member without subteam can only see team-wide budgets
        whereClause.subteamId = null
      }
    }
    // If admin, no additional filtering - they see all budgets

    const budgets = await prisma.eventBudget.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            division: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate remaining budget and requested amounts for each event
    const budgetsWithRemaining = await Promise.all(
      budgets.map(async (budget) => {
        // Build where clauses that match the budget's scope (team-wide or subteam-specific)
        const expenseWhere: any = {
          teamId,
          eventId: budget.eventId,
        }
        const requestWhere: any = {
          teamId,
          eventId: budget.eventId,
          status: 'PENDING',
        }

        // If budget is subteam-specific, only count expenses/requests for that subteam
        // For team-wide budgets (subteamId is null), count all expenses/requests for the event
        if (budget.subteamId) {
          expenseWhere.subteamId = budget.subteamId
          requestWhere.subteamId = budget.subteamId
        }

        const [expenses, pendingRequests] = await Promise.all([
          prisma.expense.findMany({
            where: expenseWhere,
            select: {
              amount: true,
            },
          }),
          prisma.purchaseRequest.findMany({
            where: requestWhere,
            select: {
              estimatedAmount: true,
            },
          }),
        ])

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const totalRequested = pendingRequests.reduce((sum, req) => sum + req.estimatedAmount, 0)
        const remaining = budget.maxBudget - totalSpent

        return {
          ...budget,
          totalSpent,
          totalRequested,
          remaining,
        }
      })
    )

    return NextResponse.json({ budgets: budgetsWithRemaining })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get event budgets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/event-budgets
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createEventBudgetSchema.parse(body)

    // Only admins can create/update budgets
    const isAdminUser = await isAdmin(session.user.id, validatedData.teamId)
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admins can manage event budgets' },
        { status: 403 }
      )
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify subteam belongs to team if provided
    if (validatedData.subteamId) {
      const subteam = await prisma.subteam.findUnique({
        where: { id: validatedData.subteamId },
      })
      if (!subteam || subteam.teamId !== validatedData.teamId) {
        return NextResponse.json(
          { error: 'Subteam does not belong to this team' },
          { status: 400 }
        )
      }
    }

    let budget

    // If budgetId is provided, we're editing an existing budget
    if (validatedData.budgetId) {
      const existingBudget = await prisma.eventBudget.findUnique({
        where: { id: validatedData.budgetId },
      })

      if (!existingBudget) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
      }

      // Verify the budget belongs to the team
      if (existingBudget.teamId !== validatedData.teamId) {
        return NextResponse.json(
          { error: 'Budget does not belong to this team' },
          { status: 403 }
        )
      }

      // Check if changing eventId/subteamId would create a duplicate
      const whereClause: any = {
        teamId: validatedData.teamId,
        eventId: validatedData.eventId,
      }
      
      if (validatedData.subteamId) {
        whereClause.subteamId = validatedData.subteamId
      } else {
        whereClause.subteamId = null
      }

      const conflictingBudget = await prisma.eventBudget.findFirst({
        where: {
          ...whereClause,
          id: { not: validatedData.budgetId }, // Exclude the current budget
        },
      })

      if (conflictingBudget) {
        return NextResponse.json(
          { error: 'A budget already exists for this event and subteam combination' },
          { status: 400 }
        )
      }

      // Update the budget with all fields
      budget = await prisma.eventBudget.update({
        where: { id: validatedData.budgetId },
        data: {
          eventId: validatedData.eventId,
          subteamId: validatedData.subteamId || null,
          maxBudget: validatedData.maxBudget,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              division: true,
            },
          },
          subteam: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    } else {
      // Creating a new budget - check if one already exists for this combination
      const whereClause: any = {
        teamId: validatedData.teamId,
        eventId: validatedData.eventId,
      }
      
      if (validatedData.subteamId) {
        whereClause.subteamId = validatedData.subteamId
      } else {
        whereClause.subteamId = null
      }
      
      const existingBudget = await prisma.eventBudget.findFirst({
        where: whereClause,
      })

      if (existingBudget) {
        // Update existing budget instead of creating duplicate
        budget = await prisma.eventBudget.update({
          where: { id: existingBudget.id },
          data: {
            maxBudget: validatedData.maxBudget,
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                division: true,
              },
            },
            subteam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      } else {
        // Create new budget
        budget = await prisma.eventBudget.create({
          data: {
            teamId: validatedData.teamId,
            eventId: validatedData.eventId,
            subteamId: validatedData.subteamId || null,
            maxBudget: validatedData.maxBudget,
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                slug: true,
                division: true,
              },
            },
            subteam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      }
    }

    // Calculate remaining budget and requested amounts (same logic as GET)
    const expenseWhere: any = {
      teamId: validatedData.teamId,
      eventId: budget.eventId,
    }
    const requestWhere: any = {
      teamId: validatedData.teamId,
      eventId: budget.eventId,
      status: 'PENDING',
    }

    if (budget.subteamId) {
      expenseWhere.subteamId = budget.subteamId
      requestWhere.subteamId = budget.subteamId
    }

    const [expenses, pendingRequests] = await Promise.all([
      prisma.expense.findMany({
        where: expenseWhere,
        select: {
          amount: true,
        },
      }),
      prisma.purchaseRequest.findMany({
        where: requestWhere,
        select: {
          estimatedAmount: true,
        },
      }),
    ])

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalRequested = pendingRequests.reduce((sum, req) => sum + req.estimatedAmount, 0)
    const remaining = budget.maxBudget - totalSpent

    const budgetWithRemaining = {
      ...budget,
      totalSpent,
      totalRequested,
      remaining,
    }

    return NextResponse.json({ budget: budgetWithRemaining }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create event budget error:', error)
    if (error instanceof Error) {
      // Check for Prisma errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A budget for this event already exists. Use edit to update it.' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid event or team ID' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

