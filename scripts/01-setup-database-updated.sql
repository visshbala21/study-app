-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create notes table to store uploaded content
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL  -- Using TEXT for demo purposes instead of UUID reference
);

-- Create embeddings table for vector search (using OpenAI embeddings with 1536 dimensions)
CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(1536), -- Using OpenAI text-embedding-3-small with 1536 dimensions
  chunk_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('flashcard', 'summary', 'quiz')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS note_embeddings_embedding_idx 
ON note_embeddings USING ivfflat (embedding vector_cosine_ops);

-- For demo purposes, we'll disable RLS to allow easy access
-- In production, you would keep RLS enabled and implement proper authentication

-- Disable RLS (Row Level Security) for demo
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Users can only access their own notes" ON notes;
DROP POLICY IF EXISTS "Users can only access embeddings for their notes" ON note_embeddings;
DROP POLICY IF EXISTS "Users can only access their study materials" ON study_materials; 