'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { useToast } from '@/components/ui/use-toast'
import { 
  Edit, 
  Save, 
  X, 
  Trophy, 
  MapPin, 
  Calendar,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TournamentHostingRequest {
  id: string
  tournamentName: string
  tournamentLevel: string
  division: string
  tournamentFormat: string
  location: string | null
  preferredSlug: string | null
  directorName: string
  directorEmail: string
  directorPhone: string | null
  otherNotes: string | null
  status: string
  reviewNotes: string | null
  createdAt: string | Date
}

interface Section {
  id: string
  type: 'header' | 'text' | 'image' | 'html'
  title: string
  content: string
}

interface TournamentPageClientProps {
  hostingRequest: TournamentHostingRequest
  isDirector: boolean
  user?: any
}

export function TournamentPageClient({ hostingRequest, isDirector, user }: TournamentPageClientProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      type: 'header',
      title: 'About',
      content: `Welcome to ${hostingRequest.tournamentName}! This is a ${hostingRequest.tournamentLevel} Science Olympiad tournament for Division ${hostingRequest.division}.`
    }
  ])
  const [saving, setSaving] = useState(false)

  // Load saved page content
  useEffect(() => {
    const loadPageContent = async () => {
      try {
        const response = await fetch(`/api/tournament-pages/${hostingRequest.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.pageContent) {
            setSections(JSON.parse(data.pageContent))
          }
        }
      } catch (error) {
        console.error('Error loading page content:', error)
      }
    }
    loadPageContent()
  }, [hostingRequest.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/tournament-pages/${hostingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageContent: JSON.stringify(sections) })
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: 'Saved!',
        description: 'Your tournament page has been updated.',
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save tournament page.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: type === 'header' ? 'New Section' : '',
      content: type === 'text' ? 'Enter your content here...' : ''
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id))
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id)
    if (direction === 'up' && index > 0) {
      const newSections = [...sections]
      ;[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]]
      setSections(newSections)
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      setSections(newSections)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-teamy-primary dark:bg-slate-900 shadow-nav">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" href="/" variant="light" />
          <div className="flex items-center gap-4">
            <ThemeToggle variant="header" />
            {isDirector && !isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Page
              </Button>
            )}
            {isDirector && isEditing && (
              <>
                <Button 
                  onClick={handleSave}
                  size="sm"
                  className="gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
            {user && (
              <Link href="/td">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Back to Portal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Tournament Hero */}
      <section className="bg-gradient-to-b from-teamy-primary/10 to-transparent py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className="text-sm">{hostingRequest.tournamentLevel.charAt(0).toUpperCase() + hostingRequest.tournamentLevel.slice(1)}</Badge>
            <Badge variant="outline" className="text-sm">Division {hostingRequest.division}</Badge>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold">{hostingRequest.tournamentName}</h1>
          {hostingRequest.location && (
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              {hostingRequest.location}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Edit Mode Toolbar */}
        {isEditing && (
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg">Add Section</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => addSection('header')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Header
              </Button>
              <Button size="sm" onClick={() => addSection('text')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Text
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id} className={isEditing ? 'border-2 border-dashed' : ''}>
              <CardContent className="p-6">
                {isEditing && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">{section.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        ↓
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-4">
                    {section.type === 'header' && (
                      <div className="space-y-2">
                        <Label>Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder="Enter content..."
                        rows={section.type === 'header' ? 3 : 6}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {section.type === 'header' && section.title && (
                      <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                    )}
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{section.content}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Default empty state */}
        {sections.length === 0 && !isEditing && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>No content has been added to this tournament page yet.</p>
              {isDirector && (
                <p className="mt-2">Click &quot;Edit Page&quot; to get started!</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
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

