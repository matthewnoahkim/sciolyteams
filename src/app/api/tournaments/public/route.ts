import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint to get approved upcoming tournaments (no auth required)
// GET /api/tournaments/public
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const division = searchParams.get('division') as 'B' | 'C' | null

    const where: any = {
      approved: true,
      startTime: {
        gt: new Date(), // Only upcoming tournaments
      },
    }

    if (division) {
      where.division = division
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 50, // Limit to 50 tournaments
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Get public tournaments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

