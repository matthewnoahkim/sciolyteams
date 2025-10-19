'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface SettingsTabProps {
  team: any
  isCaptain: boolean
}

export function SettingsTab({ team, isCaptain }: SettingsTabProps) {
  const { toast } = useToast()
  const [captainCode, setCaptainCode] = useState<string>('••••••••••••')
  const [memberCode, setMemberCode] = useState<string>('••••••••••••')
  const [showCaptainCode, setShowCaptainCode] = useState(false)
  const [showMemberCode, setShowMemberCode] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegenerate = async (type: 'captain' | 'member') => {
    if (!confirm(`Are you sure you want to regenerate the ${type} invite code? The old code will no longer work.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) throw new Error('Failed to regenerate code')

      const data = await response.json()
      
      if (type === 'captain') {
        setCaptainCode(data.code)
        setShowCaptainCode(true)
      } else {
        setMemberCode(data.code)
        setShowMemberCode(true)
      }

      toast({
        title: 'Code regenerated',
        description: `New ${type} invite code generated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (code: string, type: string) => {
    if (code === '••••••••••••') {
      toast({
        title: 'Error',
        description: 'Please reveal the code first',
        variant: 'destructive',
      })
      return
    }

    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: `${type} invite code copied to clipboard`,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Team Name</p>
            <p className="text-lg">{team.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Division</p>
            <Badge>{team.division}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Members</p>
            <p className="text-lg">{team.memberships.length} / 15</p>
          </div>
          <div>
            <p className="text-sm font-medium">Subteams</p>
            <p className="text-lg">{team.subteams.length}</p>
          </div>
        </CardContent>
      </Card>

      {isCaptain && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Captain Invite Code</CardTitle>
              <CardDescription>
                Share this code with users who should have captain permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-4 py-2 font-mono text-sm">
                  {showCaptainCode ? captainCode : '••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCaptainCode(!showCaptainCode)}
                >
                  {showCaptainCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(captainCode, 'Captain')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerate('captain')}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Invite Code</CardTitle>
              <CardDescription>
                Share this code with users who should join as regular members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-4 py-2 font-mono text-sm">
                  {showMemberCode ? memberCode : '••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowMemberCode(!showMemberCode)}
                >
                  {showMemberCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(memberCode, 'Member')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRegenerate('member')}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isCaptain && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only team captains can view and manage invite codes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

