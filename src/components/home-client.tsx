'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreateTeamDialog } from '@/components/create-team-dialog'
import { JoinTeamDialog } from '@/components/join-team-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Users, Plus, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface HomeClientProps {
  memberships: any[]
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
}

export function HomeClient({ memberships, user }: HomeClientProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-apple-light dark:bg-gradient-apple-dark">
      <header className="border-b glass-effect-light dark:glass-effect-dark">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary-light dark:bg-gradient-primary-dark text-white shadow-xl apple-transition">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">SciOly Teams</h1>
              <p className="text-base text-muted-foreground leading-relaxed">Science Olympiad Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-12">
          <h2 className="mb-4 text-5xl font-bold text-foreground leading-tight">Your Teams</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Manage your Science Olympiad teams, events, and schedules
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">No Teams Yet</CardTitle>
              <CardDescription className="text-lg">
                Create your first team or join an existing one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-6">
              <Button onClick={() => setCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Team
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg">
                Join Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-10 flex justify-end gap-6">
              <Button onClick={() => setCreateOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Team
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)} size="lg">
                Join Team
              </Button>
            </div>

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="cursor-pointer apple-hover group"
                  onClick={() => router.push(`/teams/${membership.team.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{membership.team.name}</CardTitle>
                        <CardDescription>
                          Division {membership.team.division}
                        </CardDescription>
                      </div>
                      <Badge variant={membership.role === 'CAPTAIN' ? 'default' : 'secondary'}>
                        {membership.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membership.subteam && (
                      <div className="text-sm text-muted-foreground">
                        Subteam: <span className="font-medium">{membership.subteam.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
        <JoinTeamDialog open={joinOpen} onOpenChange={setJoinOpen} />
      </main>
    </div>
  )
}

