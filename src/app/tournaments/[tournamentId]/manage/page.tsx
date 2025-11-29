import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TournamentManageClient } from '@/components/tournament-manage-client'

async function isTournamentAdmin(userId: string, tournamentId: string): Promise<boolean> {
  console.log(`[isTournamentAdmin] Starting check for userId: ${userId}, tournamentId: ${tournamentId}`)
  
  // Check if user is in TournamentAdmin table
  const admin = await prisma.tournamentAdmin.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
  })
  
  console.log(`[isTournamentAdmin] Admin record found: ${!!admin}`)
  
  // Also check if user is the creator (creators should always have admin access)
  if (!admin) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { createdById: true },
    })
    if (tournament && tournament.createdById === userId) {
      console.log(`[isTournamentAdmin] User is creator, granting access`)
      return true
    }
  }
  
  // Always log debug info
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, name: true, createdById: true } })
  const allAdmins = await prisma.tournamentAdmin.findMany({
    where: { tournamentId },
    include: { user: { select: { id: true, email: true } } }
  })
  console.log(`[isTournamentAdmin] User ${userId} (${user?.email || 'not found'}) checking tournament ${tournamentId} (${tournament?.name || 'not found'})`)
  console.log(`[isTournamentAdmin] Tournament creator: ${tournament?.createdById}`)
  console.log(`[isTournamentAdmin] Current admins:`, allAdmins.map(a => ({ userId: a.userId, email: a.user.email })))
  console.log(`[isTournamentAdmin] Final result: ${!!admin}`)
  
  return !!admin
}

export default async function TournamentManagePage({ params }: { params: Promise<{ tournamentId: string }> | { tournamentId: string } }) {
  console.log(`[Tournament Manage Page] Page component starting`)
  
  const session = await getServerSession(authOptions)
  console.log(`[Tournament Manage Page] Session user: ${session?.user?.id} (${session?.user?.email})`)

  if (!session?.user) {
    console.log(`[Tournament Manage Page] No session, redirecting to login`)
    redirect('/login')
  }

  // Handle both Promise and direct params (Next.js 15 compatibility)
  const resolvedParams = params instanceof Promise ? await params : params
  const tournamentId = resolvedParams.tournamentId
  console.log(`[Tournament Manage Page] Resolved tournamentId: ${tournamentId}`)

  // Check if user is tournament admin
  console.log(`[Tournament Manage Page] Calling isTournamentAdmin for user ${session.user.id} and tournament ${tournamentId}`)
  const isAdmin = await isTournamentAdmin(session.user.id, tournamentId)
  
  console.log(`[Tournament Manage Page] User ${session.user.id} (${session.user.email}) checking access to tournament ${tournamentId}`)
  console.log(`[Tournament Manage Page] isAdmin result: ${isAdmin}`)
  
  if (!isAdmin) {
    // User is not an admin, redirect to tournament detail page
    console.log(`[Tournament Manage Page] Access denied - redirecting to tournament detail page`)
    redirect(`/tournaments/${tournamentId}`)
  }

  console.log(`[Tournament Manage Page] Access granted, rendering TournamentManageClient`)
  return <TournamentManageClient tournamentId={tournamentId} user={session.user} />
}

