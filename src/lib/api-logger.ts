import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

interface LogApiCallParams {
  method: string
  route: string
  statusCode: number
  executionTime: number
  userId?: string
  ipAddress?: string
  userAgent?: string
  requestBody?: any
  responseSize?: number
  error?: string
}

export async function logApiCall(params: LogApiCallParams) {
  try {
    // Don't log in a way that blocks the request
    // Use setImmediate to defer the logging
    setImmediate(async () => {
      try {
        await prisma.apiLog.create({
          data: {
            method: params.method,
            route: params.route,
            statusCode: params.statusCode,
            executionTime: params.executionTime,
            userId: params.userId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            requestBody: params.requestBody ? JSON.parse(JSON.stringify(params.requestBody)) : null,
            responseSize: params.responseSize,
            error: params.error?.substring(0, 500), // Limit error message length
          },
        })
      } catch (error) {
        // Fail silently - logging shouldn't break the app
        console.error('Failed to log API call:', error)
      }
    })
  } catch (error) {
    // Fail silently
    console.error('Failed to schedule API log:', error)
  }
}

export async function logError(data: {
  errorType: string
  message: string
  stack?: string
  userId?: string
  route?: string
  severity?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  metadata?: any
}) {
  try {
    setImmediate(async () => {
      try {
        await prisma.errorLog.create({
          data: {
            errorType: data.errorType,
            message: data.message,
            stack: data.stack?.substring(0, 5000), // Limit stack trace length
            userId: data.userId,
            route: data.route,
            severity: data.severity || 'ERROR',
            metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          },
        })
      } catch (error) {
        console.error('Failed to log error:', error)
      }
    })
  } catch (error) {
    console.error('Failed to schedule error log:', error)
  }
}

export async function logActivity(data: {
  action: string
  description: string
  userId?: string
  logType?: 'USER_ACTION' | 'ADMIN_ACTION' | 'SYSTEM_EVENT' | 'API_USAGE' | 'ERROR' | 'WARNING'
  severity?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  route?: string
  metadata?: any
}) {
  try {
    setImmediate(async () => {
      try {
        await prisma.activityLog.create({
          data: {
            action: data.action,
            description: data.description,
            userId: data.userId,
            logType: data.logType || 'SYSTEM_EVENT',
            severity: data.severity || 'INFO',
            route: data.route,
            metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          },
        })
      } catch (error) {
        console.error('Failed to log activity:', error)
      }
    })
  } catch (error) {
    console.error('Failed to schedule activity log:', error)
  }
}

