import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Home, LayoutDashboard } from 'lucide-react'

export default async function NotFound() {
  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session?.user
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <HomeNav variant="light" />
            <ThemeToggle variant="header" />
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              <button className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-white text-teamy-primary rounded-full hover:bg-white/90 transition-colors whitespace-nowrap shadow-sm">
                {isLoggedIn ? "Dashboard" : "Sign In"}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 bg-slate-50 dark:bg-slate-900 grid-pattern">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* 404 Number */}
          <div className="space-y-4">
            <h1 className="text-8xl sm:text-9xl md:text-[12rem] font-extrabold text-foreground/20 dark:text-foreground/10">
              404
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-center pt-4">
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                {isLoggedIn ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                  </>
                ) : (
                  <>
                    <Home className="h-4 w-4" />
                    Go to Home
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

