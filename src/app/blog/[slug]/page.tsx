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
import { MarkdownRenderer } from '@/components/markdown-renderer'

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
    <div className="min-h-screen flex flex-col bg-background text-foreground grid-pattern">
      {/* Header - Theme Aware */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="auto" />
          <div className="flex items-center gap-6">
            <HomeNav variant="default" />
            <SignInThemeToggle variant="header" />
            <Link href="/login">
              <button className="px-5 py-2.5 text-sm font-semibold bg-teamy-primary text-white rounded-full hover:bg-teamy-primary-dark transition-colors shadow-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to blog</span>
          </Link>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-card">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          <article className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-heading prose-a:text-teamy-primary">
            <MarkdownRenderer content={post.content} />
          </article>
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
