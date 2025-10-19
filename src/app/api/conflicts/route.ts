import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Division } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const division = searchParams.get('division') as Division | null

    if (!division) {
      return NextResponse.json({ error: 'Division parameter required' }, { status: 400 })
    }

    const conflictGroups = await prisma.conflictGroup.findMany({
      where: { division },
      include: {
        events: {
          include: {
            event: true,
          },
        },
      },
      orderBy: {
        blockNumber: 'asc',
      },
    })

    return NextResponse.json({ conflictGroups })
  } catch (error) {
    console.error('Get conflicts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

