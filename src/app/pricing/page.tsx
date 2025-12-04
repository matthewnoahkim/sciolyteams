import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  ArrowLeft, Check, Server, Mail, Cloud, Database, Globe, Cpu, Calculator, Heart
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const isLoggedIn = !!session?.user

  const totalCost = costs.reduce((sum, cost) => {
    const amount = parseFloat(cost.amount.replace('$', '').replace(',', ''))
    return sum + amount
  }, 0)

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-6">
            <HomeNav variant="light" />
            <ThemeToggle variant="header" />
            <Link href={isLoggedIn ? "/dashboard" : "/login"}>
              <button className="px-5 py-2.5 text-sm font-semibold bg-white text-teamy-primary rounded-full hover:bg-white/90 transition-colors shadow-sm">
                {isLoggedIn ? "Dashboard" : "Sign In"}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
              Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparent pricing to keep Teamy running
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Running Costs</h2>
              <p className="text-muted-foreground">What it costs to maintain teamy.io</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {costs.map((cost) => (
                <div
                  key={cost.name}
                  className="p-4 rounded-xl bg-card border border-border text-center shadow-sm"
                >
                  <cost.icon className="h-6 w-6 text-teamy-primary mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground mb-1">{cost.name}</div>
                  <div className="text-lg font-bold text-foreground">
                    {cost.amount}
                    <span className="text-xs text-muted-foreground">{cost.period}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center p-6 rounded-2xl bg-card border border-border shadow-card">
              <div className="text-sm text-muted-foreground mb-1">Total annual cost</div>
              <div className="text-4xl font-bold text-teamy-primary">${totalCost.toLocaleString()}/yr</div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Heart className="h-4 w-4 text-rose-500" />
                Does not include countless hours of development
              </p>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="text-center mb-12 p-8 rounded-2xl bg-teamy-primary/5 border border-teamy-primary/20">
            <p className="text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
              Even though our goal is <span className="font-semibold">not to make a profit</span>, 
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
                    ? 'bg-teamy-primary/5 border-2 border-teamy-primary shadow-lg'
                    : 'bg-card border border-border shadow-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-teamy-primary text-white text-xs font-semibold">
                    Recommended
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="font-heading text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.altPrice && (
                    <div className="text-sm text-muted-foreground mt-1">or {plan.altPrice}</div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-foreground">
                      <Check className="h-5 w-5 text-teamy-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/login">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-teamy-primary text-white hover:bg-teamy-primary-dark'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Club Boosts</h2>
              <p className="text-muted-foreground">$1 each — Upgrade your club&apos;s limits</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {boosts.map((boost, index) => (
                <div
                  key={boost.tier}
                  className={`p-6 rounded-2xl text-center ${
                    index === 2
                      ? 'bg-teamy-primary/5 border-2 border-teamy-primary'
                      : 'bg-card border border-border shadow-card'
                  }`}
                >
                  <div className="text-sm text-muted-foreground mb-1">{boost.boosts}</div>
                  <h3 className="font-heading text-xl font-bold mb-2 text-foreground">{boost.tier}</h3>
                  <div className="text-2xl font-bold text-teamy-primary mb-4">{boost.price}</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
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
              <button className="px-8 py-4 text-lg font-semibold bg-teamy-primary text-white rounded-full hover:bg-teamy-primary-dark transition-colors shadow-lg hover:shadow-xl">
                Get Started Free
              </button>
            </Link>
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
