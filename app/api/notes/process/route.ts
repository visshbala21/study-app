import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { generateEmbedding, chunkText } from "@/lib/embeddings"

export async function POST(request: NextRequest) {
  try {
    const { noteId } = await request.json()
    
    if (!noteId) {
      return Response.json({ error: "Note ID is required" }, { status: 400 })
    }

    console.log("Processing note with ID:", noteId)

    // Get the note content
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single()

    if (noteError) {
      console.error("Database error finding note:", noteError)
      return Response.json({ 
        error: `Database error: ${noteError.message}`,
        noteId: noteId
      }, { status: 404 })
    }

    if (!note) {
      console.error("Note not found with ID:", noteId)
      // Let's also check if any notes exist at all
      const { data: allNotes, error: countError } = await supabase
        .from("notes")
        .select("id, title")
        .limit(5)
      
      console.log("Recent notes in database:", allNotes)
      
      return Response.json({ 
        error: "Note not found",
        noteId: noteId,
        hint: "Note may not have been saved to database"
      }, { status: 404 })
    }

    console.log("Found note:", { id: note.id, title: note.title, contentLength: note.content.length })

    // Chunk the content
    const chunks = chunkText(note.content)
    console.log(`Processing ${chunks.length} chunks for note ${noteId}`)

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk)
      return {
        note_id: noteId,
        content_chunk: chunk,
        embedding,
        chunk_index: index,
      }
    })

    const embeddings = await Promise.all(embeddingPromises)
    console.log(`Generated ${embeddings.length} embeddings`)

    // Store embeddings
    const { error: embeddingError } = await supabase.from("note_embeddings").insert(embeddings)

    if (embeddingError) {
      console.error("Error storing embeddings:", embeddingError)
      throw new Error(`Failed to store embeddings: ${embeddingError.message}`)
    }

    console.log("Successfully processed note:", noteId)
    return Response.json({ success: true, chunksProcessed: chunks.length })
  } catch (error: any) {
    console.error("Error processing note:", error)
    return Response.json({ 
      error: error.message || "Failed to process note",
      details: error.toString()
    }, { status: 500 })
  }
}
