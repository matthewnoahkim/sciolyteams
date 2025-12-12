import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TDPortalClient } from '@/components/td-portal-client'
import { TDLoginClient } from '@/components/td-login-client'

export default async function TDPortalPage() {
  const session = await getServerSession(authOptions)

  // If not signed in, show login page
  if (!session?.user?.email) {
    return <TDLoginClient />
  }

  // Check if the user's email has a tournament hosting request
  const requests = await prisma.tournamentHostingRequest.findMany({
    where: {
      directorEmail: {
        equals: session.user.email,
        mode: 'insensitive',
      },
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          division: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // If no requests found for this email, show unauthorized message
  if (requests.length === 0) {
    return <TDLoginClient unauthorized email={session.user.email} />
  }

  // Serialize dates for client component
  const serializedRequests = requests.map(request => ({
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    tournament: request.tournament ? {
      ...request.tournament,
      startDate: request.tournament.startDate.toISOString(),
      endDate: request.tournament.endDate.toISOString(),
    } : null,
  }))

  return <TDPortalClient user={session.user} requests={serializedRequests} />
}

