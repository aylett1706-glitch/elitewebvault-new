import { createGroq } from '@ai-sdk/groq'
import { createOllama } from '@ai-sdk/ollama'
import { createQwen } from '@ai-sdk/qwen'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

// Initialize ALL providers
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const ollama = createOllama({ baseURL: 'http://localhost:11434/api' })
const qwen = createQwen({ apiKey: process.env.QWEN_API_KEY })

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      system = "You are the ForgeSync AI Support Assistant.",
      provider = "groq", // default to Groq, user can pick ollama/qwen
      model
    } = await req.json()

    // Pick the provider & model automatically
    const getModel = () => {
      switch(provider) {
        case "ollama": return ollama(model || "qwen2.5:7b")
        case "qwen": return qwen(model || "qwen-turbo")
        default: return groq(model || "llama-3.1-8b-instant")
      }
    }

    const result = streamText({
      model: getModel(),
      system,
      prompt,
      temperature: 0.6
    })

    return result.toDataStreamResponse()
  } catch (err) {
    console.error('AI Error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
