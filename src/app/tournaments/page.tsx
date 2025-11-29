import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TournamentsClient } from '@/components/tournaments-client'

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return <TournamentsClient user={session.user} />
}

