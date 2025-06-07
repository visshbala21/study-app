import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase/client"

// Function to truncate content to stay within token limits
function truncateContent(content: string, maxTokens: number = 8000): string {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4
  if (content.length <= maxChars) {
    return content
  }
  
  // Truncate and add indication
  const truncated = content.substring(0, maxChars)
  return truncated + "\n\n[Note: Content truncated for processing...]"
}

export async function POST(request: NextRequest) {
  try {
    const { noteId, type } = await request.json()

    // Get the note content
    const { data: note, error: noteError } = await supabase.from("notes").select("*").eq("id", noteId).single()

    if (noteError || !note) {
      return Response.json({ error: "Note not found" }, { status: 404 })
    }

    // Truncate content to avoid token limits
    const truncatedContent = truncateContent(note.content)

    let prompt = ""
    let systemPrompt = ""

    switch (type) {
      case "flashcard":
        systemPrompt = "You are an expert educator. Create flashcards from the given content. Return ONLY a valid JSON array, no markdown formatting or explanations."
        prompt = `Create 5-10 flashcards from this content. Return as a JSON array with "question" and "answer" fields. Do not use markdown code blocks, return only the JSON:

${truncatedContent}`
        break
      case "summary":
        systemPrompt = "You are an expert summarizer. Create concise, comprehensive summaries."
        prompt = `Create a comprehensive summary of this content, highlighting key concepts and important details:

${truncatedContent}`
        break
      case "quiz":
        systemPrompt = "You are an expert educator. Create quiz questions from the given content. Return ONLY a valid JSON array, no markdown formatting or explanations."
        prompt = `Create 5-8 multiple choice quiz questions from this content. Return as a JSON array with "question", "options" array, and "correctAnswer" index. Do not use markdown code blocks, return only the JSON:

${truncatedContent}`
        break
      default:
        return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    // Use GPT-4o-mini for better rate limits and lower cost
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000, // Limit output tokens to stay within limits
    })

    let content
    try {
      if (type === "summary") {
        content = { summary: text }
      } else {
        // Extract JSON from markdown code blocks if present
        let jsonText = text.trim()
        
        // Remove markdown code block markers
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        content = JSON.parse(jsonText)
      }
    } catch (parseError) {
      console.warn("Failed to parse AI response as JSON:", parseError)
      console.warn("Raw AI response:", text)
      
      // Fallback for non-JSON responses
      if (type === "flashcard") {
        content = [{ question: "Failed to parse response", answer: text }]
      } else if (type === "quiz") {
        content = [{ question: "Failed to parse response", options: ["Please try again"], correctAnswer: 0 }]
      } else {
        content = { raw: text }
      }
    }

    // Store the generated study material
    const { data: studyMaterial, error: materialError } = await supabase
      .from("study_materials")
      .insert({
        note_id: noteId,
        type,
        content,
      })
      .select()
      .single()

    if (materialError) {
      throw materialError
    }

    return Response.json({ studyMaterial })
  } catch (error: any) {
    console.error("Error generating study material:", error)
    
    // Check if it's a rate limit error and provide helpful message
    if (error?.message?.includes("rate_limit_exceeded") || error?.message?.includes("Request too large")) {
      return Response.json({ 
        error: "Content too large. Please try with a shorter note or wait a moment and try again." 
      }, { status: 429 })
    }
    
    return Response.json({ error: "Failed to generate study material" }, { status: 500 })
  }
}
