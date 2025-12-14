import { PublicPageLayout } from '@/components/public-page-layout'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { ContactForm } from '@/components/contact-form'

export default function ContactPage() {
  return (
    <PublicPageLayout>
      <div className="py-16 px-4 sm:px-6">
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
              href="mailto:support@teamy.site" 
              className="inline-flex items-center gap-2 text-teamy-primary hover:underline font-semibold"
            >
              <Mail className="h-4 w-4" />
              support@teamy.site
            </a>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  )
}
