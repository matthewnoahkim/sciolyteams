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
        hostingRequest: {
          select: {
            division: true,
          },
        },
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

    // Use hosting request division for display if available (supports "B&C")
    const tournamentsWithDisplayDivision = tournaments.map(t => ({
      ...t,
      division: (t.hostingRequest?.division || t.division) as any,
    }))

    return NextResponse.json({ tournaments: tournamentsWithDisplayDivision })
  } catch (error) {
    console.error('Get public tournaments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

