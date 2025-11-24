'use client'

import { useState } from 'react'
import { SignInButton } from '@/components/signin-button'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { Users, Calendar, Users2, ClipboardCheck, DollarSign, FileText, MessageSquare, Shield, Zap, BarChart3, Mail, HelpCircle, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ContactForm } from '@/components/contact-form'
import { useSearchParams } from 'next/navigation'

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

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = resolveCallbackUrl(searchParams?.get('callbackUrl') || undefined)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-400/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-400/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#3b82f605_1px,transparent_1px),linear-gradient(to_bottom,#3b82f605_1px,transparent_1px)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 glass-effect-light dark:glass-effect-dark sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Features
            </a>
            <a 
              href="#about" 
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              About
            </a>
            <a 
              href="#faq" 
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              FAQ
            </a>
            <a 
              href="#contact" 
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Contact
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <SignInThemeToggle />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-primary/10"
              >
                Features
              </a>
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-primary/10"
              >
                About
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-primary/10"
              >
                FAQ
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-primary/10"
              >
                Contact
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left side - Hero content */}
          <div className="text-center lg:text-left space-y-8 animate-float">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Now Available</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
                  <span className="block text-foreground">Manage Your</span>
                  <span className="gradient-text dark:gradient-text-dark">Team Better</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  The all-in-one platform for team management. Streamline communication, track events, manage rosters, and more.
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl glass-effect-light dark:glass-effect-dark apple-hover cursor-default">
                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">Events</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl glass-effect-light dark:glass-effect-dark apple-hover cursor-default">
                <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-400/10">
                  <Users2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">Teams</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl glass-effect-light dark:glass-effect-dark apple-hover cursor-default">
                <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-400/10">
                  <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">Attendance</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl glass-effect-light dark:glass-effect-dark apple-hover cursor-default">
                <div className="p-2 rounded-lg bg-yellow-500/10 dark:bg-yellow-400/10">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">Finance</span>
              </div>
            </div>
          </div>

          {/* Right side - Sign in card */}
          <div className="w-full max-w-md mx-auto">
            <div className="space-y-8 rounded-3xl glass-effect-light dark:glass-effect-dark p-8 lg:p-10 shadow-2xl">
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-primary-light dark:bg-gradient-primary-dark mb-2">
                  <Logo size="md" showText={false} />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
                <p className="text-muted-foreground">
                  Sign in to access your teams
                </p>
              </div>

              <div className="space-y-6">
                <SignInButton callbackUrl={callbackUrl} />

                <div className="text-center text-xs text-muted-foreground">
                  <p>
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline font-medium">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary hover:underline font-medium">
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
      <section id="features" className="relative z-10 container mx-auto px-4 py-20 lg:py-32 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything You Need to Manage Your Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to streamline your team&apos;s workflow and keep everyone connected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/20',
                purple: 'bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20',
                green: 'bg-green-500/10 dark:bg-green-400/10 text-green-600 dark:text-green-400 shadow-lg shadow-green-500/20',
                yellow: 'bg-yellow-500/10 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 shadow-lg shadow-yellow-500/20',
                pink: 'bg-pink-500/10 dark:bg-pink-400/10 text-pink-600 dark:text-pink-400 shadow-lg shadow-pink-500/20',
                indigo: 'bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/20'
              }
              
              return (
                <div
                  key={index}
                  className="group p-8 rounded-3xl glass-effect-light dark:glass-effect-dark apple-hover"
                >
                  <div className={`w-14 h-14 rounded-2xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Description/About Section */}
      <section id="about" className="relative z-10 container mx-auto px-4 py-20 lg:py-32 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                  Built for Modern Teams
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Teamy brings together all the tools your team needs in one intuitive platform. Whether you&apos;re managing events, tracking attendance, handling finances, or administering tests, we&apos;ve got you covered.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our platform is designed with security and ease of use in mind. With role-based access control, real-time updates, and seamless integrations, Teamy helps your team stay organized and productive.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-3 px-5 py-3 rounded-full glass-effect-light dark:glass-effect-dark">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-foreground">Secure & Private</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-full glass-effect-light dark:glass-effect-dark">
                  <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-semibold text-foreground">Fast & Reliable</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-full glass-effect-light dark:glass-effect-dark">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-foreground">Data-Driven</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-5">
                  <div className="p-7 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-500/30 apple-hover">
                    <Calendar className="h-9 w-9 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Event Planning</h3>
                    <p className="text-sm opacity-90 leading-relaxed">Schedule and manage all your team events</p>
                  </div>
                  <div className="p-7 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-2xl shadow-purple-500/30 apple-hover">
                    <Users2 className="h-9 w-9 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Team Management</h3>
                    <p className="text-sm opacity-90 leading-relaxed">Organize members and subteams efficiently</p>
                  </div>
                </div>
                <div className="space-y-5 pt-12">
                  <div className="p-7 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-2xl shadow-green-500/30 apple-hover">
                    <ClipboardCheck className="h-9 w-9 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Attendance</h3>
                    <p className="text-sm opacity-90 leading-relaxed">Track participation with QR codes</p>
                  </div>
                  <div className="p-7 rounded-3xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-2xl shadow-yellow-500/30 apple-hover">
                    <DollarSign className="h-9 w-9 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Finance</h3>
                    <p className="text-sm opacity-90 leading-relaxed">Manage expenses and budgets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 container mx-auto px-4 py-20 lg:py-32 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">FAQ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Teamy
            </p>
          </div>

          <div className="space-y-5">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-7 rounded-3xl glass-effect-light dark:glass-effect-dark apple-hover"
              >
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                    <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {faq.question}
                </h3>
                <p className="text-muted-foreground ml-14 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 container mx-auto px-4 py-20 lg:py-32 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Contact</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground">
              Have questions or need support? Send us a message and we&apos;ll get back to you soon.
            </p>
          </div>
          <div className="p-10 rounded-3xl glass-effect-light dark:glass-effect-dark shadow-2xl">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass-effect-light dark:glass-effect-dark mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Logo size="sm" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The all-in-one platform for team management.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground mb-6">Product</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                  <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground mb-6">Legal</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link href="/terms" className="hover:text-primary transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-primary transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground mb-6">Support</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <a href="mailto:support@teamy.app" className="hover:text-primary transition-colors">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="mailto:privacy@teamy.app" className="hover:text-primary transition-colors">
                      Privacy Inquiries
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Teamy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
