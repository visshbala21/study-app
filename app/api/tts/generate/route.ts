import { NextRequest, NextResponse } from "next/server"

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM" // Default voice
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

// Text chunking configuration
const MAX_CHUNK_SIZE = 2500 // ElevenLabs has a ~5000 character limit, so we use 2500 for safety
const CHUNK_OVERLAP = 100 // Small overlap to ensure smooth transitions

function splitTextIntoChunks(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ""

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) continue

    // If adding this sentence would exceed the limit, start a new chunk
    if (currentChunk.length + trimmedSentence.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      
      // Start new chunk with overlap from the end of the previous chunk
      const words = currentChunk.trim().split(' ')
      const overlapWords = words.slice(-Math.min(15, words.length)) // Last 15 words for context
      currentChunk = overlapWords.join(' ') + '. ' + trimmedSentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
    }
  }

  // Add the final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.length > 0 ? chunks : [text] // Fallback to original text if splitting fails
}

async function generateAudioChunk(text: string, chunkIndex: number): Promise<Buffer> {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY || '',
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.2,
        use_speaker_boost: true
      }
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error for chunk ${chunkIndex}: ${response.status} ${errorText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function concatenateAudioBuffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers)
}

export async function POST(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your environment variables." },
        { status: 500 }
      )
    }

    const { text, noteId, title } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "Text is required for speech generation" },
        { status: 400 }
      )
    }

    console.log(`Generating speech for note: ${title || noteId}`)
    console.log(`Text length: ${text.length} characters`)

    // Split text into manageable chunks
    const chunks = splitTextIntoChunks(text)
    console.log(`Split into ${chunks.length} chunks`)

    // Generate audio for each chunk
    const audioBuffers: Buffer[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} characters)`)
      
      try {
        const audioBuffer = await generateAudioChunk(chunks[i], i + 1)
        audioBuffers.push(audioBuffer)
        
        // Add a small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (chunkError) {
        console.error(`Failed to generate audio for chunk ${i + 1}:`, chunkError)
        throw chunkError
      }
    }

    // Concatenate all audio chunks
    const finalAudio = concatenateAudioBuffers(audioBuffers)
    
    console.log(`Successfully generated ${finalAudio.length} bytes of audio`)

    // Return the audio file
    return new NextResponse(finalAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': finalAudio.length.toString(),
        'Content-Disposition': `attachment; filename="note-${noteId || 'audio'}.mp3"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error: any) {
    console.error("TTS generation error:", error)
    
    if (error.message?.includes('ElevenLabs API error')) {
      return NextResponse.json(
        { error: `Speech generation failed: ${error.message}` },
        { status: 502 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || "An unexpected error occurred during speech generation",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 