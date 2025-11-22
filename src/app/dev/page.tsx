'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
        alert('Failed to delete user')
      }
    } catch (error) {
      alert('Error deleting user')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
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
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {users.map((user) => (
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
                        <p className="font-medium">{user.name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No activity logs yet</p>
              ) : (
                logs.map((log) => (
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
                          {log.user?.name || log.user?.email || 'Unknown user'}
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
              )}
            </div>
          </CardContent>
        </Card>
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

