import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 500, // Limit to last 500 logs
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching logs:', error)
    // Return empty array if table doesn't exist yet
    return NextResponse.json({ logs: [] })
  }
}

