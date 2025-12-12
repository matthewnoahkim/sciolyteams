import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { TournamentDetailClient } from '@/components/tournament-detail-client'
import { TournamentPageClient } from '@/components/tournament-page-client'

interface Props {
  params: { param: string }
}

export default async function TournamentPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const { param } = params

  // First, try to find a tournament by ID (for registration view)
  const tournament = await prisma.tournament.findUnique({
    where: { id: param },
    select: { id: true }
  })

  if (tournament) {
    // This is a tournament ID - show registration/detail view
    if (!session?.user) {
      redirect('/login')
    }

    // Get user's clubs with teams for registration - only clubs where user is admin
    const memberships = await prisma.membership.findMany({
      where: { 
        userId: session.user.id,
        role: Role.ADMIN,
      },
      include: {
        club: {
          include: {
            teams: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Get unique clubs
    const uniqueClubs = new Map()
    for (const membership of memberships) {
      if (!uniqueClubs.has(membership.club.id)) {
        uniqueClubs.set(membership.club.id, {
          id: membership.club.id,
          name: membership.club.name,
          division: membership.club.division,
          teams: membership.club.teams || [],
        })
      }
    }

    const clubsWithTeams = Array.from(uniqueClubs.values())

    return <TournamentDetailClient tournamentId={param} userTeams={clubsWithTeams} user={session.user} />
  }

  // Not a tournament ID - try to find by slug (public tournament page)
  const hostingRequest = await prisma.tournamentHostingRequest.findFirst({
    where: {
      OR: [
        { preferredSlug: param },
        { 
          tournamentName: {
            equals: param.replace(/-/g, ' '),
            mode: 'insensitive'
          }
        }
      ],
      status: 'APPROVED'
    }
  })

  if (!hostingRequest) {
    notFound()
  }

  // Check if user is the tournament director
  const isDirector = session?.user?.email?.toLowerCase() === hostingRequest.directorEmail.toLowerCase()

  return (
    <TournamentPageClient 
      hostingRequest={hostingRequest}
      isDirector={isDirector}
      user={session?.user}
    />
  )
}

