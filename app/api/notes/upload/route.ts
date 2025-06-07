import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Title and content cannot be empty" },
        { status: 400 }
      )
    }

    // For demo purposes, we'll use a fixed demo user ID
    // In a production app, you would implement proper authentication
    const demoUserId = "demo-user-123"

    // Insert note into database
    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        title: title.trim(),
        content: content.trim(),
        user_id: demoUserId,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: `Database error: ${error.message}. Please make sure your database is properly configured.` },
        { status: 500 }
      )
    }

    if (!note) {
      return NextResponse.json(
        { error: "Note was not created successfully" },
        { status: 500 }
      )
    }

    console.log("Note created successfully:", note.id)

    // Try to process embeddings in the background (non-blocking)
    try {
      // Small delay to ensure database transaction is committed
      setTimeout(async () => {
        try {
          const processResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notes/process`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ noteId: note.id }),
            }
          )

          if (!processResponse.ok) {
            console.warn("Background processing failed (note still saved):", await processResponse.text())
          } else {
            console.log("Note processed successfully in background")
          }
        } catch (bgError) {
          console.warn("Background processing failed (note still saved):", bgError)
        }
      }, 500)
    } catch (bgError) {
      console.warn("Failed to initiate background processing:", bgError)
    }

    return NextResponse.json({
      success: true,
      message: "Note uploaded successfully! 🎉",
      noteId: note.id,
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        uploaded_at: note.uploaded_at
      }
    })

  } catch (error: any) {
    console.error("Upload error:", error)
    
    return NextResponse.json(
      { 
        error: error.message || "An unexpected error occurred while uploading the note",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 