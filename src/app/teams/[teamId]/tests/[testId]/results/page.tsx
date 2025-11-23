import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership } from '@/lib/rbac'
import { ViewResultsClient } from '@/components/tests/view-results-client'

export default async function ViewResultsPage({
  params,
}: {
  params: { teamId: string; testId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const membership = await getUserMembership(session.user.id, params.teamId)
  if (!membership) {
    redirect('/teams')
  }

  const test = await prisma.test.findFirst({
    where: {
      id: params.testId,
      teamId: params.teamId,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!test) {
    notFound()
  }

  return <ViewResultsClient testId={params.testId} teamId={params.teamId} />
}

