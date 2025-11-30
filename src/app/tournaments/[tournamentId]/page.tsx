import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { TournamentDetailClient } from '@/components/tournament-detail-client'

export default async function TournamentDetailPage({ params }: { params: { tournamentId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Get user's clubs with teams for registration - only clubs where user is admin
  const memberships = await prisma.membership.findMany({
    where: { 
      userId: session.user.id,
      role: Role.ADMIN, // Only get clubs where user is an admin
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

  // Get unique clubs (user might have multiple memberships in same club)
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

  return <TournamentDetailClient tournamentId={params.tournamentId} userTeams={clubsWithTeams} user={session.user} />
}

