import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Formats a division string for display (e.g., "B&C" -> "B & C", "B" -> "B")
 */
export function formatDivision(division: string): string {
  if (!division) return ''
  // Handle "B&C" or "B & C" or similar variations
  if (division.includes('&') || division.includes('and')) {
    return division
      .replace(/&/g, ' & ')
      .replace(/\s+/g, ' ')
      .replace(/\s*&\s*/g, ' & ')
      .trim()
  }
  return division
}

/**
 * Checks if a club/team division matches a tournament division
 * Handles "B&C" tournaments matching both "B" and "C" clubs
 */
export function divisionsMatch(tournamentDivision: string, clubDivision: string): boolean {
  if (!tournamentDivision || !clubDivision) return false
  if (tournamentDivision === clubDivision) return true
  
  // If tournament is "B&C" (or variations), it matches both B and C
  if (tournamentDivision.includes('B') && tournamentDivision.includes('C')) {
    return clubDivision === 'B' || clubDivision === 'C'
  }
  
  // If tournament is just B or C, check if club matches
  if (tournamentDivision === 'B' || tournamentDivision === 'C') {
    return clubDivision === tournamentDivision || clubDivision.includes(tournamentDivision)
  }
  
  return false
}

