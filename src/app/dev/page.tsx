'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, AlertTriangle, Search, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HealthTools } from '@/components/dev/health-tools'

// WARNING: This is a development-only page with hardcoded password
// DO NOT use this pattern in production environments
// This page should be removed or properly secured before deployment

const DEV_PASSWORD = '$cience-Olymp1ad'

export default function DevPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [logSearchQuery, setLogSearchQuery] = useState('')

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('dev_auth', 'true')
    } else {
      alert('Incorrect password')
    }
  }

  useEffect(() => {
    // Check if already authenticated in this session
    if (sessionStorage.getItem('dev_auth') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
      fetchLogs()
    }
  }, [isAuthenticated])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dev/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/dev/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/dev/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('User deleted successfully')
        fetchUsers()
        fetchLogs()
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleExportUser = (user: any) => {
    // Helper function to escape CSV fields
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      // If contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // User Basic Information
    const userSection = [
      ['User Information'],
      ['User ID', user.id],
      ['Name', user.name || 'No name'],
      ['Email', user.email],
      ['Created At', new Date(user.createdAt).toLocaleString()],
      [''],
      ['Teams'],
      ['Team Name', 'Team ID', 'Role', 'Subteam', 'Joined At']
    ]

    // Add team memberships
    const membershipRows = (user.memberships || []).map((m: any) => [
      escapeCSV(m.team?.name || 'N/A'),
      escapeCSV(m.team?.id || 'N/A'),
      escapeCSV(m.role || 'N/A'),
      escapeCSV(m.subteam?.name || 'None'),
      escapeCSV(new Date(m.createdAt).toLocaleString()),
    ])

    if (membershipRows.length === 0) {
      membershipRows.push(['No teams', '', '', '', ''])
    }

    // Combine all sections
    const csvContent = [
      ...userSection.map((row) => row.map(escapeCSV).join(',')),
      ...membershipRows.map((row) => row.join(',')),
    ].join('\n')

    // Add BOM for Excel compatibility with special characters
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = (user.name || user.email || 'user').replace(/[^a-z0-9]/gi, '-').toLowerCase()
    link.download = `${safeName}-${user.id.substring(0, 8)}-export-${new Date().toISOString().split('T')[0]}.csv`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dev Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Access Dev Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Development Panel</h1>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false)
              sessionStorage.removeItem('dev_auth')
            }}
          >
            Logout
          </Button>
        </div>

        <div className="bg-destructive/10 border border-destructive p-4 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Development Only</p>
            <p className="text-sm text-muted-foreground">
              This page contains sensitive data and should be removed before production deployment.
            </p>
          </div>
        </div>

        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="health">Site Health & Error Tools</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-6">
            <HealthTools />
          </TabsContent>

          <TabsContent value="legacy" className="mt-6 space-y-6">
            {/* Users Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Users ({users.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchUsers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* User Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" 
                      style={{ 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        willChange: 'transform'
                      }} 
                    />
                    <Input
                      placeholder="Search users by name, email, or user ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {users
                      .filter((user) => {
                        if (!userSearchQuery) return true
                        const query = userSearchQuery.toLowerCase()
                        return (
                          user.name?.toLowerCase().includes(query) ||
                          user.email?.toLowerCase().includes(query) ||
                          user.id?.toLowerCase().includes(query)
                        )
                      })
                      .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || ''} />
                            <AvatarFallback>
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {user.name || 'No name'}
                              {user.email && (
                                <span className="text-muted-foreground font-normal"> ({user.email})</span>
                              )}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {user.memberships?.length || 0} teams
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportUser(user)}
                            title="Export user data"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user)
                              setDeleteDialogOpen(true)
                            }}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Logs Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Logs ({logs.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchLogs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Log Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" 
                      style={{ 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        willChange: 'transform'
                      }} 
                    />
                    <Input
                      placeholder="Search logs by action, description, user, or metadata..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const filteredLogs = logs.filter((log) => {
                      if (!logSearchQuery) return true
                      const query = logSearchQuery.toLowerCase()
                      return (
                        log.action?.toLowerCase().includes(query) ||
                        log.description?.toLowerCase().includes(query) ||
                        log.user?.name?.toLowerCase().includes(query) ||
                        log.user?.email?.toLowerCase().includes(query) ||
                        JSON.stringify(log.metadata || {})?.toLowerCase().includes(query)
                      )
                    })
                    
                    if (filteredLogs.length === 0) {
                      return <p className="text-muted-foreground">No activity logs found</p>
                    }
                    
                    return filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Badge variant="outline" className="mt-1">
                          {log.action}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              {log.user?.name 
                                ? `${log.user.name} (${log.user.email})` 
                                : log.user?.email || 'Unknown user'}
                            </span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          {log.metadata && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name || userToDelete?.email}?
              This will permanently delete all their data including memberships, events, and posts.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

