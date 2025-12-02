'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Calendar, MapPin, Users, DollarSign, Monitor, Plus, Loader2, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

interface PublicTournamentsPageProps {
  tournaments: Tournament[]
}

export function PublicTournamentsPage({ tournaments }: PublicTournamentsPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    tournamentName: '',
    tournamentLevel: '',
    division: '',
    tournamentFormat: '',
    location: '',
    preferredSlug: '',
    directorName: '',
    directorEmail: '',
    directorPhone: '',
    otherNotes: '',
  })

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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.tournamentName || !formData.tournamentLevel || !formData.division || 
        !formData.tournamentFormat || !formData.directorName || !formData.directorEmail) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    if (formData.tournamentFormat === 'in-person' && !formData.location) {
      toast({
        title: 'Location Required',
        description: 'Please enter the tournament location for in-person events.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      // Send to webhook (you can replace this URL with your actual webhook)
      const webhookUrl = process.env.NEXT_PUBLIC_TOURNAMENT_WEBHOOK_URL || '/api/contact'
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tournament_hosting_request',
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setSubmitted(true)
      toast({
        title: 'Request Submitted!',
        description: 'We will review your tournament hosting request and get back to you soon.',
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Submission Failed',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tournamentName: '',
      tournamentLevel: '',
      division: '',
      tournamentFormat: '',
      location: '',
      preferredSlug: '',
      directorName: '',
      directorEmail: '',
      directorPhone: '',
      otherNotes: '',
    })
    setSubmitted(false)
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
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground">
              Science Olympiad Tournaments
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover upcoming tournaments or host your own. Compete with teams from across the region and test your skills.
            </p>
          </div>

          {/* Host a Tournament Section */}
          <Card className="border-2 border-teamy-primary/20 bg-gradient-to-br from-teamy-primary/5 to-transparent">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-teamy-primary" />
                Host a Tournament
              </CardTitle>
              <CardDescription className="text-base max-w-xl mx-auto">
                Want to host your own Science Olympiad tournament? We make it easy to manage registrations, 
                scheduling, and results all in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* How it works */}
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-teamy-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-teamy-primary font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-1">Submit Request</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form with your tournament details and contact information.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-teamy-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-teamy-primary font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-1">Get Approved</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your request and set up your tournament page.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-teamy-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-teamy-primary font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-1">Start Hosting</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage registrations, create tests, and run your tournament seamlessly.
                  </p>
                </div>
              </div>

              {/* Create Tournament Button */}
              <div className="text-center pt-4">
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open)
                  if (!open) resetForm()
                }}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      Create Tournament
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {submitted ? (
                      <div className="py-12 text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <DialogTitle className="text-2xl">Request Submitted!</DialogTitle>
                        <DialogDescription className="text-base">
                          Thank you for your interest in hosting a tournament on Teamy. 
                          We&apos;ll review your request and get back to you within 2-3 business days.
                        </DialogDescription>
                        <Button onClick={() => setDialogOpen(false)} className="mt-4">
                          Close
                        </Button>
                      </div>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Tournament Hosting Request</DialogTitle>
                          <DialogDescription>
                            Fill out this form to request hosting your Science Olympiad tournament on Teamy.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
                          {/* Tournament Name */}
                          <div className="space-y-2">
                            <Label htmlFor="tournamentName">Tournament Name *</Label>
                            <Input
                              id="tournamentName"
                              value={formData.tournamentName}
                              onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })}
                              placeholder="e.g., MIT Science Olympiad Invitational"
                              required
                            />
                          </div>

                          {/* Tournament Level */}
                          <div className="space-y-2">
                            <Label htmlFor="tournamentLevel">Tournament Level *</Label>
                            <Select
                              value={formData.tournamentLevel}
                              onValueChange={(value) => setFormData({ ...formData, tournamentLevel: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select tournament level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="invitational">Invitational</SelectItem>
                                <SelectItem value="regional">Regional</SelectItem>
                                <SelectItem value="state">State</SelectItem>
                                <SelectItem value="national">National</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Division */}
                          <div className="space-y-2">
                            <Label htmlFor="division">Division *</Label>
                            <Select
                              value={formData.division}
                              onValueChange={(value) => setFormData({ ...formData, division: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select division" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="B">Division B</SelectItem>
                                <SelectItem value="C">Division C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Tournament Format */}
                          <div className="space-y-2">
                            <Label htmlFor="tournamentFormat">Tournament Format *</Label>
                            <Select
                              value={formData.tournamentFormat}
                              onValueChange={(value) => setFormData({ ...formData, tournamentFormat: value, location: value !== 'in-person' ? '' : formData.location })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in-person">In-Person</SelectItem>
                                <SelectItem value="satellite">Satellite</SelectItem>
                                <SelectItem value="mini-so">Mini SO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Location (only for in-person) */}
                          {formData.tournamentFormat === 'in-person' && (
                            <div className="space-y-2">
                              <Label htmlFor="location">Tournament Location *</Label>
                              <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., MIT Campus, Cambridge, MA"
                                required
                              />
                            </div>
                          )}

                          {/* Preferred Slug */}
                          <div className="space-y-2">
                            <Label htmlFor="preferredSlug">Preferred Website Slug</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">teamy.app/tournaments/</span>
                              <Input
                                id="preferredSlug"
                                value={formData.preferredSlug}
                                onChange={(e) => setFormData({ ...formData, preferredSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                placeholder="mit-invitational-2025"
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Letters, numbers, and hyphens only. Leave blank for auto-generated.
                            </p>
                          </div>

                          {/* Director Info */}
                          <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold mb-3">Tournament Director Information</h4>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="directorName">Full Name *</Label>
                                <Input
                                  id="directorName"
                                  value={formData.directorName}
                                  onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                                  placeholder="John Smith"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="directorEmail">Email *</Label>
                                  <Input
                                    id="directorEmail"
                                    type="email"
                                    value={formData.directorEmail}
                                    onChange={(e) => setFormData({ ...formData, directorEmail: e.target.value })}
                                    placeholder="director@school.edu"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="directorPhone">Phone Number</Label>
                                  <Input
                                    id="directorPhone"
                                    type="tel"
                                    value={formData.directorPhone}
                                    onChange={(e) => setFormData({ ...formData, directorPhone: e.target.value })}
                                    placeholder="(555) 123-4567"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Other Notes */}
                          <div className="space-y-2">
                            <Label htmlFor="otherNotes">Other Notes</Label>
                            <Textarea
                              id="otherNotes"
                              value={formData.otherNotes}
                              onChange={(e) => setFormData({ ...formData, otherNotes: e.target.value })}
                              placeholder="Any additional information about your tournament..."
                              rows={3}
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex gap-4 pt-4">
                            <Button
                              type="submit"
                              disabled={submitting}
                              className="flex-1"
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Submit Request'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tournaments Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Upcoming Tournaments</h2>
            
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
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-7"
                            onClick={() => handleSignUp(tournament.id)}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            More Info
                          </Button>
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
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
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

