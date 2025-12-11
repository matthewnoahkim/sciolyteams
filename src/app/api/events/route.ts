import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events - Get all events, optionally filtered by division
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const division = searchParams.get('division') as 'B' | 'C' | null

    const where = division ? { division } : {}

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        name: true,
        division: true,
        slug: true,
        maxCompetitors: true,
        selfScheduled: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
