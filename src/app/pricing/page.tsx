import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { 
  ArrowLeft, Check, Server, Mail, Cloud, Database, Globe, Cpu, Calculator, Heart
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'

const costs = [
  { icon: Calculator, name: 'Desmos', amount: '$1,200', period: '/yr', description: 'Built-in calculator' },
  { icon: Mail, name: 'Emails', amount: '$330', period: '/yr', description: 'Notifications' },
  { icon: Server, name: 'Hosting', amount: '$240', period: '/yr', description: 'App servers' },
  { icon: Cloud, name: 'Cloud Storage', amount: '$100', period: '/yr', description: 'File uploads' },
  { icon: Database, name: 'Database', amount: '$60', period: '/yr', description: 'PostgreSQL' },
  { icon: Globe, name: 'Domain', amount: '$50', period: '/yr', description: 'teamy.io' },
  { icon: Cpu, name: 'AI Tokens', amount: '$20', period: '/yr', description: 'OpenAI' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    features: [
      'Up to 3 clubs',
      '5k AI tokens/month',
      'All core features',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$5',
    period: '/month',
    altPrice: '$50/year',
    features: [
      'Unlimited clubs',
      'Unlimited AI tokens',
      'Custom backgrounds',
      'Username display customization',
      '5 club boosts included',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
]

const boosts = [
  {
    tier: 'Tier 1',
    boosts: '0 boosts',
    price: 'Free',
    features: ['60 max members', '50MB storage/month'],
  },
  {
    tier: 'Tier 2',
    boosts: '5 boosts',
    price: '$5',
    features: ['Unlimited members', '100MB storage/month'],
  },
  {
    tier: 'Tier 3',
    boosts: '10 boosts',
    price: '$10',
    features: ['Unlimited members', 'Unlimited storage'],
  },
]

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  const totalCost = costs.reduce((sum, cost) => {
    const amount = parseFloat(cost.amount.replace('$', '').replace(',', ''))
    return sum + amount
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#0a0a0f] text-gray-900 dark:text-white">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 dark:from-emerald-600/20 dark:to-cyan-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/15 to-fuchsia-600/15 dark:from-violet-500/15 dark:to-fuchsia-600/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
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
                Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/50 max-w-2xl mx-auto">
              Transparent pricing to keep Teamy running
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-2">Running Costs</h2>
              <p className="text-gray-600 dark:text-white/50">What it costs to maintain teamy.io</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {costs.map((cost) => (
                <div
                  key={cost.name}
                  className="p-4 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06] text-center"
                >
                  <cost.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 dark:text-white/40 mb-1">{cost.name}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {cost.amount}
                    <span className="text-xs text-gray-500 dark:text-white/40">{cost.period}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06]">
              <div className="text-sm text-gray-500 dark:text-white/40 mb-1">Total annual cost</div>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">${totalCost.toLocaleString()}/yr</div>
              <p className="text-sm text-gray-500 dark:text-white/30 mt-2 flex items-center justify-center gap-1">
                <Heart className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                Does not include countless hours of development
              </p>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-gray-200/50 dark:border-white/[0.06]">
            <p className="text-lg text-gray-700 dark:text-white/70 leading-relaxed max-w-3xl mx-auto">
              Even though our goal is <span className="text-gray-900 dark:text-white font-semibold">not to make a profit</span>, 
              we offer paid plans to help mitigate the costs and keep Teamy free for everyone.
            </p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-violet-500/20 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/10 border-2 border-violet-500/30 dark:border-violet-500/30'
                    : 'bg-white/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-semibold text-white">
                    Recommended
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-white/40">{plan.period}</span>
                  </div>
                  {plan.altPrice && (
                    <div className="text-sm text-gray-500 dark:text-white/40 mt-1">or {plan.altPrice}</div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-700 dark:text-white/70">
                      <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/login">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 text-white ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/25'
                        : 'bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {/* Club Boosts */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white/90 mb-2">Club Boosts</h2>
              <p className="text-gray-600 dark:text-white/50">$1 each — Upgrade your club&apos;s limits</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {boosts.map((boost, index) => (
                <div
                  key={boost.tier}
                  className={`p-6 rounded-2xl text-center ${
                    index === 2
                      ? 'bg-gradient-to-b from-emerald-500/20 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/10 border-2 border-emerald-500/30 dark:border-emerald-500/30'
                      : 'bg-white/80 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06]'
                  }`}
                >
                  <div className="text-sm text-gray-500 dark:text-white/40 mb-1">{boost.boosts}</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{boost.tier}</h3>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">{boost.price}</div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-white/60">
                    {boost.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
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

