import { NextRequest, NextResponse } from 'next/server'

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1441856071911211228/fXL-cAc4oLN2flLH3W7nDcTGkupuKNvETf1ExSUqhSuCo8ZUrY5vovxIWQjY7qNBkRtf'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create Discord embed message
    const discordPayload = {
      embeds: [
        {
          title: '📧 New Contact Form Submission',
          color: 0x3b82f6, // Blue color
          fields: [
            {
              name: '👤 Name',
              value: name,
              inline: true,
            },
            {
              name: '📧 Email',
              value: email,
              inline: true,
            },
            {
              name: '📋 Subject',
              value: subject,
              inline: false,
            },
            {
              name: '💬 Message',
              value: message.length > 1024 ? message.substring(0, 1021) + '...' : message,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Teamy Contact Form',
          },
        },
      ],
    }

    // Send to Discord webhook
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    })

    if (!discordResponse.ok) {
      console.error('Discord webhook failed:', await discordResponse.text())
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

