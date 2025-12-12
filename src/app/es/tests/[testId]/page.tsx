import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewTestBuilder } from '@/components/tests/new-test-builder'

interface Props {
  params: Promise<{ testId: string }>
}

export default async function ESEditTestPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/es')
  }

  const { testId } = await params

  // Find the ES test and verify ownership
  const esTest = await prisma.eSTest.findUnique({
    where: { id: testId },
    include: {
      staff: {
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              division: true,
            },
          },
        },
      },
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      questions: {
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!esTest) {
    notFound()
  }

  // Verify this test belongs to the user
  const isOwner = esTest.staff.userId === session.user.id || 
    esTest.staff.email.toLowerCase() === session.user.email.toLowerCase()

  if (!isOwner) {
    redirect('/es')
  }

  // Format the test for the builder
  const formattedTest = {
    id: esTest.id,
    name: esTest.name,
    description: esTest.description,
    instructions: esTest.instructions,
    durationMinutes: esTest.durationMinutes,
    maxAttempts: null,
    scoreReleaseMode: 'NONE' as const,
    randomizeQuestionOrder: false,
    randomizeOptionOrder: false,
    requireFullscreen: false,
    allowCalculator: false,
    calculatorType: null,
    allowNoteSheet: false,
    noteSheetInstructions: null,
    status: esTest.status as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
    assignments: [],
    questions: esTest.questions.map(q => ({
      id: q.id,
      type: q.type,
      promptMd: q.promptMd,
      explanation: q.explanation,
      points: Number(q.points),
      shuffleOptions: q.shuffleOptions,
      options: q.options.map(o => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
        order: o.order,
      })),
    })),
  }

  return (
    <NewTestBuilder
      esMode={true}
      staffMembershipId={esTest.staff.id}
      tournamentId={esTest.staff.tournament.id}
      tournamentName={esTest.staff.tournament.name}
      tournamentDivision={esTest.staff.tournament.division}
      eventId={esTest.event?.id}
      eventName={esTest.event?.name}
      test={formattedTest}
    />
  )
}

