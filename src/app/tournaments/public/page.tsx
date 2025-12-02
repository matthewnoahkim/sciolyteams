import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PublicTournamentsClient } from '@/components/public-tournaments-client'

export default async function PublicTournamentsPage() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect them to the authenticated tournaments page
  if (session?.user) {
    redirect('/tournaments')
  }

  // Fetch approved upcoming tournaments
  const tournaments = await prisma.tournament.findMany({
    where: {
      approved: true,
      startTime: {
        gt: new Date(), // Only upcoming tournaments
      },
    },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 50, // Limit to 50 tournaments
  })

  return <PublicTournamentsClient tournaments={tournaments} />
}

