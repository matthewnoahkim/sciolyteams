'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreateTeamDialog } from '@/components/create-team-dialog'
import { JoinTeamDialog } from '@/components/join-team-dialog'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SciOly Teams</h1>
              <p className="text-xs text-muted-foreground">Science Olympiad Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
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
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Your Teams</h2>
          <p className="text-muted-foreground">
            Manage your Science Olympiad teams, events, and schedules
          </p>
        </div>

        {memberships.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>No Teams Yet</CardTitle>
              <CardDescription>
                Create your first team or join an existing one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                Join Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex justify-end gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                Join Team
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="cursor-pointer transition-shadow hover:shadow-lg"
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

