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

  // Get user's teams with subteams for registration - only teams where user is admin
  const memberships = await prisma.membership.findMany({
    where: { 
      userId: session.user.id,
      role: Role.ADMIN, // Only get teams where user is an admin
    },
    include: {
      team: {
        include: {
          subteams: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Get unique teams (user might have multiple memberships in same team)
  const uniqueTeams = new Map()
  for (const membership of memberships) {
    if (!uniqueTeams.has(membership.team.id)) {
      uniqueTeams.set(membership.team.id, {
        id: membership.team.id,
        name: membership.team.name,
        division: membership.team.division,
        subteams: membership.team.subteams || [],
      })
    }
  }

  const teamsWithSubteams = Array.from(uniqueTeams.values())

  return <TournamentDetailClient tournamentId={params.tournamentId} userTeams={teamsWithSubteams} user={session.user} />
}

