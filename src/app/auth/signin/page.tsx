import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/signin-button'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { Users, Calendar, Users2, ClipboardCheck, DollarSign, FileText, Sparkles, MessageSquare, Shield, Zap, BarChart3, Mail, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string
  }
}

const DEFAULT_CALLBACK_URL = '/'

function resolveCallbackUrl(rawCallbackUrl?: string) {
  if (!rawCallbackUrl) {
    return DEFAULT_CALLBACK_URL
  }

  if (rawCallbackUrl.startsWith('/')) {
    return rawCallbackUrl
  }

  try {
    const url = new URL(rawCallbackUrl)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    // Ignore parsing errors and fallback to default
  }

  return DEFAULT_CALLBACK_URL
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions)
  const callbackUrl = resolveCallbackUrl(searchParams?.callbackUrl)

  if (session?.user) {
    redirect(callbackUrl)
  }

  const features = [
    {
      icon: MessageSquare,
      title: 'Team Communication',
      description: 'Post announcements, share updates, and keep your team in the loop with real-time notifications.',
      color: 'blue'
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Schedule events, track RSVPs, and manage your team calendar with ease.',
      color: 'purple'
    },
    {
      icon: ClipboardCheck,
      title: 'Attendance Tracking',
      description: 'Track attendance with QR codes, manage check-ins, and monitor participation.',
      color: 'green'
    },
    {
      icon: DollarSign,
      title: 'Finance Management',
      description: 'Track expenses, manage budgets, and handle purchase requests all in one place.',
      color: 'yellow'
    },
    {
      icon: Users2,
      title: 'Team Organization',
      description: 'Organize members into subteams, manage rosters, and assign roles with precision.',
      color: 'pink'
    },
    {
      icon: FileText,
      title: 'Test Administration',
      description: 'Create and administer tests, track submissions, and manage grading efficiently.',
      color: 'indigo'
    }
  ]

  const faqs = [
    {
      question: 'How do I create a team?',
      answer: 'After signing in, click "Create New Team" on the home page. You&apos;ll be set as the team admin and can invite members using invite codes.'
    },
    {
      question: 'Can I use Teamy for free?',
      answer: 'Yes! Teamy is free to use. We believe in providing powerful team management tools without barriers.'
    },
    {
      question: 'How do I invite team members?',
      answer: 'As a team admin, you can generate invite codes from your team settings. Share these codes with members to join your team.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption, secure authentication, and follow best practices to protect your data. See our Privacy Policy for details.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes, you can export your data at any time. Contact us at privacy@teamy.app to request a data export.'
    },
    {
      question: 'What happens if I delete my account?',
      answer: 'Your account and personal data will be deleted within 30 days. Team data may remain if other members are still active, but your personal information will be removed.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <SignInThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Hero content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Logo size="lg" showText={false} />
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Teamy
                  </span>
                </h1>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                The all-in-one platform for managing your team. Streamline communication, track events, manage rosters, and more.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <Users2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teams</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Finance</span>
              </div>
            </div>
          </div>

          {/* Right side - Sign in card */}
          <div className="w-full max-w-md mx-auto">
            <div className="space-y-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-2xl">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Started</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in to access your teams
                </p>
              </div>

              <div className="space-y-6">
                <SignInButton callbackUrl={callbackUrl} />

                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Manage Your Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to streamline your team&apos;s workflow and keep everyone connected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
                indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }
              
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Description/About Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                Built for Modern Teams
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Teamy brings together all the tools your team needs in one intuitive platform. Whether you&apos;re managing events, tracking attendance, handling finances, or administering tests, we&apos;ve got you covered.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our platform is designed with security and ease of use in mind. With role-based access control, real-time updates, and seamless integrations, Teamy helps your team stay organized and productive.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fast & Reliable</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data-Driven</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
                    <Calendar className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">Event Planning</h3>
                    <p className="text-sm opacity-90">Schedule and manage all your team events</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
                    <Users2 className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">Team Management</h3>
                    <p className="text-sm opacity-90">Organize members and subteams efficiently</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
                    <ClipboardCheck className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">Attendance</h3>
                    <p className="text-sm opacity-90">Track participation with QR codes</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-xl">
                    <DollarSign className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">Finance</h3>
                    <p className="text-sm opacity-90">Manage expenses and budgets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about Teamy
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 ml-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Have questions or need support? We&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:support@teamy.app"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-5 w-5" />
              support@teamy.app
            </a>
            <a
              href="mailto:legal@teamy.app"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Mail className="h-5 w-5" />
              legal@teamy.app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <Logo size="sm" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The all-in-one platform for team management.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li><Link href="#features" className="hover:text-blue-600 dark:hover:text-blue-400">Features</Link></li>
                  <li><Link href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400">FAQ</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>
                    <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>
                    <a href="mailto:support@teamy.app" className="hover:text-blue-600 dark:hover:text-blue-400">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="mailto:privacy@teamy.app" className="hover:text-blue-600 dark:hover:text-blue-400">
                      Privacy Inquiries
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">
              <p>© {new Date().getFullYear()} Teamy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
