import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/signin-button'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { ArrowLeft } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm">
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
          <div className="space-y-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 md:p-12 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Logo size="lg" showText={false} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  Welcome
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Sign in to access your teams
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <SignInButton callbackUrl={callbackUrl} />

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
