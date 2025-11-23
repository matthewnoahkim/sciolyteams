import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditTestForm from '@/components/tests/edit-test-form'

interface EditTestPageProps {
  params: {
    clubId: string
    testId: string
  }
}

export default async function EditTestPage({ params }: EditTestPageProps) {
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
    },
  })

  if (!test || test.teamId !== params.clubId) {
    redirect(`/clubs/${params.clubId}?tab=tests`)
  }

  return <EditTestForm teamId={params.clubId} test={test} />
}

