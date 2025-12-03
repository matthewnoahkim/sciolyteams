import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { ContactForm } from '@/components/contact-form'

export default async function ContactPage() {
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
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teamy-primary/10 mb-6">
              <MessageCircle className="h-8 w-8 text-teamy-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Have a question, suggestion, or need help? We&apos;d love to hear from you.
            </p>
          </div>

          {/* Contact Form */}
          <div className="p-8 rounded-2xl bg-card border border-border shadow-card">
            <ContactForm />
          </div>

          {/* Alternative Contact */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">Or reach out directly</p>
            <a 
              href="mailto:support@teamy.io" 
              className="inline-flex items-center gap-2 text-teamy-primary hover:underline font-semibold"
            >
              <Mail className="h-4 w-4" />
              support@teamy.io
            </a>
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
