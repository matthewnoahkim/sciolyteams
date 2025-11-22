/**
 * Client-side utilities for test security
 * These functions can be used in browser/client components
 */

/**
 * Generate a client fingerprint hash from browser data
 * Uses Web Crypto API (browser-compatible)
 */
export async function generateClientFingerprint(data: {
  userAgent: string
  timezone?: string
  platform?: string
  language?: string
}): Promise<string> {
  const fingerprint = JSON.stringify(data)
  
  // Use Web Crypto API for browser compatibility
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

