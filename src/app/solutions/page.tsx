'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'

export default function SolutionsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      {/* Header */}
      <header className="border-b glass-effect-light dark:glass-effect-dark sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/solutions" className="text-gray-900 dark:text-white font-semibold transition-colors">
                Solutions
              </Link>
              <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Pricing
              </Link>
              <Link href="/#contact" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <SignInThemeToggle />
              <Button onClick={() => router.push('/signin')} size="lg">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Solutions for Every Team
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Whether you're managing a Science Olympiad team, academic club, or sports team, Teamy has the tools you need to succeed.
          </p>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <Card className="apple-hover">
            <CardHeader>
              <CardTitle className="text-2xl">Science Olympiad Teams</CardTitle>
              <CardDescription className="text-base">
                Built specifically for Science Olympiad teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Event roster management with conflict detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Practice test creation and grading</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Budget tracking for event materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Competition and meeting attendance tracking</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="apple-hover">
            <CardHeader>
              <CardTitle className="text-2xl">Academic Clubs</CardTitle>
              <CardDescription className="text-base">
                Perfect for debate teams, math clubs, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Meeting scheduling with RSVP tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Member directory and subteam organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Announcements and discussion threads</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Financial management for club activities</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="apple-hover">
            <CardHeader>
              <CardTitle className="text-2xl">Sports Teams</CardTitle>
              <CardDescription className="text-base">
                Streamline communication for athletic teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Practice and game scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Attendance tracking with QR codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Team announcements and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Expense tracking for equipment and travel</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="apple-hover">
            <CardHeader>
              <CardTitle className="text-2xl">Any Organization</CardTitle>
              <CardDescription className="text-base">
                Flexible tools for any team structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Customizable team structure and roles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Calendar integration and reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Secure communication platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">All features included, no limits</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Get started with Teamy today - it's completely free
          </p>
          <Link href="/signin">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

