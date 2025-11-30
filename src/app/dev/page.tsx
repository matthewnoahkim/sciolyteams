'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, FileText, Shield, CreditCard, LogOut } from 'lucide-react'
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
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'

type Section = 'blog' | 'security' | 'payments'

const navItems: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'blog', label: 'Blog', icon: FileText, color: 'text-amber-500' },
  { id: 'security', label: 'Security', icon: Shield, color: 'text-blue-500' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-emerald-500' },
]

export default function DevPage() {
  const [activeSection, setActiveSection] = useState<Section>('blog')
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
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 dark:from-violet-600/30 to-fuchsia-500/10 dark:to-fuchsia-600/30 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[120px] animate-blob opacity-60 dark:opacity-100" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 dark:from-cyan-500/25 to-blue-500/10 dark:to-blue-600/25 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 opacity-60 dark:opacity-100" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" href="/" />
            <SignInThemeToggle />
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

  // Main dev panel with sidebar
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-white transition-colors">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 dark:from-violet-600/30 to-fuchsia-500/10 dark:to-fuchsia-600/30 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[120px] animate-blob opacity-60 dark:opacity-100" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 dark:from-cyan-500/25 to-blue-500/10 dark:to-blue-600/25 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 opacity-60 dark:opacity-100" />
        <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-r from-emerald-500/10 dark:from-emerald-500/20 to-teal-500/10 dark:to-teal-600/20 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-[110px] animate-blob animation-delay-4000 opacity-60 dark:opacity-100" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-40 border-r border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5">
          <Logo size="md" href="/" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                  isActive
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? item.color : '')} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-3">
          <SignInThemeToggle />
          <button
            onClick={() => {
              setIsAuthenticated(false)
              sessionStorage.removeItem('dev_auth')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                {navItems.find(item => item.id === activeSection)?.label}
              </span>
            </h1>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {activeSection === 'blog' && <BlogManager />}
          
          {activeSection === 'security' && <HealthTools />}
          
          {activeSection === 'payments' && (
            <div className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-center py-16">
                <CreditCard className="h-16 w-16 mx-auto mb-6 text-gray-300 dark:text-white/20" />
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Payment Management</h2>
                <p className="text-gray-500 dark:text-white/50">Coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm">
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-white/40">
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
              </div>
              <p className="text-sm text-gray-400 dark:text-white/30">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
