import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TournamentPageClient } from '@/components/tournament-page-client'

interface Props {
  params: { slug: string }
}

export default async function TournamentSlugPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  // First, try to find by hosting request slug/name
  const hostingRequest = await prisma.tournamentHostingRequest.findFirst({
    where: {
      OR: [
        { preferredSlug: params.slug },
        { 
          tournamentName: {
            equals: params.slug.replace(/-/g, ' '),
            mode: 'insensitive'
          }
        }
      ],
      status: 'APPROVED'
    }
  })

  if (!hostingRequest) {
    notFound()
  }

  // Check if user is the tournament director
  const isDirector = session?.user?.email?.toLowerCase() === hostingRequest.directorEmail.toLowerCase()

  return (
    <TournamentPageClient 
      hostingRequest={hostingRequest}
      isDirector={isDirector}
      user={session?.user}
    />
  )
}

