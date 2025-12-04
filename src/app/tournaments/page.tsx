import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HostingTournamentsPage } from '@/components/hosting-tournaments-page'

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions)

  // Allow both logged-in and logged-out users to view public tournaments
  return <HostingTournamentsPage />
}
