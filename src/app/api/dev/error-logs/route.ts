import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const errorType = searchParams.get('errorType')
    const severity = searchParams.get('severity')
    const route = searchParams.get('route')
    const userId = searchParams.get('userId')
    const resolved = searchParams.get('resolved')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (errorType) {
      where.errorType = { contains: errorType, mode: 'insensitive' }
    }
    
    if (severity) {
      where.severity = severity
    }
    
    if (route) {
      where.route = { contains: route, mode: 'insensitive' }
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true'
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error logs', logs: [] },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, resolved } = body

    if (!id || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const errorLog = await prisma.errorLog.update({
      where: { id },
      data: { resolved },
    })

    return NextResponse.json({ log: errorLog })
  } catch (error) {
    console.error('Error updating error log:', error)
    return NextResponse.json(
      { error: 'Failed to update error log' },
      { status: 500 }
    )
  }
}

