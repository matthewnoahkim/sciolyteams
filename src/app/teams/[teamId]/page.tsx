import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeamPage } from '@/components/team-page'

export default async function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check membership
  const membership = await prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId: params.teamId,
      },
    },
  })

  if (!membership) {
    redirect('/')
  }

  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          subteam: true,
          rosterAssignments: {
            include: {
              event: true,
            },
          },
        },
      },
      subteams: {
        include: {
          members: {
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
          },
          _count: {
            select: {
              rosterAssignments: true,
            },
          },
        },
      },
    },
  })

  if (!team) {
    redirect('/')
  }

  return (
    <TeamPage
      team={team}
      currentMembership={membership}
      user={session.user}
    />
  )
}

