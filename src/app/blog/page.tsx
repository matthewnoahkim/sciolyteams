import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { format } from 'date-fns'

export default async function BlogPage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/15 to-fuchsia-600/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <div className="flex items-center gap-6">
            <HomeNav />
            <SignInThemeToggle />
            <Link href="/login">
              <button className="px-5 py-2.5 text-sm font-semibold bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Updates, announcements, and insights from the Teamy team
            </p>
          </div>

          {/* Blog Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                    {post.coverImage && (
                      <div className="mb-6 rounded-xl overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <h2 className="text-2xl font-bold mb-3 text-white/90 group-hover:text-white transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-white/50 mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {post.authorName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-sm text-violet-400 group-hover:text-violet-300 transition-colors">
                        Read more
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-white/30">© {new Date().getFullYear()} Teamy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

