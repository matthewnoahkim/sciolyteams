import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TestDetailView } from '@/components/tests/test-detail-view'

interface TestPageProps {
  params: {
    clubId: string
    testId: string
  }
}

export default async function TestPage({ params }: TestPageProps) {
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
  })

  if (!membership) {
    redirect('/dashboard')
  }

  const test = await prisma.test.findUnique({
    where: { id: params.testId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
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
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  })

  if (!test || test.teamId !== params.clubId) {
    redirect(`/clubs/${params.clubId}?tab=tests`)
  }

  return <TestDetailView teamId={params.clubId} test={test} />
}

