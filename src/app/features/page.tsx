import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#0a0a0f] text-gray-900 dark:text-white">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 dark:from-violet-600/20 dark:to-fuchsia-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/15 to-blue-600/15 dark:from-cyan-500/15 dark:to-blue-600/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <div className="flex items-center gap-6">
            <HomeNav />
            <SignInThemeToggle />
            <Link href="/login">
              <button className="px-5 py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-white/90 transition-all duration-300 hover:scale-105">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                Features
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/50 max-w-2xl mx-auto">
              Everything you need to manage your Science Olympiad team
            </p>
          </div>

          {/* Features */}
          <div className="space-y-16">
            {features.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white/90 border-b border-gray-200 dark:border-white/10 pb-4">
                  {category.category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((feature) => (
                    <div
                      key={feature.title}
                      className="group p-6 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white/90">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-white/50 leading-relaxed">
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
              <button className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 text-white">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-white/40">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-white/30">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

