'use client'

import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function PasswordCopyButton({ password }: { password: string }) {
  const { toast } = useToast()

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(password)
        toast({
          title: 'Copied',
          description: 'Password copied to clipboard',
        })
      }}
      className="h-9"
    >
      <Copy className="h-3 w-3 mr-1" />
      Copy
    </Button>
  )
}

