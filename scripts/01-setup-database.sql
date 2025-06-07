-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create notes table to store uploaded content
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create embeddings table for vector search
CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding VECTOR(384), -- Using gte-small model with 384 dimensions
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

-- Enable RLS (Row Level Security)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access embeddings for their notes" ON note_embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_embeddings.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only access their study materials" ON study_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = study_materials.note_id 
      AND notes.user_id = auth.uid()
    )
  );
