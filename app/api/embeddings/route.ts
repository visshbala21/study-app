import type { NextRequest } from "next/server"
import { generateEmbedding } from "@/lib/embeddings"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    const embedding = await generateEmbedding(text)

    return Response.json({ embedding })
  } catch (error) {
    console.error("Error generating embedding:", error)
    return Response.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}
