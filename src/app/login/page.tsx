import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/signin-button'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { Users2 } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string
  }
}

const DEFAULT_CALLBACK_URL = '/dashboard'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <SignInThemeToggle />
        </div>
      </header>

      {/* Sign In Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="space-y-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Users2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign in to access your teams
              </p>
            </div>

            <div className="space-y-6">
              <SignInButton callbackUrl={callbackUrl} />

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                <p>
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              ← Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

