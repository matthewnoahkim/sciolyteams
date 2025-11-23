import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NewTestBuilder from '@/components/tests/new-test-builder'

interface NewTestPageProps {
  params: {
    clubId: string
  }
}

export default async function NewTestPage({ params }: NewTestPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/signin')
  }

  // Verify membership and admin status
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      teamId: params.clubId,
    },
  })

  if (!membership || membership.role !== 'ADMIN') {
    redirect(`/clubs/${params.clubId}?tab=tests`)
  }

  return <NewTestBuilder teamId={params.clubId} />
}

