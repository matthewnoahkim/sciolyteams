'use client'

import { signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClipboardList, AlertCircle, Calendar, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface InviteInfo {
  id: string
  email: string
  name: string | null
  role: 'EVENT_SUPERVISOR' | 'TOURNAMENT_DIRECTOR'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  tournament: {
    id: string
    name: string
    division: string
    startDate: string
    endDate: string
  }
  events: Array<{
    event: {
      id: string
      name: string
    }
  }>
}

interface ESLoginClientProps {
  unauthorized?: boolean
  email?: string
  inviteInfo?: InviteInfo | null
  token?: string
}

export function ESLoginClient({ unauthorized, email, inviteInfo, token }: ESLoginClientProps) {
  const handleSignIn = () => {
    signIn('google', { callbackUrl: token ? `/es?token=${token}` : '/es' })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: token ? `/es?token=${token}` : '/es' })
  }

  const roleLabel = inviteInfo?.role === 'EVENT_SUPERVISOR' ? 'Event Supervisor' : 'Tournament Director'

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-200/50 dark:border-emerald-800/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" />
            <div className="h-6 w-px bg-emerald-300 dark:bg-emerald-700" />
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Event Supervisor Portal</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-8 pt-24 relative">
        <Card className="w-full max-w-lg border-emerald-200/50 dark:border-emerald-800/30 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto mb-4 shadow-lg">
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {unauthorized ? 'Access Denied' : inviteInfo ? 'You\'re Invited!' : 'Event Supervisor Portal'}
            </CardTitle>
            <CardDescription className="text-base">
              {unauthorized 
                ? 'Your email is not associated with any tournament staff invitation.'
                : inviteInfo
                  ? `You've been invited to join ${inviteInfo.tournament.name}`
                  : 'Sign in with your invited email to access your tournament assignments.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invitation Details */}
            {inviteInfo && !unauthorized && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                      {roleLabel}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/30">
                      Division {inviteInfo.tournament.division}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{inviteInfo.tournament.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>
                        {format(new Date(inviteInfo.tournament.startDate), 'MMM d')} - {format(new Date(inviteInfo.tournament.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {inviteInfo.events.length > 0 && (
                      <div className="flex items-start gap-2 pt-2">
                        <Users className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <div>
                          <span className="font-medium">Your Events:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {inviteInfo.events.map(e => (
                              <Badge key={e.event.id} variant="secondary" className="text-xs">
                                {e.event.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Sign in with <strong>{inviteInfo.email}</strong> to accept your invitation
                </p>
              </div>
            )}

            {unauthorized ? (
              <>
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        No invitation found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The email <strong>{email}</strong> is not associated with any tournament staff invitation. 
                        Please sign in with the email that received the invitation.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={handleSignOut} variant="outline" className="w-full">
                    Sign Out & Try Different Email
                  </Button>
                  <Link href="/" className="w-full">
                    <Button variant="default" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleSignIn} 
                  className="w-full h-12 gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {inviteInfo ? 'Accept Invitation & Sign In' : 'Sign in with Google'}
                </Button>
                {!inviteInfo && (
                  <p className="text-xs text-center text-muted-foreground">
                    You need an invitation from a Tournament Director to access this portal.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

