import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditTestForm } from '@/components/tests/edit-test-form'

export default async function EditTestPage({
  params,
}: {
  params: { teamId: string; testId: string }
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

  const test = await prisma.test.findFirst({
    where: {
      id: params.testId,
      teamId: params.teamId,
    },
    include: {
      assignments: {
        include: {
          subteam: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!test) {
    notFound()
  }

  // Only allow editing DRAFT tests
  if (test.status !== 'DRAFT') {
    redirect(`/teams/${params.teamId}/tests/${test.id}`)
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
    <div className="px-4 py-8 lg:px-8">
      <EditTestForm
        teamId={team.id}
        teamName={team.name}
        subteams={team.subteams}
        test={{
          ...test,
          questions: test.questions.map((q) => ({
            ...q,
            points: Number(q.points),
          })),
        }}
      />
    </div>
  )
}

