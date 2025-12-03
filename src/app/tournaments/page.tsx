import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PublicTournamentsPage } from '@/components/public-tournaments-page'

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect them to the dashboard tournaments page
  if (session?.user) {
    redirect('/dashboard/tournaments')
  }

  return <PublicTournamentsPage />
}
