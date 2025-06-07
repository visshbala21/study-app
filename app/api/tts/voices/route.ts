import { NextRequest, NextResponse } from "next/server"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

export async function GET(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status} ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Format the voices for easy reading
    const formattedVoices = data.voices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels,
      preview_url: voice.preview_url
    }))

    return NextResponse.json({
      voices: formattedVoices,
      count: formattedVoices.length
    })

  } catch (error: any) {
    console.error("Error fetching voices:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch voices" },
      { status: 500 }
    )
  }
} 