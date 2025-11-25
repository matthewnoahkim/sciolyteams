'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HealthTools } from '@/components/dev/health-tools'
import { Skeleton } from '@/components/ui/skeleton'

// WARNING: This is a development-only page
// DO NOT use this pattern in production environments
// This page should be removed or properly secured before deployment

export default function DevPage() {
  // Check sessionStorage immediately on mount to avoid flash of login screen
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
        setPassword('') // Clear password on success
      } else {
        // Log debug info if available
        if (data.debug) {
          console.error('Password verification failed:', data.debug)
        }
        setErrorDialogOpen(true)
        setPassword('') // Clear password on error
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setErrorDialogOpen(true)
      setPassword('') // Clear password on error
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    // Check if already authenticated in this session
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('dev_auth') === 'true'
      setIsAuthenticated(authStatus)
    }
    setIsCheckingAuth(false)
  }, [])

  // Show loading state while checking authentication to prevent flash
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dev Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Access Dev Panel'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Incorrect Password Error Dialog */}
        <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Development Panel</h1>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false)
              sessionStorage.removeItem('dev_auth')
            }}
          >
            Logout
          </Button>
        </div>

        <div className="bg-destructive/10 border border-destructive p-4 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Development Only</p>
            <p className="text-sm text-muted-foreground">
              This page contains sensitive data and should be removed before production deployment.
            </p>
          </div>
        </div>

        <HealthTools />
      </div>
    </div>
  )
}
