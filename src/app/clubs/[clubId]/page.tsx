import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeamPage } from '@/components/team-page'

interface ClubPageProps {
  params: {
    clubId: string
  }
}

export default async function ClubPage({ params }: ClubPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

  // Verify membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      teamId: params.clubId,
    },
    include: {
      team: {
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
            },
          },
        },
      },
      subteam: true,
    },
  })

  if (!membership) {
    redirect('/dashboard')
  }

  return <TeamPage team={membership.team} currentMembership={membership} user={session.user} />
}

