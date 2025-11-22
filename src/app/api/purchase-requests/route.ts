import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership, isAdmin } from '@/lib/rbac'
import { z } from 'zod'

const createPurchaseRequestSchema = z.object({
  teamId: z.string(),
  eventId: z.string().optional(),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  estimatedAmount: z.number().min(0),
  justification: z.string().optional(),
})

// GET /api/purchase-requests?teamId=xxx
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

    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
      },
    })

    return NextResponse.json({ purchaseRequests })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Get purchase requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/purchase-requests
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPurchaseRequestSchema.parse(body)

    // Get the user's membership
    const membership = await getUserMembership(session.user.id, validatedData.teamId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // If eventId is provided, check budget limits
    // Members can only request against their own subteam's budget (or team-wide if no subteam budget exists)
    if (validatedData.eventId) {
      let budget = null
      
      // First, try to find a subteam-specific budget for the member's subteam
      if (membership.subteamId) {
        budget = await prisma.eventBudget.findFirst({
          where: {
            teamId: validatedData.teamId,
            eventId: validatedData.eventId,
            subteamId: membership.subteamId,
          },
        })
      }
      
      // If no subteam-specific budget exists, check for team-wide budget
      if (!budget) {
        budget = await prisma.eventBudget.findFirst({
          where: {
            teamId: validatedData.teamId,
            eventId: validatedData.eventId,
            subteamId: null,
          },
        })
      }

      // For non-admin members, ensure they can only request against budgets that apply to them
      const isAdminUser = await isAdmin(session.user.id, validatedData.teamId)
      if (!isAdminUser && !budget) {
        return NextResponse.json(
          {
            error: 'No budget available for this event. Please contact an admin to set up a budget for your subteam.',
            code: 'NO_BUDGET',
          },
          { status: 400 }
        )
      }

      // If a budget exists, validate the request
      if (budget) {
        // Calculate current spending
        // For subteam budgets, only count expenses/requests for that subteam
        // For team-wide budgets, count all expenses/requests
        const expenseWhere: any = {
          teamId: validatedData.teamId,
          eventId: validatedData.eventId,
        }
        
        if (budget.subteamId) {
          // Subteam-specific budget: only count expenses for this subteam
          expenseWhere.subteamId = budget.subteamId
        } else {
          // Team-wide budget: count all expenses (subteamId can be null or any value)
        }
        
        const expenses = await prisma.expense.findMany({
          where: expenseWhere,
          select: {
            amount: true,
          },
        })

        // Also count pending requests for the same scope
        const requestWhere: any = {
          teamId: validatedData.teamId,
          eventId: validatedData.eventId,
          status: 'PENDING',
        }
        if (budget.subteamId) {
          requestWhere.subteamId = budget.subteamId
        }
        
        const pendingRequests = await prisma.purchaseRequest.findMany({
          where: requestWhere,
          select: {
            estimatedAmount: true,
          },
        })

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const totalRequested = pendingRequests.reduce((sum, req) => sum + req.estimatedAmount, 0)
        const remaining = budget.maxBudget - totalSpent

        // Check if request exceeds remaining budget
        if (validatedData.estimatedAmount > remaining) {
          if (!isAdminUser) {
            return NextResponse.json(
              {
                error: `Request exceeds remaining budget. Remaining: $${remaining.toFixed(2)}, Requested: $${validatedData.estimatedAmount.toFixed(2)}. Please contact an admin for approval.`,
                code: 'BUDGET_EXCEEDED',
                remaining,
                requested: validatedData.estimatedAmount,
              },
              { status: 400 }
            )
          }
          // Admin can proceed, but we'll note it needs override
        }
      } else {
        // No budget exists for this event - members can still request, but admins should set a budget
        // This is allowed, but we could optionally block it if desired
      }
    }

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        teamId: validatedData.teamId,
        eventId: validatedData.eventId,
        subteamId: membership.subteamId, // Link to requester's subteam
        requesterId: membership.id,
        description: validatedData.description,
        category: validatedData.category,
        estimatedAmount: validatedData.estimatedAmount,
        justification: validatedData.justification,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subteam: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
      },
    })

    return NextResponse.json({ purchaseRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create purchase request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

