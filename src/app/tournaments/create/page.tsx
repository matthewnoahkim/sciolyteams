import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateTournamentClient } from '@/components/create-tournament-client'

export default async function CreateTournamentPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return <CreateTournamentClient user={session.user} />
}

