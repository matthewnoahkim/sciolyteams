import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/signin-button'
import { Users } from 'lucide-react'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">SciOly Teams</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Science Olympiad team management platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <SignInButton />
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

