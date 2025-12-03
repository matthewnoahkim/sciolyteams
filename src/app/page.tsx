import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { ScrollAnimate } from '@/components/scroll-animate'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header - Blue */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary shadow-nav">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <HomeNav variant="hero" />
            <div className="hidden sm:block">
              <SignInThemeToggle variant="header" />
            </div>
            <Link href="/login">
              <button className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-white text-teamy-primary rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Takes remaining height */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 bg-slate-50 dark:bg-slate-900 grid-pattern">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <ScrollAnimate animation="elegant" delay={0} duration={800}>
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-teamy-primary/10 dark:bg-teamy-primary/20 border border-teamy-primary/20">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-teamy-primary" />
              <span className="text-xs sm:text-sm font-semibold text-teamy-primary">Built for Science Olympiad</span>
            </div>
          </ScrollAnimate>

          {/* Main heading */}
          <ScrollAnimate animation="elegant" delay={100} duration={900}>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none text-foreground">
              Teamy
            </h1>
          </ScrollAnimate>

          {/* Tagline */}
          <ScrollAnimate animation="elegant" delay={200} duration={900}>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed px-4">
              The complete platform for managing your Science Olympiad team
            </p>
          </ScrollAnimate>

          {/* CTA Buttons */}
          <ScrollAnimate animation="bounce-in" delay={300} duration={800}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Link href="/login" className="w-full sm:w-auto">
                <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-teamy-primary text-white rounded-full shadow-lg hover:bg-teamy-primary-dark hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/features" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-foreground border-2 border-border hover:border-teamy-primary/50 hover:bg-teamy-primary/5 rounded-full transition-all duration-300">
                  View Features
                </button>
              </Link>
            </div>
          </ScrollAnimate>

          {/* Stats */}
          <ScrollAnimate animation="fade-scale" delay={500} duration={800}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-8 text-muted-foreground">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">100%</div>
                <div className="text-sm font-medium">Free to start</div>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">2026</div>
                <div className="text-sm font-medium">Events included</div>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">AI</div>
                <div className="text-sm font-medium">Powered grading</div>
              </div>
            </div>
          </ScrollAnimate>
        </div>
      </section>

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
