'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ChevronDown, ChevronRight, FileText, Shield, CreditCard, Moon, Sun } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HealthTools } from '@/components/dev/health-tools'
import { BlogManager } from '@/components/dev/blog-manager'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Logo } from '@/components/logo'

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400 dark:text-white/40" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 dark:text-white/40" />
        )}
      </button>
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-6 pb-6 pt-2 space-y-6 border-t border-gray-100 dark:border-white/[0.06]">
          {children}
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10">
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600" />
      )}
    </button>
  )
}

export default function DevPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dev_auth') === 'true'
    }
    return false
  })
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/dev/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem('dev_auth', 'true')
        setPassword('')
      } else {
        if (data.debug) {
          console.error('Password verification failed:', data.debug)
        }
        setErrorDialogOpen(true)
        setPassword('')
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setErrorDialogOpen(true)
      setPassword('')
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('dev_auth') === 'true'
      setIsAuthenticated(authStatus)
    }
    setIsCheckingAuth(false)
  }, [])

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] transition-colors">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-white transition-colors">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Gradient orbs - subtle in light mode */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 dark:from-violet-600/30 to-fuchsia-500/10 dark:to-fuchsia-600/30 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[120px] animate-blob opacity-60 dark:opacity-100" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 dark:from-cyan-500/25 to-blue-500/10 dark:to-blue-600/25 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 opacity-60 dark:opacity-100" />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[size:100px_100px]" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" href="/" />
            <ThemeToggle />
          </div>
        </header>

        {/* Login Form */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                  Dev Access
                </span>
              </h1>
              <p className="text-gray-500 dark:text-white/50">
                Enter your development password to continue
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] backdrop-blur-sm">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-gray-50 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.1] focus:ring-violet-500"
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl"
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Access Dev Panel'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Error Dialog */}
        <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 dark:bg-red-500/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <DialogTitle>Incorrect Password</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                The password you entered is incorrect. Please try again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setErrorDialogOpen(false)}>
                Try Again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Main dev panel
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-white transition-colors">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs - subtle in light mode */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 dark:from-violet-600/30 to-fuchsia-500/10 dark:to-fuchsia-600/30 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[120px] animate-blob opacity-60 dark:opacity-100" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 dark:from-cyan-500/25 to-blue-500/10 dark:to-blue-600/25 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 opacity-60 dark:opacity-100" />
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-r from-emerald-500/10 dark:from-emerald-500/20 to-teal-500/10 dark:to-teal-600/20 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[110px] animate-blob animation-delay-4000 opacity-60 dark:opacity-100" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[size:100px_100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false)
                sessionStorage.removeItem('dev_auth')
              }}
              className="border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Development Panel
              </span>
            </h1>
            <p className="text-gray-500 dark:text-white/50">
              Manage blog posts, monitor system activity, and handle payments
            </p>
          </div>

          {/* Blog Section */}
          <Section
            title="Blog"
            icon={<FileText className="h-5 w-5 text-amber-500" />}
            defaultOpen={true}
          >
            <BlogManager />
          </Section>

          {/* Security Section */}
          <Section
            title="Security"
            icon={<Shield className="h-5 w-5 text-blue-500" />}
            defaultOpen={false}
          >
            <HealthTools />
          </Section>

          {/* Payments Section */}
          <Section
            title="Payments"
            icon={<CreditCard className="h-5 w-5 text-emerald-500" />}
            defaultOpen={false}
          >
            <div className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-white/20" />
                <p className="text-gray-500 dark:text-white/50">Payment management coming soon</p>
              </div>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-white/40">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-gray-400 dark:text-white/30">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
