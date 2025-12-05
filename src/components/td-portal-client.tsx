'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Trophy, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Link as LinkIcon,
  Mail,
  Phone,
  FileText,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TournamentRequest {
  id: string
  tournamentName: string
  tournamentLevel: string
  division: string
  tournamentFormat: string
  location: string | null
  preferredSlug: string | null
  directorName: string
  directorEmail: string
  directorPhone: string | null
  otherNotes: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNotes: string | null
  createdAt: string | Date
}

interface TDPortalClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  requests: TournamentRequest[]
}

export function TDPortalClient({ user, requests }: TDPortalClientProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/td' })
  }

  // Generate slug from tournament name or use preferred slug
  const getTournamentSlug = (request: TournamentRequest) => {
    if (request.preferredSlug) {
      return request.preferredSlug
    }
    // Generate from tournament name
    return request.tournamentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        )
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Your tournament has been approved! We will be in touch with next steps.'
      case 'REJECTED':
        return 'Unfortunately, your tournament request was not approved.'
      default:
        return 'Your request is being reviewed. We typically respond within 2-3 business days.'
    }
  }

  const getLevelLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'in-person':
        return 'In-Person'
      case 'satellite':
        return 'Satellite'
      case 'mini-so':
        return 'Mini SO'
      default:
        return format
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" variant="light" />
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white font-semibold">TD Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-white/30">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block max-w-[120px] md:max-w-none">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] sm:text-xs text-white/60 truncate">{user.email}</p>
            </div>
            <ThemeToggle variant="header" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="px-2 sm:px-3 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.name?.split(' ')[0] || 'Tournament Director'}!
          </h1>
          <p className="text-muted-foreground">
            Track the status of your tournament hosting requests below.
          </p>
        </div>

        {/* Submit New Request CTA */}
        <Card className="mb-6 border-dashed border-2">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Need to host another tournament?</h3>
                <p className="text-sm text-muted-foreground">
                  Submit a new hosting request for your next Science Olympiad event.
                </p>
              </div>
              <Link href="/tournaments">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Tournament Requests</h2>
          
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{request.tournamentName}</CardTitle>
                    <CardDescription>
                      Submitted {format(new Date(request.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Message */}
                <div className={`p-4 rounded-lg ${
                  request.status === 'APPROVED' 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : request.status === 'REJECTED'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                }`}>
                  <p className={`text-sm ${
                    request.status === 'APPROVED' 
                      ? 'text-green-700 dark:text-green-300' 
                      : request.status === 'REJECTED'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {getStatusMessage(request.status)}
                  </p>
                </div>

                {/* Review Notes */}
                {request.reviewNotes && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Message from Teamy:
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {request.reviewNotes}
                    </p>
                  </div>
                )}

                {/* Tournament Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Tournament Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getLevelLabel(request.tournamentLevel)}</Badge>
                        <Badge variant="outline">Division {request.division}</Badge>
                        <Badge variant="outline">{getFormatLabel(request.tournamentFormat)}</Badge>
                      </div>
                      {request.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{request.location}</span>
                        </div>
                      )}
                      {request.preferredSlug && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <LinkIcon className="h-4 w-4" />
                          <span>teamy.io/tournaments/{request.preferredSlug}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Director:</span>
                        <span className="font-medium">{request.directorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{request.directorEmail}</span>
                      </div>
                      {request.directorPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{request.directorPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Notes */}
                {request.otherNotes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {request.otherNotes}
                    </p>
                  </div>
                )}

                {/* Action Button for Approved Tournaments */}
                {request.status === 'APPROVED' && (
                  <div className="pt-4">
                    <Link href={`/tournaments/${getTournamentSlug(request)}`}>
                      <Button className="w-full gap-2">
                        <LinkIcon className="h-4 w-4" />
                        View & Customize Tournament Page
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

