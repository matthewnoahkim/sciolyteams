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
  const tournamentsData = await prisma.tournament.findMany({
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

  // Serialize dates to strings for client component
  const tournaments = tournamentsData.map((t) => ({
    id: t.id,
    name: t.name,
    division: t.division,
    description: t.description,
    price: t.price,
    isOnline: t.isOnline,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    startTime: t.startTime.toISOString(),
    endTime: t.endTime.toISOString(),
    location: t.location,
    _count: t._count,
  }))

  return <PublicTournamentsClient tournaments={tournaments} />
}

