import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { JoinClubPage } from '@/components/join-club-page'

type JoinPageProps = {
  searchParams?: {
    code?: string
    auto?: string
  }
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const session = await getServerSession(authOptions)
  const code = searchParams?.code?.toString() ?? ''
  const autoParam = searchParams?.auto
  const autoJoin = autoParam === 'false' ? false : Boolean(code)

  if (!session?.user) {
    const target = code ? `/join?code=${encodeURIComponent(code)}` : '/join'
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`)
  }

  return <JoinClubPage initialCode={code} autoJoin={autoJoin} />
}
