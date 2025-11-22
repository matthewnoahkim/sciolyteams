import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireMember, getUserMembership } from '@/lib/rbac'
import { z } from 'zod'

const createPurchaseRequestSchema = z.object({
  teamId: z.string(),
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

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        teamId: validatedData.teamId,
        requesterId: membership.id,
        description: validatedData.description,
        category: validatedData.category,
        estimatedAmount: validatedData.estimatedAmount,
        justification: validatedData.justification,
      },
      include: {
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

