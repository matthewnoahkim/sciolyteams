'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, FileText, Shield, CreditCard, LogOut, Trophy } from 'lucide-react'
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
import { TournamentRequests } from '@/components/dev/tournament-requests'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

type Section = 'blog' | 'security' | 'tournaments' | 'payments'

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy },
  { id: 'payments', label: 'Payments', icon: CreditCard },
]

export default function DevPage() {
  const [activeSection, setActiveSection] = useState<Section>(() => {
    if (typeof window !== 'undefined') {
      const savedSection = localStorage.getItem('dev-panel-active-section') as Section
      if (savedSection && ['blog', 'security', 'tournaments', 'payments'].includes(savedSection)) {
        return savedSection
      }
    }
    return 'blog'
  })
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

  // Save active section to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev-panel-active-section', activeSection)
    }
  }, [activeSection])

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background grid-pattern">
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
      <div className="min-h-screen bg-background text-foreground grid-pattern">
        {/* Header - Theme Aware */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" href="/" variant="auto" />
            <ThemeToggle variant="header" />
          </div>
        </header>

        {/* Login Form */}
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Dev Access</h1>
              <p className="text-muted-foreground">
                Enter your development password to continue
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
                <Button 
                  type="submit" 
                  className="w-full h-12"
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

  // Main dev panel with sidebar (club page style)
  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header - Theme Aware */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo size="md" href="/" variant="auto" />
            <span className="text-lg font-semibold text-foreground">Dev Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle variant="header" />
            <button
              onClick={() => {
                setIsAuthenticated(false)
                sessionStorage.removeItem('dev_auth')
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-[65px]">
        {/* Sidebar */}
        <aside className="fixed left-0 top-[65px] bottom-0 w-52 border-r bg-card p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-52 flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {navItems.find(item => item.id === activeSection)?.label}
            </h1>
          </div>

          {activeSection === 'blog' && <BlogManager />}
          
          {activeSection === 'security' && <HealthTools />}
          
          {activeSection === 'tournaments' && <TournamentRequests />}
          
          {activeSection === 'payments' && (
            <div className="p-8 rounded-xl bg-card border">
              <div className="text-center py-16">
                <CreditCard className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                <h2 className="text-xl font-semibold mb-2">Payment Management</h2>
                <p className="text-muted-foreground">Coming soon</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
