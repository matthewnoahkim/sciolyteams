'use client'

import { useRouter } from 'next/navigation'
import { Trophy, Calendar, MapPin, Users, DollarSign, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  division: 'B' | 'C'
  description: string | null
  price: number
  isOnline: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string | null
  _count: {
    registrations: number
  }
}

interface PublicTournamentsClientProps {
  tournaments: Tournament[]
}

export function PublicTournamentsClient({ tournaments }: PublicTournamentsClientProps) {
  const router = useRouter()

  const handleSignUp = (tournamentId: string) => {
    // Redirect to login with callback to tournament sign up page
    const callbackUrl = `/tournaments/${tournamentId}`
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDateTime = (startDate: string, endDate: string, startTime: string, endTime: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const sameDay = start.toDateString() === end.toDateString()
    
    if (sameDay) {
      const dateStr = formatDate(startDate)
      const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`
      return { dateStr, timeStr, isMultiDay: false }
    } else {
      const startDateTime = `${formatDate(startDate)}, ${formatTime(startTime)}`
      const endDateTime = `${formatDate(endDate)}, ${formatTime(endTime)}`
      return { startDateTime, endDateTime, isMultiDay: true }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header - Blue */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-6">
            <HomeNav variant="hero" />
            <SignInThemeToggle variant="header" />
            <Link href="/login">
              <button className="px-6 py-2.5 text-sm font-semibold bg-white text-teamy-primary rounded-full hover:bg-white/90 transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 px-6 py-12 bg-slate-50 dark:bg-slate-900 grid-pattern">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground">
              Upcoming Tournaments
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and register for upcoming Science Olympiad tournaments. Compete with teams from across the region and test your skills.
            </p>
          </div>

          {/* Tournament List */}
          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No upcoming tournaments</h3>
                <p className="text-muted-foreground">
                  Check back soon for new tournament announcements!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => {
                const formatted = formatDateTime(
                  tournament.startDate,
                  tournament.endDate,
                  tournament.startTime,
                  tournament.endTime
                )

                return (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <Badge variant="outline">
                          Division {tournament.division}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl break-words leading-snug">
                        {tournament.name}
                      </CardTitle>
                      {tournament.description && (
                        <CardDescription className="line-clamp-2">
                          {tournament.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {formatted.isMultiDay ? (
                              <div className="space-y-0.5">
                                <div className="font-medium">
                                  <span className="text-muted-foreground">From: </span>
                                  {formatted.startDateTime}
                                </div>
                                <div className="font-medium">
                                  <span className="text-muted-foreground">To: </span>
                                  {formatted.endDateTime}
                                </div>
                              </div>
                            ) : (
                              <div className="font-medium">
                                {formatted.dateStr}, {formatted.timeStr}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {tournament.isOnline ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Monitor className="h-4 w-4" />
                          <span>Online Tournament</span>
                        </div>
                      ) : tournament.location ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{tournament.location}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {tournament.price === 0 ? 'Free' : `$${tournament.price.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{tournament._count.registrations} team{tournament._count.registrations !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSignUp(tournament.id)}
                        className="w-full mt-4"
                      >
                        Sign Up
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

