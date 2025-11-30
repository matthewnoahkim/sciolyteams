import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { SignInThemeToggle } from '@/components/signin-theme-toggle'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { HomeNav } from '@/components/home-nav'
import { format } from 'date-fns'

interface Props {
  params: { slug: string }
}

export default async function BlogPostPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  })

  if (!post || !post.published) {
    notFound()
  }

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
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to blog</span>
          </Link>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                {post.title}
              </span>
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.authorName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
          </header>

          {/* Content */}
          <article className="prose prose-invert prose-lg max-w-none">
            <div 
              className="text-white/80 leading-relaxed space-y-6 [&>p]:mb-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white/90 [&>h3]:mt-8 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>blockquote]:border-l-4 [&>blockquote]:border-violet-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-white/60 [&>code]:bg-white/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>pre]:bg-white/5 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
            />
          </article>
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

