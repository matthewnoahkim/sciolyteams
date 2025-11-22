import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// WARNING: This endpoint exposes all user data
// Only use in development environments with proper access control

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          include: {
            team: true,
            subteam: true,
          },
        },
        accounts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

