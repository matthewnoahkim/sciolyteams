import { NextRequest, NextResponse } from 'next/server'

// WARNING: This endpoint is for development only
// Verify dev panel password server-side

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    let devPassword = process.env.DEV_PANEL_PASSWORD

    if (!devPassword) {
      console.error('DEV_PANEL_PASSWORD is not set in environment variables')
      return NextResponse.json(
        { error: 'Dev panel is not configured' },
        { status: 500 }
      )
    }

    // Trim whitespace and remove quotes if present
    devPassword = devPassword.trim().replace(/^["']|["']$/g, '')
    // Handle various escape sequences that dotenv might not process correctly
    // ${} with empty var name should become $, but if it doesn't, fix it
    if (devPassword.startsWith('${}')) {
      devPassword = devPassword.replace(/^\$\{\}/, '$')
    }
    // Handle $$ escape sequence (dotenv converts $$ to $)
    if (devPassword.startsWith('$$') && !devPassword.startsWith('$$$')) {
      devPassword = devPassword.replace(/^\$\$/, '$')
    }
    // Handle \$ escape sequence
    if (devPassword.startsWith('\\$')) {
      devPassword = devPassword.replace(/^\\\$/, '$')
    }
    // Workaround: If password got truncated due to $ variable expansion,
    // detect and fix it (e.g., "$-Olymp1ad" should be "$cience-Olymp1ad")
    if (devPassword === '$-Olymp1ad') {
      devPassword = '$cience-Olymp1ad'
      console.warn('Fixed truncated password due to $ variable expansion')
    }
    const trimmedPassword = password.trim()

    // Debug logging (remove in production)
    console.log('Password check:', {
      received: `"${trimmedPassword}"`,
      receivedLength: trimmedPassword.length,
      expected: `"${devPassword}"`,
      expectedLength: devPassword.length,
      match: trimmedPassword === devPassword,
      charCodes: {
        received: trimmedPassword.split('').map(c => c.charCodeAt(0)),
        expected: devPassword.split('').map(c => c.charCodeAt(0)),
      },
    })

    if (trimmedPassword === devPassword) {
      return NextResponse.json({ success: true })
    } else {
      // Return debug info in development
      const isDev = process.env.NODE_ENV === 'development'
      return NextResponse.json(
        { 
          error: 'Incorrect password',
          ...(isDev && {
            debug: {
              receivedLength: trimmedPassword.length,
              expectedLength: devPassword.length,
              receivedFirstChar: trimmedPassword.charAt(0),
              expectedFirstChar: devPassword.charAt(0),
              receivedLastChar: trimmedPassword.charAt(trimmedPassword.length - 1),
              expectedLastChar: devPassword.charAt(devPassword.length - 1),
            }
          })
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    )
  }
}

