import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { Calendar, Users2, ClipboardCheck, DollarSign, FileText, MessageSquare, Shield, Zap, BarChart3, HelpCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ContactForm } from '@/components/contact-form'
import { HomeNav } from '@/components/home-nav'
import { ScrollAnimate } from '@/components/scroll-animate'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Redirect logged-in users to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: MessageSquare,
      title: 'Team Communication',
      description: 'Post announcements, share updates, and keep your team in the loop with real-time notifications.',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Schedule events, track RSVPs, and manage your team calendar with ease.',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: ClipboardCheck,
      title: 'Attendance Tracking',
      description: 'Track attendance with QR codes, manage check-ins, and monitor participation.',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: DollarSign,
      title: 'Finance Management',
      description: 'Track expenses, manage budgets, and handle purchase requests all in one place.',
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Users2,
      title: 'Team Organization',
      description: 'Organize members into subteams, manage rosters, and assign roles with precision.',
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: FileText,
      title: 'Test Administration',
      description: 'Create and administer tests, track submissions, and manage grading efficiently.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-500'
    }
  ]


  const benefits = [
    'Free forever - no hidden costs',
    'Secure & encrypted data',
    'Real-time collaboration',
    'Mobile-friendly interface',
    'Easy to use interface',
    'Regular feature updates'
  ]

  const faqs = [
    {
      question: 'How do I create a team?',
      answer: 'After signing in, click "Create New Team" on the home page. You\'ll be set as the team admin and can invite members using invite codes.'
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

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <HomeNav />
            <SignInThemeToggle />
            <Link href="/login">
              <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <ScrollAnimate animation="elegant" delay={0} duration={900}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">All-in-one team management platform</span>
              </div>
            </ScrollAnimate>

            {/* Main heading */}
            <ScrollAnimate animation="elegant" delay={150} duration={1000}>
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
                  <span className="block text-gray-900 dark:text-white">Manage Your</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                    Team Better
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  The all-in-one platform for team management. Streamline communication, track events, manage rosters, and more.
                </p>
              </div>
            </ScrollAnimate>

            {/* CTA Button */}
            <ScrollAnimate animation="bounce-in" delay={300} duration={900}>
              <div className="flex justify-center pt-6">
                <Link href="/login">
                  <button className="group px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </ScrollAnimate>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
              {[
                { icon: Calendar, label: 'Event Management' },
                { icon: Users2, label: 'Team Organization' },
                { icon: ClipboardCheck, label: 'Attendance Tracking' },
                { icon: DollarSign, label: 'Finance Management' }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <ScrollAnimate key={index} animation="fade-scale" delay={400 + index * 100} duration={800}>
                    <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-105">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">{item.label}</div>
                      </div>
                    </div>
                  </ScrollAnimate>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <ScrollAnimate animation="elegant" delay={0} duration={900}>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                Everything You Need to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Manage Your Team
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Powerful features designed to streamline your team&apos;s workflow and keep everyone connected.
              </p>
            </div>
          </ScrollAnimate>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <ScrollAnimate 
                  key={index}
                  animation="fade-scale" 
                  delay={150 + index * 120} 
                  duration={800}
                >
                  <div className="group relative p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:scale-105 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                    
                    {/* Icon */}
                    <div className={`relative mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="relative text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="relative text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Decorative element */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  </div>
                </ScrollAnimate>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollAnimate animation="slide-right" delay={0} duration={900}>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                    Built for{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      Modern Teams
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Teamy brings together all the tools your team needs in one intuitive platform. Whether you&apos;re managing events, tracking attendance, handling finances, or administering tests, we&apos;ve got you covered.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {benefits.map((benefit, index) => (
                    <ScrollAnimate key={index} animation="fade-scale" delay={200 + index * 60} duration={700}>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{benefit}</span>
                      </div>
                    </ScrollAnimate>
                  ))}
                </div>

                <ScrollAnimate animation="fade-up" delay={600} duration={800}>
                  <div className="flex flex-wrap gap-6 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">Secure & Private</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">Fast & Reliable</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">Data-Driven</span>
                    </div>
                  </div>
                </ScrollAnimate>
              </div>
            </ScrollAnimate>
            
            {/* Visual showcase */}
            <ScrollAnimate animation="slide-left" delay={100} duration={700}>
              <div className="relative">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <ScrollAnimate animation="fade-scale" delay={300} duration={600}>
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <Calendar className="h-10 w-10 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Event Planning</h3>
                        <p className="text-sm opacity-90">Schedule and manage all your team events</p>
                      </div>
                    </ScrollAnimate>
                    <ScrollAnimate animation="fade-scale" delay={400} duration={600}>
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <Users2 className="h-10 w-10 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Team Management</h3>
                        <p className="text-sm opacity-90">Organize members and subteams efficiently</p>
                      </div>
                    </ScrollAnimate>
                  </div>
                  <div className="space-y-6 pt-12">
                    <ScrollAnimate animation="fade-scale" delay={500} duration={600}>
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <ClipboardCheck className="h-10 w-10 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Attendance</h3>
                        <p className="text-sm opacity-90">Track participation with QR codes</p>
                      </div>
                    </ScrollAnimate>
                    <ScrollAnimate animation="fade-scale" delay={600} duration={600}>
                      <div className="p-8 rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <DollarSign className="h-10 w-10 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Finance</h3>
                        <p className="text-sm opacity-90">Manage expenses and budgets</p>
                      </div>
                    </ScrollAnimate>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-yellow-400/20 rounded-full blur-3xl -z-10"></div>
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 container mx-auto px-4 py-24">
          <ScrollAnimate animation="elegant" delay={0} duration={900}>
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                Why Teams Choose{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Teamy
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Our platform is designed with security and ease of use in mind. With role-based access control, real-time updates, and seamless integrations, Teamy helps your team stay organized and productive.
              </p>
            </div>
          </ScrollAnimate>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollAnimate animation="elegant" delay={0} duration={900}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                Frequently Asked{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Questions
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything you need to know about Teamy
              </p>
            </div>
          </ScrollAnimate>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <ScrollAnimate 
                key={index}
                animation="fade-scale" 
                delay={150 + index * 80} 
                duration={700}
              >
                <div className="group p-8 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 ml-12 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollAnimate animation="bounce-in" delay={0} duration={1000}>
            <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white text-center overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              </div>
              
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl md:text-5xl font-extrabold">
                  Ready to Transform Your Team Management?
                </h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Start managing your team more effectively today with our comprehensive platform.
                </p>
                <div className="pt-4">
                  <Link href="/login">
                    <button className="group px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollAnimate animation="elegant" delay={0} duration={900}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                Get in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Touch
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Have questions or need support? Send us a message and we&apos;ll get back to you soon.
              </p>
            </div>
          </ScrollAnimate>
          <ScrollAnimate animation="fade-scale" delay={200} duration={800}>
            <div className="p-8 md:p-12 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
              <ContactForm />
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Logo size="sm" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The all-in-one platform for team management.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li><a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a></li>
                  <li><a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>
                    <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>
                    <a href="mailto:support@teamy.app" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="mailto:privacy@teamy.app" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Privacy Inquiries
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200/50 dark:border-gray-800/50 text-center text-sm text-gray-600 dark:text-gray-300">
              <p>© {new Date().getFullYear()} Teamy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
