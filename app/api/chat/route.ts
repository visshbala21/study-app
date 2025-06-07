import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase/client"
import { generateEmbedding } from "@/lib/embeddings"

export async function POST(request: Request) {
  const { messages } = await request.json()
  const lastMessage = messages[messages.length - 1].content

  let context = ""
  let hasEmbeddings = false

  try {
    // Try to generate embedding for the user's question
    const questionEmbedding = await generateEmbedding(lastMessage)

    // Search for relevant content using vector similarity
    const { data: relevantChunks, error } = await supabase.rpc("match_documents", {
      query_embedding: questionEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    })

    if (error) {
      console.error("Error searching documents:", error)
    } else if (relevantChunks && relevantChunks.length > 0) {
      // Build context from relevant chunks
      context = relevantChunks.map((chunk: any) => chunk.content_chunk).join("\n\n")
      hasEmbeddings = true
      console.log(`Found ${relevantChunks.length} relevant chunks via embeddings`)
    }
  } catch (embeddingError) {
    console.warn("Embeddings failed, falling back to recent notes:", embeddingError)
    
    // Fallback: Get recent notes content as context
    try {
      const { data: recentNotes, error: notesError } = await supabase
        .from("notes")
        .select("title, content")
        .order("uploaded_at", { ascending: false })
        .limit(3)

      if (!notesError && recentNotes && recentNotes.length > 0) {
        context = recentNotes
          .map((note: any) => `${note.title}:\n${note.content}`)
          .join("\n\n---\n\n")
        console.log(`Using ${recentNotes.length} recent notes as fallback context`)
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError)
    }
  }

  const systemPrompt = context 
    ? `You are a helpful study assistant. Use the following context from the user's notes to answer their questions. If the context doesn't contain relevant information, say so and provide general educational guidance.

${hasEmbeddings ? 'Context from relevant note sections:' : 'Context from recent notes:'}
${context}

Instructions:
- Answer based on the provided context when possible
- Be educational and helpful
- If asked to explain concepts, break them down clearly
- Suggest study techniques when appropriate`
    : `You are a helpful study assistant. The user doesn't have any notes uploaded yet, or there was a technical issue accessing them. Provide general educational guidance and encourage them to upload their study materials.

Instructions:
- Be educational and helpful
- Explain concepts clearly
- Suggest study techniques
- Encourage uploading notes for personalized assistance`

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"), // Use mini for better reliability
      system: systemPrompt,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat:", error)
    return Response.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
