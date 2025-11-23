import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TakeTestClient } from '@/components/tests/take-test-client'

interface TakeTestPageProps {
  params: {
    clubId: string
    testId: string
  }
}

export default async function TakeTestPage({ params }: TakeTestPageProps) {
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
    redirect(`/clubs/${params.clubId}?tab=tests`)
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
      assignments: true,
    },
  })

  if (!test || test.teamId !== params.clubId) {
    redirect(`/clubs/${params.clubId}?tab=tests`)
  }

  // Check if test is published
  if (test.status !== 'PUBLISHED') {
    redirect(`/clubs/${params.clubId}?tab=tests`)
  }

  return <TakeTestClient test={test} membershipId={membership.id} />
}

