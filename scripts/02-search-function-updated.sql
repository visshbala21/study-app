-- Create function for vector similarity search (updated for 1536 dimensions and no auth)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
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