import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  Users, Calendar, ClipboardCheck, DollarSign, FileText, Trophy,
  Image, FileCheck, CheckSquare, LayoutDashboard, Bot, Sparkles,
  ArrowLeft, Shield, Bell, Zap
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'

const features = [
  {
    category: 'Core',
    items: [
      {
        icon: Users,
        title: 'Clubs & Teams',
        description: 'Division B/C clubs with multiple teams, dual-role system (Admin/Member), invite codes & links'
      },
      {
        icon: ClipboardCheck,
        title: 'Event Roster',
        description: '2026 SO events, conflict detection, capacity enforcement, AI-assisted assignments'
      },
      {
        icon: Bell,
        title: 'Announcements',
        description: 'Scoped visibility, file attachments, reactions, threaded replies, email notifications'
      },
      {
        icon: Calendar,
        title: 'Calendar',
        description: 'Personal/team/club events, RSVP, recurring events, role/event targeting'
      },
      {
        icon: Shield,
        title: 'Attendance',
        description: 'Check-in codes, manual check-in, grace periods, CSV export, rate limiting'
      }
    ]
  },
  {
    category: 'Finance',
    items: [
      {
        icon: DollarSign,
        title: 'Budgets',
        description: 'Per-event budgets (optionally per-team)'
      },
      {
        icon: FileCheck,
        title: 'Purchase Requests',
        description: 'Approval workflow, budget enforcement'
      },
      {
        icon: Zap,
        title: 'Expenses',
        description: 'Categorized tracking linked to events/teams'
      }
    ]
  },
  {
    category: 'Testing',
    items: [
      {
        icon: FileText,
        title: 'Question Types',
        description: 'MCQ (single/multi), short text, long text, numeric'
      },
      {
        icon: Shield,
        title: 'Proctoring',
        description: 'Tab tracking, fullscreen enforcement, paste/copy detection'
      },
      {
        icon: Sparkles,
        title: 'Tools',
        description: 'Built-in calculator (4-function/scientific/graphing), note sheet upload with admin review'
      },
      {
        icon: Bot,
        title: 'AI Grading',
        description: 'OpenAI-powered FRQ grading with suggestions'
      },
      {
        icon: FileCheck,
        title: 'Score Release',
        description: 'Configurable modes (none, score only, wrong answers, full test)'
      }
    ]
  },
  {
    category: 'Tournaments',
    items: [
      {
        icon: Trophy,
        title: 'Invitationals',
        description: 'Create & manage tournaments'
      },
      {
        icon: Users,
        title: 'Registration',
        description: 'Team registration with event selection'
      },
      {
        icon: FileText,
        title: 'Tournament Tests',
        description: 'Tournament-specific tests'
      }
    ]
  },
  {
    category: 'Other',
    items: [
      {
        icon: Image,
        title: 'Gallery',
        description: 'Photo albums with image/video support'
      },
      {
        icon: FileCheck,
        title: 'Paperwork',
        description: 'Form distribution with submission tracking'
      },
      {
        icon: CheckSquare,
        title: 'Todos',
        description: 'Personal task lists with priorities & due dates'
      },
      {
        icon: LayoutDashboard,
        title: 'Dashboard Widgets',
        description: 'Customizable homepage with 12+ widget types'
      },
      {
        icon: Users,
        title: 'Member Preferences',
        description: 'Event preferences, custom backgrounds, admin notes'
      },
      {
        icon: Zap,
        title: 'Stats',
        description: 'Team performance analytics'
      }
    ]
  }
]

export default async function FeaturesPage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-800 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-6">
            <HomeNav variant="light" />
            <Link href="/login">
              <button className="px-5 py-2.5 text-sm font-semibold bg-white text-teamy-primary rounded-full hover:bg-white/90 transition-colors shadow-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your Science Olympiad team
            </p>
          </div>

          {/* Features */}
          <div className="space-y-16">
            {features.map((category) => (
              <div key={category.category}>
                <h2 className="font-heading text-2xl font-bold mb-8 text-foreground border-b border-border pb-4">
                  {category.category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((feature) => (
                    <div
                      key={feature.title}
                      className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-teamy-primary/20 transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teamy-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-teamy-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-2 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <Link href="/login">
              <button className="px-8 py-4 text-lg font-semibold bg-teamy-primary text-white rounded-full hover:bg-teamy-primary-dark transition-colors shadow-lg hover:shadow-xl">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
