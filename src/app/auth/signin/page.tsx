import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/signin-button'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { Users } from 'lucide-react'

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string
  }
}

const DEFAULT_CALLBACK_URL = '/'

function resolveCallbackUrl(rawCallbackUrl?: string) {
  if (!rawCallbackUrl) {
    return DEFAULT_CALLBACK_URL
  }

  if (rawCallbackUrl.startsWith('/')) {
    return rawCallbackUrl
  }

  try {
    const url = new URL(rawCallbackUrl)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    // Ignore parsing errors and fallback to default
  }

  return DEFAULT_CALLBACK_URL
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions)
  const callbackUrl = resolveCallbackUrl(searchParams?.callbackUrl)

  if (session?.user) {
    redirect(callbackUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <div className="absolute top-6 right-6">
        <SignInThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary-light dark:bg-gradient-primary-dark text-white shadow-xl">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">SciOly Clubs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Science Olympiad club management platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <SignInButton callbackUrl={callbackUrl} />
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

