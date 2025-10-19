import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HomeClient } from '@/components/home-client'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      team: true,
      subteam: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <HomeClient memberships={memberships} user={session.user} />
}

