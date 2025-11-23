import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewTestBuilder } from '@/components/tests/new-test-builder'

export default async function NewTestPage({
  params,
}: {
  params: { teamId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId: params.teamId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  })

  if (!membership || String(membership.role) !== 'ADMIN') {
    redirect(`/teams/${params.teamId}?tab=tests`)
  }

  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: {
      id: true,
      name: true,
      subteams: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  })

  if (!team) {
    redirect('/teams')
  }

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <div className="px-4 py-8 lg:px-8">
        <NewTestBuilder teamId={team.id} teamName={team.name} subteams={team.subteams} />
      </div>
    </div>
  )
}

