/**
 * API Route Wrapper Utility
 * 
 * Use this wrapper to automatically log API calls, errors, and execution times.
 * 
 * Example usage:
 * 
 * ```typescript
 * import { withApiLogging } from '@/lib/api-wrapper'
 * import { NextRequest, NextResponse } from 'next/server'
 * 
 * export async function GET(req: NextRequest) {
 *   return withApiLogging(req, async () => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'example' })
 *   })
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logApiCall, logError } from '@/lib/api-logger'

export async function withApiLogging(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now()
  const { pathname, search } = req.nextUrl
  const route = pathname + search
  const method = req.method

  let userId: string | undefined
  let ipAddress: string | undefined
  let userAgent: string | undefined
  let requestBody: any = undefined
  let response: NextResponse | null = null
  let error: Error | null = null

  try {
    // Get user session if available
    try {
      const session = await getServerSession(authOptions)
      userId = session?.user?.id
    } catch {
      // Ignore session errors
    }

    // Get request metadata
    ipAddress = 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      req.ip || 
      'unknown'
    userAgent = req.headers.get('user-agent') || undefined

    // Try to capture request body (only for non-GET requests)
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const contentType = req.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const clonedRequest = req.clone()
          requestBody = await clonedRequest.json().catch(() => undefined)
        }
      } catch {
        // Ignore body parsing errors
      }
    }

    // Execute the handler
    response = await handler()
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    
    // Log error
    await logError({
      errorType: error.name,
      message: error.message,
      stack: error.stack,
      userId,
      route: pathname,
      severity: 'ERROR',
      metadata: { method, searchParams: search },
    })

    // Re-throw the error
    throw error
  } finally {
    // Calculate execution time
    const executionTime = Date.now() - startTime

    // Log the API call (non-blocking)
    const statusCode = response?.status || 500
    const contentLength = response?.headers.get('content-length')
    const responseSize = contentLength ? parseInt(contentLength, 10) : undefined

    // Use setImmediate to avoid blocking the response
    setImmediate(async () => {
      try {
        await logApiCall({
          method,
          route: pathname + (search || ''),
          statusCode,
          executionTime,
          userId,
          ipAddress,
          userAgent,
          requestBody,
          responseSize,
          error: error ? `${error.name}: ${error.message}` : statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
        })
      } catch (logError) {
        // Fail silently - don't break the API call if logging fails
        console.error('Failed to log API call:', logError)
      }
    })
  }

  return response || NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

