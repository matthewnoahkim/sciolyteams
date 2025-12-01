'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AppHeader } from '@/components/app-header'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateTournamentClientProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
}

export function CreateTournamentClient({ user }: CreateTournamentClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    division: '' as 'B' | 'C' | '',
    description: '',
    price: '',
    paymentInstructions: '',
    isOnline: false,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields first
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tournament name is required',
        variant: 'destructive',
      })
      return
    }

    if (!formData.division) {
      toast({
        title: 'Validation Error',
        description: 'Division is required',
        variant: 'destructive',
      })
      return
    }

    if (formData.price === '' || parseFloat(formData.price) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be 0 or greater',
        variant: 'destructive',
      })
      return
    }

    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Validation Error',
        description: 'All date and time fields are required',
        variant: 'destructive',
      })
      return
    }

    // Combine date and time into ISO datetime strings
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast({
        title: 'Validation Error',
        description: 'Invalid date or time format',
        variant: 'destructive',
      })
      return
    }

    if (endDateTime <= startDateTime) {
      toast({
        title: 'Validation Error',
        description: 'End date/time must be after start date/time',
        variant: 'destructive',
      })
      return
    }

    // Show approval dialog before creating
    setShowApprovalDialog(true)
  }

  const handleCreateTournament = async () => {
    setShowApprovalDialog(false)
    setLoading(true)

    try {
      // Combine date and time into ISO datetime strings
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      // Prepare the payload
      const payload = {
        name: formData.name.trim(),
        division: formData.division,
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price) || 0,
        paymentInstructions: formData.paymentInstructions.trim() || undefined,
        isOnline: formData.isOnline,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.isOnline ? undefined : (formData.location.trim() || undefined),
      }

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tournament')
      }

      toast({
        title: 'Tournament Created',
        description: 'Your tournament has been submitted and is pending approval.',
      })

      // Redirect to the tournament detail page
      router.push(`/tournaments/${data.tournament.id}`)
    } catch (error: any) {
      console.error('Error creating tournament:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <AppHeader user={user} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/tournaments">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Tournament</CardTitle>
            <CardDescription>
              Submit a new Science Olympiad tournament for approval. Your tournament will be reviewed before being published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tournament Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Regional Science Olympiad Tournament"
                  maxLength={200}
                  required
                />
              </div>

              {/* Division */}
              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => setFormData({ ...formData, division: value as 'B' | 'C' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Division B</SelectItem>
                    <SelectItem value="C">Division C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about the tournament..."
                  rows={4}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Registration Fee (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Payment Instructions */}
              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  placeholder="How should teams pay for registration?"
                  rows={3}
                />
              </div>

              {/* Online Tournament */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOnline"
                  checked={formData.isOnline}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked as boolean })}
                />
                <Label htmlFor="isOnline" className="cursor-pointer">
                  This is an online tournament
                </Label>
              </div>

              {/* Location */}
              {!formData.isOnline && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., University of Science, Room 101"
                  />
                </div>
              )}

              {/* Start Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* End Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Tournament'
                  )}
                </Button>
                <Link href="/tournaments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Science Olympiad Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Science Olympiad Approval</DialogTitle>
            <DialogDescription>
              Is this tournament officially approved by Science Olympiad?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Only tournaments that have been officially approved by Science Olympiad can be submitted.
              If this tournament is not approved, please obtain approval before submitting.
            </p>
            <p className="text-sm text-muted-foreground">
              If approved, your tournament will still need to be reviewed by our platform administrators before being published.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalDialog(false)
                toast({
                  title: 'Submission Cancelled',
                  description: 'Only tournaments approved by Science Olympiad can be submitted.',
                  variant: 'destructive',
                })
              }}
            >
              No, Not Approved
            </Button>
            <Button
              onClick={handleCreateTournament}
              disabled={loading}
            >
              Yes, It&apos;s Approved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

