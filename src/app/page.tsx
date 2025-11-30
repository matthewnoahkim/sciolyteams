import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { ScrollAnimate } from '@/components/scroll-animate'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/25 to-blue-600/25 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-full mix-blend-screen filter blur-[110px] animate-blob animation-delay-4000" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E")' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-6">
            <HomeNav />
            <SignInThemeToggle />
            <Link href="/login">
              <button className="px-5 py-2.5 text-sm font-semibold bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 pt-20">
          {/* Badge */}
          <ScrollAnimate animation="elegant" delay={0} duration={800}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-white/80">Built for Science Olympiad</span>
            </div>
          </ScrollAnimate>

          {/* Main heading */}
          <ScrollAnimate animation="elegant" delay={100} duration={900}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none">
              <span className="block bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Teamy
              </span>
            </h1>
          </ScrollAnimate>

          {/* Tagline */}
          <ScrollAnimate animation="elegant" delay={200} duration={900}>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
              The complete platform for managing your Science Olympiad team
            </p>
          </ScrollAnimate>

          {/* CTA Buttons */}
          <ScrollAnimate animation="bounce-in" delay={300} duration={800}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/login">
                <button className="group px-8 py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/features">
                <button className="px-8 py-4 text-lg font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 hover:bg-white/5">
                  View Features
                </button>
              </Link>
            </div>
          </ScrollAnimate>

          {/* Stats */}
          <ScrollAnimate animation="fade-scale" delay={500} duration={800}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-16 text-white/40">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">100%</div>
                <div className="text-sm">Free to start</div>
              </div>
              <div className="h-12 w-px bg-white/10 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">2026</div>
                <div className="text-sm">Events included</div>
              </div>
              <div className="h-12 w-px bg-white/10 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">AI</div>
                <div className="text-sm">Powered grading</div>
              </div>
            </div>
          </ScrollAnimate>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-white/30">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
