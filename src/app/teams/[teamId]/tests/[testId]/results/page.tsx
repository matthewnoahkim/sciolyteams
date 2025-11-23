import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserMembership } from '@/lib/rbac'
import { ViewResultsClient } from '@/components/tests/view-results-client'

export default async function TestResultsPage({
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
      releaseScoresAt: true,
      scoreReleaseMode: true,
      status: true,
    },
  })

  if (!test) {
    notFound()
  }

  // Fetch attempt directly from database
  const attempt = await prisma.testAttempt.findFirst({
    where: {
      membershipId: membership.id,
      testId: params.testId,
      status: {
        in: ['SUBMITTED', 'GRADED'],
      },
    },
    include: {
      answers: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  })

  if (!attempt) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
          <p className="text-muted-foreground">
            You haven't submitted any attempts for this test yet.
          </p>
        </div>
      </div>
    )
  }

  // Sort answers by question order
  const sortedAnswers = attempt.answers.sort((a, b) => a.question.order - b.question.order)

  return (
    <ViewResultsClient
      testId={test.id}
      testName={test.name}
      attempt={attempt}
      testSettings={{
        releaseScoresAt: test.releaseScoresAt,
        scoreReleaseMode: test.scoreReleaseMode || 'SCORE_ONLY',
      }}
    />
  )
}

