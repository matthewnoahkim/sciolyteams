import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// WARNING: This endpoint exposes all user data
// Only use in development environments with proper access control

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Search parameters
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const teamId = searchParams.get('teamId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { id: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        memberships: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                division: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          ...(teamId ? {
            where: { clubId: teamId },
          } : {}),
          ...(role ? {
            where: { role: role as any },
          } : {}),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // If we need total count for pagination
    const total = await prisma.user.count({ where })

    // Filter by role or teamId in memberships if specified
    let filteredUsers = users
    if (role || teamId) {
      filteredUsers = users.filter(user => {
        if (!user.memberships || user.memberships.length === 0) return false
        if (teamId && !user.memberships.some(m => m.clubId === teamId)) return false
        if (role && !user.memberships.some(m => m.role === role)) return false
        return true
      })
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
