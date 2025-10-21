'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  currentReactions?: Array<{
    emoji: string
    count: number
    hasUserReacted: boolean
  }>
  onReactionToggle?: (emoji: string) => void
  disabled?: boolean
}

const POPULAR_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥',
  '👏', '💯', '✨', '🚀', '💪', '🎯', '👀', '🤔'
]

// Global state to ensure only one picker is open
let globalOpenPicker: (() => void) | null = null

export function EmojiPicker({ 
  onEmojiSelect, 
  currentReactions = [], 
  onReactionToggle,
  disabled = false 
}: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const closePicker = () => {
    setShowPicker(false)
    globalOpenPicker = null
  }

  const openPicker = () => {
    // Close any other open picker
    if (globalOpenPicker) {
      globalOpenPicker()
    }
    
    // Calculate position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      })
    }
    
    setShowPicker(true)
    globalOpenPicker = closePicker
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        closePicker()
      }
    }

    if (showPicker) {
      // Add a small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 10)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showPicker])

  const handleEmojiClick = (emoji: string) => {
    if (onReactionToggle) {
      onReactionToggle(emoji)
    } else {
      onEmojiSelect(emoji)
    }
    closePicker()
  }

  return (
    <div ref={containerRef} className="relative flex gap-1 flex-wrap items-center">
      {/* Show existing reactions */}
      {currentReactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.hasUserReacted ? "default" : "outline"}
          size="sm"
          onClick={() => onReactionToggle?.(reaction.emoji)}
          disabled={disabled}
          className="h-6 px-2 text-sm"
        >
          {reaction.emoji} {reaction.count}
        </Button>
      ))}
      
      {/* Add reaction button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={openPicker}
        disabled={disabled}
        className="h-6 w-6 p-0"
      >
        <Smile className="h-3 w-3" />
      </Button>
      
      {/* Emoji picker dropdown - rendered as portal */}
      {showPicker && createPortal(
        <>
          {/* Backdrop to catch clicks */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={closePicker}
          />
          {/* Dropdown */}
          <div 
            ref={dropdownRef}
            className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 z-[9999]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            <div className="grid grid-cols-4 gap-1">
              {POPULAR_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
