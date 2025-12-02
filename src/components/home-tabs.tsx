'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Trophy, Calendar, MapPin, Users, DollarSign, Monitor } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollAnimate } from '@/components/scroll-animate'

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

export function HomeTabs() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tournaments/public')
      if (!response.ok) throw new Error('Failed to load tournaments')
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = (tournamentId: string) => {
    // Check if user is signed in by trying to access a protected route
    // If not signed in, redirect to login with callback
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
    <Tabs defaultValue="home" className="w-full">
      <TabsList className="mb-8">
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
      </TabsList>

      <TabsContent value="home" className="mt-0">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <ScrollAnimate animation="elegant" delay={0} duration={800}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teamy-primary/10 dark:bg-teamy-primary/20 border border-teamy-primary/20">
              <Sparkles className="h-4 w-4 text-teamy-primary" />
              <span className="text-sm font-semibold text-teamy-primary">Built for Science Olympiad</span>
            </div>
          </ScrollAnimate>

          {/* Main heading */}
          <ScrollAnimate animation="elegant" delay={100} duration={900}>
            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none text-foreground">
              Teamy
            </h1>
          </ScrollAnimate>

          {/* Tagline */}
          <ScrollAnimate animation="elegant" delay={200} duration={900}>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              The complete platform for managing your Science Olympiad team
            </p>
          </ScrollAnimate>

          {/* CTA Buttons */}
          <ScrollAnimate animation="bounce-in" delay={300} duration={800}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login">
                <button className="group px-8 py-4 text-lg font-semibold bg-teamy-primary text-white rounded-full shadow-lg hover:bg-teamy-primary-dark hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/features">
                <button className="px-8 py-4 text-lg font-semibold text-foreground border-2 border-border hover:border-teamy-primary/50 hover:bg-teamy-primary/5 rounded-full transition-all duration-300">
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
      </TabsContent>

      <TabsContent value="tournaments" className="mt-0">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <ScrollAnimate animation="elegant" delay={0} duration={800}>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teamy-primary/10 dark:bg-teamy-primary/20 border border-teamy-primary/20 mb-4">
                <Trophy className="h-4 w-4 text-teamy-primary" />
                <span className="text-sm font-semibold text-teamy-primary">Tournament Feature</span>
              </div>
            </ScrollAnimate>
            <h2 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground">
              Upcoming Tournaments
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and register for upcoming Science Olympiad tournaments. Compete with teams from across the region and test your skills.
            </p>
          </div>

          {/* Tournament List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teamy-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
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
      </TabsContent>
    </Tabs>
  )
}

