'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, RefreshCw, Eye, EyeOff, Trash2, UserX, X, Save, Link as LinkIcon, Upload, Image as ImageIcon } from 'lucide-react'

type BackgroundOption = 'grid' | 'solid' | 'gradient' | 'image'

interface SettingsTabProps {
  team: any
  currentMembership: any
  isAdmin: boolean
  personalBackground?: any | null
  onBackgroundUpdate?: (preferences: any | null) => void
}

export function SettingsTab({
  team,
  currentMembership,
  isAdmin,
  personalBackground,
  onBackgroundUpdate,
}: SettingsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [adminCode, setAdminCode] = useState<string>('••••••••••••')
  const [memberCode, setMemberCode] = useState<string>('••••••••••••')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [showMemberCode, setShowMemberCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [codesFetched, setCodesFetched] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [codeTypeToRegenerate, setCodeTypeToRegenerate] = useState<'admin' | 'member' | null>(null)
  const [selectedAdminTransferId, setSelectedAdminTransferId] = useState('')
  const [transferringAdmin, setTransferringAdmin] = useState(false)
  const [dismissedTransferPrompt, setDismissedTransferPrompt] = useState(false)
  const adminMemberships = team.memberships.filter(
    (membership: any) => String(membership.role).toUpperCase() === 'ADMIN'
  )
  const regularMembers = team.memberships.filter(
    (membership: any) =>
      membership.id !== currentMembership.id && String(membership.role).toUpperCase() === 'MEMBER'
  )
  const isSoleAdmin =
    String(currentMembership.role).toUpperCase() === 'ADMIN' && adminMemberships.length === 1
  const shouldShowTransferPrompt =
    isSoleAdmin && regularMembers.length > 0 && !dismissedTransferPrompt

  useEffect(() => {
    if (!leaveDialogOpen) {
      setSelectedAdminTransferId('')
      setTransferringAdmin(false)
      setDismissedTransferPrompt(false)
    }
  }, [leaveDialogOpen])
  
  const memberPreferences = personalBackground ?? currentMembership.preferences ?? null
  const defaultColors = {
    backgroundColor: '#f8fafc',
    gradientStartColor: '#e0e7ff',
    gradientEndColor: '#fce7f3',
  }

  // Background customization state
  const [backgroundType, setBackgroundType] = useState<BackgroundOption>(
    (memberPreferences?.backgroundType as BackgroundOption) || 'grid'
  )
  const [backgroundColor, setBackgroundColor] = useState<string>(
    memberPreferences?.backgroundColor || defaultColors.backgroundColor
  )
  const [gradientStartColor, setGradientStartColor] = useState<string>(
    memberPreferences?.gradientStartColor || defaultColors.gradientStartColor
  )
  const [gradientEndColor, setGradientEndColor] = useState<string>(
    memberPreferences?.gradientEndColor || defaultColors.gradientEndColor
  )
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    memberPreferences?.backgroundImageUrl || null
  )
  const [savingBackground, setSavingBackground] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Sync state when preferences/team defaults change
  useEffect(() => {
    setBackgroundType((memberPreferences?.backgroundType as BackgroundOption) || 'grid')
    setBackgroundColor(memberPreferences?.backgroundColor || defaultColors.backgroundColor)
    setGradientStartColor(memberPreferences?.gradientStartColor || defaultColors.gradientStartColor)
    setGradientEndColor(memberPreferences?.gradientEndColor || defaultColors.gradientEndColor)
    setBackgroundImageUrl(memberPreferences?.backgroundImageUrl || null)
  }, [
    memberPreferences?.backgroundType,
    memberPreferences?.backgroundColor,
    memberPreferences?.gradientStartColor,
    memberPreferences?.gradientEndColor,
    memberPreferences?.backgroundImageUrl,
    defaultColors.backgroundColor,
    defaultColors.gradientStartColor,
    defaultColors.gradientEndColor,
  ])

  // Reset drag state when background type changes
  useEffect(() => {
    if (backgroundType !== 'image') {
      setIsDragging(false)
    }
  }, [backgroundType])
  
  const openRemoveMemberDialog = (membershipId: string, memberName: string) => {
    setMemberToRemove({ id: membershipId, name: memberName })
    setRemoveMemberDialogOpen(true)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setRemovingMember(memberToRemove.id)

    try {
      const response = await fetch(`/api/memberships/${memberToRemove.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      toast({
        title: 'Member removed',
        description: `${memberToRemove.name} has been removed from the club`,
      })

      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
      // Data will update on next navigation - no refresh needed
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      })
    } finally {
      setRemovingMember(null)
    }
  }

  const fetchCodes = async () => {
    if (codesFetched) return

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/codes`)
      
      if (!response.ok) throw new Error('Failed to fetch codes')

      const data = await response.json()
      
      if (data.needsRegeneration) {
        toast({
          title: 'Codes need regeneration',
          description: 'Please regenerate the invite codes',
          variant: 'destructive',
        })
        return
      }

      setAdminCode(data.adminCode)
      setMemberCode(data.memberCode)
      setCodesFetched(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invite codes',
        variant: 'destructive',
      })
    }
  }

  const handleShowAdminCode = async () => {
    if (!showAdminCode && !codesFetched) {
      await fetchCodes()
    }
    setShowAdminCode(!showAdminCode)
  }

  const handleShowMemberCode = async () => {
    if (!showMemberCode && !codesFetched) {
      await fetchCodes()
    }
    setShowMemberCode(!showMemberCode)
  }

  const handleRegenerateClick = (type: 'admin' | 'member') => {
    setCodeTypeToRegenerate(type)
    setRegenerateDialogOpen(true)
  }

  const handleRegenerate = async () => {
    if (!codeTypeToRegenerate) return

    setLoading(true)

    try {
      const response = await fetch(`/api/teams/${team.id}/invite/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: codeTypeToRegenerate }),
      })

      if (!response.ok) throw new Error('Failed to regenerate code')

      const data = await response.json()
      
      if (codeTypeToRegenerate === 'admin') {
        setAdminCode(data.code)
        setShowAdminCode(true)
      } else {
        setMemberCode(data.code)
        setShowMemberCode(true)
      }

      setCodesFetched(true) // Mark codes as fetched after regeneration

      toast({
        title: 'Code regenerated',
        description: `New ${codeTypeToRegenerate} invite code generated`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRegenerateDialogOpen(false)
      setCodeTypeToRegenerate(null)
    }
  }

  const getInviteLink = (codeValue: string) => {
    if (typeof window === 'undefined') {
      return `/join?code=${encodeURIComponent(codeValue)}`
    }
    return `${window.location.origin}/join?code=${encodeURIComponent(codeValue)}`
  }

  const handleCopy = async (code: string, type: 'Admin' | 'Member', variant: 'code' | 'link' = 'code') => {
    let realCode = code
    // If code is hidden or codes not fetched, fetch codes first
    if (code === '••••••••••••' || !codesFetched) {
      try {
        const response = await fetch(`/api/teams/${team.id}/invite/codes`)
        if (!response.ok) throw new Error('Failed to fetch codes')
        const data = await response.json()
        if (type === 'Admin') {
          realCode = data.adminCode
          setAdminCode(data.adminCode)
        } else {
          realCode = data.memberCode
          setMemberCode(data.memberCode)
        }
        setCodesFetched(true)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch invite code',
          variant: 'destructive',
        })
        return
      }
    }
    const valueToCopy = variant === 'link' ? getInviteLink(realCode) : realCode

    try {
      await navigator.clipboard.writeText(valueToCopy)
      toast({
        title: 'Copied!',
        description:
          variant === 'link'
            ? `${type} invite link copied to clipboard`
            : `${type} invite code copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTeam = async () => {
    if (deleteConfirmation !== team.name) {
      toast({
        title: 'Error',
        description: 'Team name does not match',
        variant: 'destructive',
      })
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete team')
      }

      toast({
        title: 'Team deleted',
        description: 'The team and all its data have been permanently removed',
      })

      // Redirect to home page after successful deletion
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  const handleLeaveTeam = async () => {
    setLeaving(true)

    try {
      const response = await fetch(`/api/memberships/${currentMembership.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave team')
      }

      toast({
        title: 'Left club',
        description: 'You have successfully left the club',
      })

      // Navigate to home - no refresh needed as we're going to a different page
      router.push('/')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave team',
        variant: 'destructive',
      })
      setLeaving(false)
      setLeaveDialogOpen(false)
    }
  }

  const handleTransferAdmin = async () => {
    if (!selectedAdminTransferId) {
      toast({
        title: 'Select a member',
        description: 'Choose a member to promote before continuing.',
        variant: 'destructive',
      })
      return
    }

    setTransferringAdmin(true)

    try {
      const response = await fetch(`/api/memberships/${selectedAdminTransferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to promote member')
      }

      toast({
        title: 'Member promoted',
        description: 'Selected member now has admin access.',
      })

      setSelectedAdminTransferId('')
      setDismissedTransferPrompt(true)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to promote member',
        variant: 'destructive',
      })
    } finally {
      setTransferringAdmin(false)
    }
  }

  const validateImageFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, WebP, or GIF image'
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return 'Image must be less than 10MB'
    }

    return null
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)

    try {
      const validationError = validateImageFile(file)
      if (validationError) {
        toast({
          title: 'Invalid file',
          description: validationError,
          variant: 'destructive',
        })
        setUploadingImage(false)
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/memberships/${currentMembership.id}/background-image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      setBackgroundImageUrl(data.preferences.backgroundImageUrl)
      setBackgroundType('image')

      onBackgroundUpdate?.(data.preferences)

      toast({
        title: 'Image uploaded',
        description: 'Background image has been uploaded successfully',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (backgroundType === 'image') {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (backgroundType !== 'image' || uploadingImage) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    handleImageUpload(file)
  }

  const handleDeleteImage = async () => {
    setUploadingImage(true)

    try {
      const response = await fetch(`/api/memberships/${currentMembership.id}/background-image`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete image')
      }

      const data = await response.json()

      setBackgroundImageUrl(data.preferences?.backgroundImageUrl || null)
      setBackgroundType((data.preferences?.backgroundType as BackgroundOption) || 'inherit')

      onBackgroundUpdate?.(data.preferences)

      toast({
        title: 'Image deleted',
        description: 'Background image has been removed',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveBackground = async () => {
    setSavingBackground(true)

    try {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      if (backgroundType === 'solid' && backgroundColor && !hexColorRegex.test(backgroundColor)) {
        toast({
          title: 'Invalid color',
          description: 'Please enter a valid hex color (e.g., #ffffff)',
          variant: 'destructive',
        })
        setSavingBackground(false)
        return
      }
      if (backgroundType === 'gradient') {
        if (gradientStartColor && !hexColorRegex.test(gradientStartColor)) {
          toast({
            title: 'Invalid start color',
            description: 'Please enter a valid hex color (e.g., #ffffff)',
            variant: 'destructive',
          })
          setSavingBackground(false)
          return
        }
        if (gradientEndColor && !hexColorRegex.test(gradientEndColor)) {
          toast({
            title: 'Invalid end color',
            description: 'Please enter a valid hex color (e.g., #ffffff)',
            variant: 'destructive',
          })
          setSavingBackground(false)
          return
        }
      }

      if (backgroundType === 'image' && !backgroundImageUrl) {
        toast({
          title: 'Upload required',
          description: 'Please upload an image before saving.',
          variant: 'destructive',
        })
        setSavingBackground(false)
        return
      }

      const response = await fetch(`/api/memberships/${currentMembership.id}/background`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundType,
          backgroundColor,
          gradientStartColor,
          gradientEndColor,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.details 
          ? `${data.error}: ${JSON.stringify(data.details)}`
          : data.message || data.error || 'Failed to update background'
        throw new Error(errorMessage)
      }

      const data = await response.json()

      setBackgroundType(
        (data.preferences?.backgroundType as BackgroundOption) || 'grid'
      )
      setBackgroundColor(data.preferences?.backgroundColor || defaultColors.backgroundColor)
      setGradientStartColor(
        data.preferences?.gradientStartColor || defaultColors.gradientStartColor
      )
      setGradientEndColor(
        data.preferences?.gradientEndColor || defaultColors.gradientEndColor
      )
      setBackgroundImageUrl(data.preferences?.backgroundImageUrl || null)

      onBackgroundUpdate?.(data.preferences)

      toast({
        title: 'Background updated',
        description: 'Your personal background has been updated successfully',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update background',
        variant: 'destructive',
      })
    } finally {
      setSavingBackground(false)
    }
  }

  const previewType = backgroundType

  const previewColors = {
    color: backgroundColor,
    gradientStart: gradientStartColor,
    gradientEnd: gradientEndColor,
    image: backgroundImageUrl,
  }

  const renderBackgroundControls = () => {
    if (backgroundType === 'solid') {
      return (
        <div className="space-y-2">
          <Label htmlFor="background-color">Background Color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="background-color"
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-20 h-12 cursor-pointer"
            />
            <Input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#f8fafc"
              className="flex-1"
            />
          </div>
        </div>
      )
    }

    if (backgroundType === 'gradient') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gradient-start">Start Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="gradient-start"
                type="color"
                value={gradientStartColor}
                onChange={(e) => setGradientStartColor(e.target.value)}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={gradientStartColor}
                onChange={(e) => setGradientStartColor(e.target.value)}
                placeholder="#e0e7ff"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gradient-end">End Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="gradient-end"
                type="color"
                value={gradientEndColor}
                onChange={(e) => setGradientEndColor(e.target.value)}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={gradientEndColor}
                onChange={(e) => setGradientEndColor(e.target.value)}
                placeholder="#fce7f3"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )
    }

    if (backgroundType === 'image') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Background Image</Label>
            {backgroundImageUrl ? (
              <div className="space-y-3">
                <div
                  className={`relative h-32 rounded-lg border-2 overflow-hidden transition-colors ${
                    isDragging ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <img
                    src={backgroundImageUrl || ''}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                  {isDragging && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium text-primary">Drop image to replace</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }
                      input.click()
                    }}
                    disabled={uploadingImage}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingImage ? 'Uploading...' : 'Replace Image'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteImage}
                    disabled={uploadingImage}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                    isDragging ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <ImageIcon
                      className={`mx-auto h-8 w-8 mb-2 transition-colors ${
                        isDragging ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <p
                      className={`text-sm mb-2 transition-colors ${
                        isDragging ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {isDragging ? 'Drop image here' : 'No image uploaded'}
                    </p>
                    {!isDragging && (
                      <p className="text-xs text-muted-foreground">
                        Drag and drop or click to upload
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                    }
                    input.click()
                  }}
                  disabled={uploadingImage}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, WebP, GIF (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Club Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Club Name</p>
            <p className="text-lg">{team.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Division</p>
            <Badge>{team.division}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Members</p>
            <p className="text-lg">{team.memberships.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Teams</p>
            <p className="text-lg">{team.subteams.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background Personalization</CardTitle>
          <CardDescription>
            Choose the background you&apos;d like to see. Changes here affect only your view of this club.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="background-type">Background Type</Label>
            <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value as BackgroundOption)}>
              <SelectTrigger id="background-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Pattern (Default)</SelectItem>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderBackgroundControls()}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="h-32 rounded-lg border-2 border-border overflow-hidden"
              style={{
                background:
                  previewType === 'grid'
                    ? 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)'
                    : previewType === 'solid'
                    ? previewColors.color
                    : previewType === 'gradient'
                    ? `linear-gradient(135deg, ${previewColors.gradientStart} 0%, ${previewColors.gradientEnd} 100%)`
                    : previewType === 'image' && previewColors.image
                    ? `url(${previewColors.image})`
                    : 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
                backgroundSize:
                  previewType === 'grid'
                    ? '24px 24px'
                    : previewType === 'image'
                    ? 'cover'
                    : 'auto',
                backgroundPosition: previewType === 'image' ? 'center' : 'auto',
                backgroundRepeat: previewType === 'image' ? 'no-repeat' : 'repeat',
              }}
            />
          </div>

          <Button
            onClick={handleSaveBackground}
            disabled={savingBackground}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingBackground ? 'Saving...' : 'Save Background'}
          </Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Club Members</CardTitle>
            <CardDescription>
              Manage members and their access to the club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.memberships.map((membership: any) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={membership.user.image || ''} />
                      <AvatarFallback>
                        {membership.user.name?.charAt(0) || membership.user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{membership.user.name || membership.user.email}</p>
                      <div className="flex items-center gap-2">
                        {membership.role === 'ADMIN' && (
                          <Badge variant="outline" className="text-[10px] uppercase">Admin</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('COACH') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Coach</Badge>
                        )}
                        {Array.isArray(membership.roles) && membership.roles.includes('CAPTAIN') && (
                          <Badge variant="outline" className="text-[10px] uppercase">Captain</Badge>
                        )}
                        {membership.subteam && (
                          <span className="text-xs text-muted-foreground">
                            Team: {membership.subteam.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {membership.id !== currentMembership.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRemoveMemberDialog(membership.id, membership.user.name || membership.user.email)}
                      disabled={removingMember === membership.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Admin Invite Code</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Share this code with users who should have admin permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <code className="flex-1 rounded bg-muted px-3 sm:px-4 py-2.5 sm:py-2 font-mono text-xs sm:text-sm break-all">
                  {showAdminCode ? adminCode : '••••••••••••'}
                </code>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShowAdminCode}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    {showAdminCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(adminCode, 'Admin')}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy admin code</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(adminCode, 'Admin', 'link')}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="sr-only">Copy admin invite link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRegenerateClick('admin')}
                    disabled={loading}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Member Invite Code</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Share this code with users who should join as regular members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <code className="flex-1 rounded bg-muted px-3 sm:px-4 py-2.5 sm:py-2 font-mono text-xs sm:text-sm break-all">
                  {showMemberCode ? memberCode : '••••••••••••'}
                </code>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShowMemberCode}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    {showMemberCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(memberCode, 'Member')}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy member code</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(memberCode, 'Member', 'link')}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="sr-only">Copy member invite link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRegenerateClick('member')}
                    disabled={loading}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {team.memberships.length > 1 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Leave Club</CardTitle>
            <CardDescription>
              Remove yourself from this club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you leave, you&apos;ll need an invite code to rejoin this club.
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Leave Club
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this club and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Club
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the club, all teams, 
              announcements, calendar events, roster assignments, and remove all members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-bold">{team.name}</span> to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter club name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmation('')
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleting || deleteConfirmation !== team.name}
            >
              {deleting ? 'Deleting...' : 'Delete Club Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {team.name}? You will need an invite code to rejoin.
            </DialogDescription>
          </DialogHeader>
          {shouldShowTransferPrompt && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are the only admin in this club. Consider promoting another member before you
                  leave so they can manage the club.
                </p>
                <Label htmlFor="new-admin">Choose a member to promote</Label>
                <Select
                  value={selectedAdminTransferId}
                  onValueChange={(value) => setSelectedAdminTransferId(value)}
                >
                  <SelectTrigger id="new-admin">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {regularMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user?.name || member.user?.email || 'Member'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleTransferAdmin}
                  disabled={!selectedAdminTransferId || transferringAdmin}
                >
                  {transferringAdmin ? 'Promoting...' : 'Promote to Admin'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDismissedTransferPrompt(true)}
                  disabled={transferringAdmin}
                >
                  No thanks
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveTeam}
              disabled={leaving}
            >
              {leaving ? 'Leaving...' : 'Leave Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeMemberDialogOpen} onOpenChange={(open) => {
        setRemoveMemberDialogOpen(open)
        if (!open) setMemberToRemove(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from {team.name}? 
              This action cannot be undone and they will need an invite code to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveMemberDialogOpen(false)
                setMemberToRemove(null)
              }}
              disabled={removingMember !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={removingMember !== null}
            >
              {removingMember ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Invite Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate the {codeTypeToRegenerate} invite code? The old code will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerate}
              disabled={loading}
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loading ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

