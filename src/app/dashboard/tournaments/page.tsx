import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardTournamentsClient } from '@/components/dashboard-tournaments-client'

export default async function DashboardTournamentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return <DashboardTournamentsClient user={session.user} />
}

