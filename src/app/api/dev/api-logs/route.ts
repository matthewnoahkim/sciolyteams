import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const method = searchParams.get('method')
    const route = searchParams.get('route')
    const statusCode = searchParams.get('statusCode')
    const userId = searchParams.get('userId')
    const minExecutionTime = searchParams.get('minExecutionTime')
    const errorsOnly = searchParams.get('errorsOnly') === 'true'
    const slowOnly = searchParams.get('slowOnly') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (method) {
      where.method = method
    }
    
    if (route) {
      where.route = { contains: route, mode: 'insensitive' }
    }
    
    if (statusCode) {
      where.statusCode = parseInt(statusCode, 10)
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (errorsOnly) {
      where.statusCode = { gte: 400 }
    }
    
    if (slowOnly) {
      where.executionTime = { gte: 1000 } // 1 second or more
    }
    
    if (minExecutionTime) {
      where.executionTime = { gte: parseInt(minExecutionTime, 10) }
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
      prisma.apiLog.findMany({
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
      prisma.apiLog.count({ where }),
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
    console.error('Error fetching API logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API logs', logs: [] },
      { status: 500 }
    )
  }
}

