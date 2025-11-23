'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { ContactForm } from '@/components/contact-form'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  ClipboardCheck, 
  MessageSquare, 
  FileText,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Organize members, assign roles, and manage subteams efficiently'
    },
    {
      icon: Calendar,
      title: 'Event Scheduling',
      description: 'Plan events, track RSVPs, and send automated reminders'
    },
    {
      icon: ClipboardCheck,
      title: 'Attendance Tracking',
      description: 'QR code check-ins and real-time attendance monitoring'
    },
    {
      icon: DollarSign,
      title: 'Financial Management',
      description: 'Track expenses, manage budgets, and handle purchase requests'
    },
    {
      icon: MessageSquare,
      title: 'Communication Hub',
      description: 'Announcements, replies, reactions, and team discussions'
    },
    {
      icon: FileText,
      title: 'Test Administration',
      description: 'Create, assign, and grade tests with advanced security features'
    }
  ]

  const faqs = [
    {
      question: 'What is Teamy?',
      answer: 'Teamy is an all-in-one platform designed to help teams manage their activities, events, finances, and communication in one centralized place.'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply sign in with your Google account, create or join a team, and start managing your team activities immediately.'
    },
    {
      question: 'Is Teamy free to use?',
      answer: 'Yes! Teamy is completely free to use for all teams, with all features included.'
    },
    {
      question: 'How secure is my data?',
      answer: 'We take security seriously. All data is encrypted in transit and at rest, and we follow industry best practices for data protection.'
    },
    {
      question: 'Can I manage multiple teams?',
      answer: 'Absolutely! You can be a member of multiple teams and easily switch between them from your dashboard.'
    },
    {
      question: 'What kind of teams is this for?',
      answer: 'Teamy is perfect for Science Olympiad teams, academic clubs, sports teams, or any organized group that needs collaboration tools.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      {/* Header */}
      <header className="border-b glass-effect-light dark:glass-effect-dark sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <Logo size="md" />
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/solutions" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Solutions
              </Link>
              <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Pricing
              </Link>
              <a href="#contact" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                Contact
              </a>
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

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Everything You Need to<br />Manage Your Team
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
              The all-in-one platform for managing your team. Streamline communication, track events, manage rosters, and keep everyone connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => router.push('/signin')}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Everything your team needs in one place
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="apple-hover">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Shield className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Secure & Private</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Your data is encrypted and protected with industry-leading security standards
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Zap className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Lightning Fast</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Built with modern technology for instant updates and smooth performance
                </p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Globe className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Always Accessible</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Access your team dashboard from anywhere, on any device
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Get answers to common questions
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{faq.question}</span>
                  </CardTitle>
                  <CardDescription className="text-base pl-7">
                    {faq.answer}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300">
                Have questions? We'd love to hear from you
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card className="shadow-2xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
                Join teams already using Teamy to streamline their operations
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-lg"
                onClick={() => router.push('/signin')}
              >
                Sign In Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo size="md" />
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-4">
                The all-in-one platform for managing your team
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Connect</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Questions? Reach out at<br />
                <a href="mailto:hello@teamy.app" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  hello@teamy.app
                </a>
              </p>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-gray-700 dark:text-gray-300">
            <p>&copy; {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
