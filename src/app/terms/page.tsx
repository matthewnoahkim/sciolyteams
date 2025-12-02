import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header - Blue */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary shadow-nav">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="light" />
          <SignInThemeToggle variant="header" />
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-slate dark:prose-invert max-w-none bg-card border border-border rounded-2xl p-8 md:p-12 shadow-card">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Teamy (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Teamy is a web-based platform designed to help teams manage their activities, including but not limited to:
            </p>
            <ul>
              <li>Team and member management</li>
              <li>Event scheduling and calendar management</li>
              <li>Announcements and communication</li>
              <li>Attendance tracking</li>
              <li>Financial management</li>
              <li>Test administration and grading</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              To use the Service, you must create an account using Google OAuth. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Transmit any harmful code, viruses, or malicious software</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">5. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-teamy-primary dark:text-teamy-accent hover:underline font-medium">
                Privacy Policy
              </Link>
              . Please review our Privacy Policy to understand our practices regarding your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold mb-4">7. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> legal@teamy.io
            </p>
          </section>
        </div>
      </div>

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
