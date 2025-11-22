/**
 * Updates the browser favicon to show a notification badge with a count
 * Similar to how Discord, Slack, and other apps show unread message counts
 */

export function updateFaviconBadge(count: number) {
  // Always create the favicon with the logo
  // Create canvas to draw the badge - use larger size for better quality
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw gradient background (blue to purple)
  const gradient = ctx.createLinearGradient(0, 0, 64, 64)
  gradient.addColorStop(0, '#3b82f6') // Blue
  gradient.addColorStop(1, '#9333ea') // Purple
  ctx.fillStyle = gradient
  
  // Draw rounded rectangle background
  const radius = 12
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(64 - radius, 0)
  ctx.quadraticCurveTo(64, 0, 64, radius)
  ctx.lineTo(64, 64 - radius)
  ctx.quadraticCurveTo(64, 64, 64 - radius, 64)
  ctx.lineTo(radius, 64)
  ctx.quadraticCurveTo(0, 64, 0, 64 - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.fill()
  
  // Draw "T" letter for Teamy
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('T', 32, 32)

  // Only draw the red notification badge if there are notifications
  if (count > 0) {
    // Draw red notification badge circle (Discord style - smaller, positioned better)
    const badgeSize = count > 99 ? 28 : count > 9 ? 26 : 22
    const badgeX = 64 - badgeSize / 2 - 2
    const badgeY = badgeSize / 2 + 2
    
    // Red background
    ctx.fillStyle = '#ed4245' // Discord red
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI)
    ctx.fill()

    // White border around badge (thinner for Discord look)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw the count text
    const countText = count > 99 ? '99+' : count.toString()
    ctx.fillStyle = '#ffffff'
    ctx.font = count > 99 
      ? 'bold 14px Arial' 
      : count > 9 
      ? 'bold 16px Arial' 
      : 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(countText, badgeX, badgeY)
  }

  // Convert canvas to data URL and update favicon
  const dataUrl = canvas.toDataURL('image/png')
  
  // Remove existing badge favicon links
  const existingLinks = document.querySelectorAll("link[rel*='icon'][data-badge='true']")
  existingLinks.forEach(link => link.remove())

  // Create new favicon link
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.href = dataUrl
  link.setAttribute('data-badge', 'true')
  document.head.appendChild(link)
}

/**
 * Loads the actual favicon image and draws a badge on it
 * This is more accurate than drawing from scratch
 */
export async function updateFaviconBadgeWithImage(count: number, faviconUrl: string = '/favicon.svg') {
  try {
    // Load the favicon image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => {
        // If favicon doesn't exist, use fallback with logo
        updateFaviconBadge(count)
        reject(new Error('Favicon not found'))
      }
      img.src = faviconUrl + '?t=' + Date.now() // Cache bust
    })

    // Create canvas - use larger size for better quality
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw the favicon
    ctx.drawImage(img, 0, 0, 64, 64)

    // Only draw the red notification badge if there are notifications
    if (count > 0) {
      // Draw red notification badge circle (Discord style)
      const badgeSize = count > 99 ? 28 : count > 9 ? 26 : 22
      const badgeX = 64 - badgeSize / 2 - 2
      const badgeY = badgeSize / 2 + 2
      
      // Red background
      ctx.fillStyle = '#ed4245' // Discord red
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI)
      ctx.fill()

      // White border around badge
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw the count text
      const countText = count > 99 ? '99+' : count.toString()
      ctx.fillStyle = '#ffffff'
      ctx.font = count > 99 
        ? 'bold 14px Arial' 
        : count > 9 
        ? 'bold 16px Arial' 
        : 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(countText, badgeX, badgeY)
    }

    // Convert canvas to data URL and update favicon
    const dataUrl = canvas.toDataURL('image/png')
    
    // Remove existing badge favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon'][data-badge='true']")
    existingLinks.forEach(link => link.remove())

    // Create new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = dataUrl
    link.setAttribute('data-badge', 'true')
    document.head.appendChild(link)
  } catch (error) {
    // Fallback to simple badge with "T" logo
    updateFaviconBadge(count)
  }
}

