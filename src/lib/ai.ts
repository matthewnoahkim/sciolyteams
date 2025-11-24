import OpenAI from 'openai'

let cachedClient: OpenAI | null = null

export function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  cachedClient = new OpenAI({ apiKey })
  return cachedClient
}

export function ensureOpenAIConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in the environment.')
  }
}

