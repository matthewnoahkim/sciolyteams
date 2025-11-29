import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Division } from '@prisma/client'

// Helper to check if user is tournament admin
async function isTournamentAdmin(userId: string, tournamentId: string): Promise<boolean> {
  const admin = await prisma.tournamentAdmin.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
  })
  return !!admin
}

const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  division: z.enum(['B', 'C']),
  description: z.string().optional(),
  price: z.number().min(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
})

// GET /api/tournaments?division=B&search=name&upcoming=true
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const division = searchParams.get('division') as Division | null
    const search = searchParams.get('search')
    const upcomingParam = searchParams.get('upcoming')
    const createdByParam = searchParams.get('createdBy')
    const sortBy = searchParams.get('sortBy') || 'date-asc'
    // Only filter by upcoming if explicitly set to 'true'
    // If not provided or 'false', return ALL tournaments (past and future)
    const upcoming = upcomingParam === 'true'
    // Filter by creator if 'me' is passed (current user) or a specific user ID
    const createdBy = createdByParam === 'me' ? session.user.id : createdByParam

    const where: any = {}
    
    if (division) {
      where.division = division
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }
    
    if (createdBy) {
      where.createdById = createdBy
    }
    
    // Only filter by date if upcoming is explicitly 'true'
    // When upcoming is false, null, or not provided, return all tournaments
    if (upcoming) {
      // Use startTime for comparison to get tournaments that haven't started yet
      // Create a new Date object to get the current moment
      const now = new Date()
      // Filter out tournaments where startTime is less than or equal to now
      // Only show tournaments where startTime is greater than now (haven't started yet)
      where.startTime = {
        gt: now,
      }
    }

    // Determine orderBy based on sortBy parameter
    let orderBy: any = { startDate: 'asc' } // default
    
    if (sortBy === 'date-asc') {
      orderBy = { startDate: 'asc' }
    } else if (sortBy === 'date-desc') {
      orderBy = { startDate: 'desc' }
    } else if (sortBy === 'price-asc') {
      orderBy = { price: 'asc' }
    } else if (sortBy === 'price-desc') {
      orderBy = { price: 'desc' }
    } else if (sortBy === 'popularity-desc' || sortBy === 'popularity-asc') {
      // For popularity, we need to sort by registration count
      // This requires a more complex query, so we'll fetch and sort in memory
      orderBy = { startDate: 'asc' } // temporary, will sort after
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            subteam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy,
    })

    // Add isCreator and isAdmin flags to each tournament for the current user
    const tournamentsWithFlags = await Promise.all(
      tournaments.map(async (tournament) => {
        const isCreator = tournament.createdById === session.user.id
        const isAdmin = await isTournamentAdmin(session.user.id, tournament.id)
        return {
          ...tournament,
          isCreator,
          isAdmin: isAdmin || isCreator, // Admins include creators
        }
      })
    )

    // Sort by popularity if needed (since we can't easily do this in Prisma)
    if (sortBy === 'popularity-desc') {
      tournamentsWithFlags.sort((a, b) => b._count.registrations - a._count.registrations)
    } else if (sortBy === 'popularity-asc') {
      tournamentsWithFlags.sort((a, b) => a._count.registrations - b._count.registrations)
    }

    // Additional client-side filter as safety check if upcoming filter is active
    // This ensures tournaments that have already started are filtered out even if DB comparison fails
    let filteredTournaments = tournamentsWithFlags
    if (upcoming) {
      const now = new Date()
      filteredTournaments = tournamentsWithFlags.filter((tournament) => {
        const startTime = new Date(tournament.startTime)
        return startTime > now
      })
    }

    return NextResponse.json({ tournaments: filteredTournaments })
  } catch (error) {
    console.error('Get tournaments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tournaments
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createTournamentSchema.parse(body)

    // Create tournament and make creator an admin
    const result = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.create({
        data: {
          name: validated.name,
          division: validated.division as Division,
          description: validated.description,
          price: validated.price,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          startTime: new Date(validated.startTime),
          endTime: new Date(validated.endTime),
          location: validated.location,
          createdById: session.user.id,
        },
      })

      // Make creator an admin
      await tx.tournamentAdmin.create({
        data: {
          tournamentId: tournament.id,
          userId: session.user.id,
        },
      })

      return tournament
    })

    return NextResponse.json({ tournament: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Create tournament error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
  }
}

