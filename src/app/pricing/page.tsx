'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'

export default function PricingPage() {
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
              <Link href="/solutions" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Solutions
              </Link>
              <Link href="/pricing" className="text-gray-900 dark:text-white font-semibold transition-colors">
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Teamy is completely free for all teams. No hidden fees, no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="inline-block bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                FREE
              </div>
              <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                $0
              </CardTitle>
              <CardDescription className="text-xl text-gray-700 dark:text-gray-300">
                Forever
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited teams and members
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited events and calendar
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Basic test creation
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Attendance tracking with QR codes
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Financial management tools
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Secure data storage
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Email notifications
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Email support
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="w-full text-lg py-6">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="shadow-2xl border-2 border-blue-600 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                MOST POPULAR
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                PRO
              </div>
              <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                $5
              </CardTitle>
              <CardDescription className="text-xl text-gray-700 dark:text-gray-300">
                Per month or $50/year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Everything in Free</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Advanced test builder</strong> with auto-grading
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Analytics and insights</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Custom branding</strong> and team colors
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Priority support</strong> with faster response
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Export data</strong> to CSV/PDF
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>API access</strong> for integrations
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Early access</strong> to new features
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/signin">
                  <Button size="lg" className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Why is Teamy free?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  We believe every team should have access to great management tools. Teamy is free because we're passionate about helping teams succeed, not about maximizing profits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Will Teamy always be free?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  Yes! Teamy will always remain free for all core features. We may introduce optional premium features in the future, but the platform you see today will always be available at no cost.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Are there any hidden fees?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  Absolutely not. Teamy is 100% free with no hidden fees, no credit card required, and no surprises. What you see is what you get.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What payment methods do you accept?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  We accept all major credit cards, debit cards, and PayPal for Pro subscriptions. All payments are processed securely through Stripe.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Can I switch between plans?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  Yes! You can upgrade to Pro at any time, and downgrade back to Free if needed. When you downgrade, you'll keep Pro features until the end of your billing period.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What's the difference between monthly and yearly?</CardTitle>
                <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                  The yearly plan costs $50 (equivalent to $4.17/month), saving you $10 compared to paying monthly at $5/month. Both plans include the same features.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

