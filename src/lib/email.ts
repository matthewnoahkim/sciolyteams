import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface CalendarEventDetails {
  startUTC: Date
  endUTC: Date
  location?: string
  description?: string
  rsvpEnabled?: boolean
}

export interface SendAnnouncementEmailParams {
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  teamId: string
  teamName: string
  title: string
  content: string
  announcementId: string
  calendarEvent?: CalendarEventDetails
}

/**
 * Format event time for email display
 */
function formatEventTimeForEmail(startUTC: Date, endUTC: Date): string {
  const startDate = new Date(startUTC)
  const endDate = new Date(endUTC)
  
  // Check if it's an all-day event
  const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
                   endDate.getHours() === 23 && endDate.getMinutes() === 59
  
  if (isAllDay) {
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else {
      const startDay = startDate.getDate()
      const endDay = endDate.getDate()
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' })
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' })
      const startYear = startDate.getFullYear()
      const endYear = endDate.getFullYear()
      
      if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth} ${startDay}-${endDay}, ${startYear}`
      } else if (startYear === endYear) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
      } else {
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
      }
    }
  } else {
    return `${startDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${endDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`
  }
}

/**
 * Send announcement email to users
 */
export async function sendAnnouncementEmail({
  to,
  cc,
  bcc,
  replyTo,
  teamId,
  teamName,
  title,
  content,
  announcementId,
  calendarEvent,
}: SendAnnouncementEmailParams): Promise<{ messageId: string | null }> {
  try {
    // Validate we have the API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return { messageId: null }
    }

    // Validate we have at least one recipient
    if (!to || to.length === 0) {
      console.error('No primary recipients provided')
      return { messageId: null }
    }

    // Build the team stream URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const teamStreamUrl = `${baseUrl}/teams/${teamId}?tab=stream`

    // Build event details section if this is an event announcement
    let eventDetailsHtml = ''
    if (calendarEvent) {
      const formattedTime = formatEventTimeForEmail(calendarEvent.startUTC, calendarEvent.endUTC)
      eventDetailsHtml = `
        <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <h2 style="color: #1f2937; font-size: 16px; margin-top: 0; margin-bottom: 12px;">📅 Event Details</h2>
          <div style="color: #374151; font-size: 14px; line-height: 1.8;">
            <p style="margin: 8px 0;"><strong>When:</strong> ${formattedTime}</p>
            ${calendarEvent.location ? `<p style="margin: 8px 0;"><strong>Where:</strong> ${calendarEvent.location}</p>` : ''}
          </div>
          ${calendarEvent.rsvpEnabled ? `
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #d1d5db;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              💬 <strong>Please RSVP on the team stream</strong> to let us know if you're coming!
            </p>
          </div>
          ` : ''}
        </div>
      `
    }

    console.log('Sending email via Resend:', {
      to: to.length,
      cc: cc?.length || 0,
      bcc: bcc?.length || 0,
      subject: `[${teamName}] ${title}`,
    })

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Teamy <noreply@teamy.app>',
      to,
      cc,
      bcc,
    reply_to: replyTo,
      subject: `[${teamName}] ${title}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-top: 0;">
            ${title}
          </h1>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
            Posted in <strong>${teamName}</strong>
          </p>
          
          ${eventDetailsHtml}
          
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap; margin-bottom: 32px;">
            ${content}
          </div>
          
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
          
          <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
              View and respond to this announcement on your team stream
            </p>
            <a href="${teamStreamUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
              Go to Team Stream
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            Teamy • Team Management Platform
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return { messageId: null }
    }

    console.log('Email sent successfully, message ID:', data?.id)
    return { messageId: data?.id || null }
  } catch (error) {
    console.error('Email service error:', error)
    return { messageId: null }
  }
}

