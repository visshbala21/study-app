import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          title: string
          content: string
          file_name: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          title: string
          content: string
          file_name?: string | null
          user_id: string
        }
      }
      note_embeddings: {
        Row: {
          id: string
          note_id: string
          content_chunk: string
          embedding: number[]
          chunk_index: number
          created_at: string
        }
        Insert: {
          note_id: string
          content_chunk: string
          embedding: number[]
          chunk_index: number
        }
      }
      study_materials: {
        Row: {
          id: string
          note_id: string
          type: "flashcard" | "summary" | "quiz"
          content: any
          created_at: string
        }
        Insert: {
          note_id: string
          type: "flashcard" | "summary" | "quiz"
          content: any
        }
      }
    }
  }
}
