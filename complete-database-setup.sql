-- Complete Database Setup for AI Study Assistant
-- Run this entire script in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS note_embeddings CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE; 
DROP TABLE IF EXISTS notes CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_documents(vector, float, int);

-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL
);

-- Create embeddings table (1536 dimensions for OpenAI)
CREATE TABLE note_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study materials table
CREATE TABLE study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('flashcard', 'summary', 'quiz')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector search index
CREATE INDEX note_embeddings_embedding_idx 
ON note_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Disable RLS for demo purposes
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;

-- Create search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  note_id uuid,
  content_chunk text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    note_embeddings.note_id,
    note_embeddings.content_chunk,
    1 - (note_embeddings.embedding <=> query_embedding) AS similarity
  FROM note_embeddings
  JOIN notes ON notes.id = note_embeddings.note_id
  WHERE 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY note_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$; 