import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendAnnouncementEmailParams {
  to: string
  teamName: string
  title: string
  content: string
  announcementId: string
}

/**
 * Send announcement email to a user
 */
export async function sendAnnouncementEmail({
  to,
  teamName,
  title,
  content,
  announcementId,
}: SendAnnouncementEmailParams): Promise<{ messageId: string | null }> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SciOly Teams <noreply@sciolyteams.com>',
      to: [to],
      subject: `[Team ${teamName}] ${title}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">
            ${title}
          </h1>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
            Posted in <strong>${teamName}</strong>
          </p>
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">
            ${content}
          </div>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #9ca3af; font-size: 12px;">
            View this announcement in your team stream
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { messageId: null }
    }

    return { messageId: data?.id || null }
  } catch (error) {
    console.error('Email service error:', error)
    return { messageId: null }
  }
}

