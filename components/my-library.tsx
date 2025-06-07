"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Calendar, FileText, Trash2, Eye, RefreshCw, Volume2, VolumeX } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import AudioPlayer from "@/components/audio-player"

interface Note {
  id: string
  title: string
  content: string
  uploaded_at: string
  user_id: string
}

export default function MyLibrary() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioNote, setAudioNote] = useState<Note | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [generatingNoteId, setGeneratingNoteId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
    
    // Listen for new note uploads
    const handleNoteUploaded = () => {
      fetchNotes()
    }
    
    window.addEventListener('noteUploaded', handleNoteUploaded)
    
    return () => {
      window.removeEventListener('noteUploaded', handleNoteUploaded)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNotes(filtered)
    }
  }, [searchQuery, notes])

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (!error && data) {
        setNotes(data)
      } else if (error) {
        console.error("Error fetching notes:", error)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)

      if (!error) {
        setNotes(prev => prev.filter(note => note.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
        }
      } else {
        console.error("Error deleting note:", error)
        alert("Failed to delete note. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Failed to delete note. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const generateAudio = async (note: Note) => {
    if (isGeneratingAudio) return

    setIsGeneratingAudio(true)
    setGeneratingNoteId(note.id)
    setAudioNote(note)

    try {
      // Choose between ElevenLabs and AkashChat
      const endpoint = process.env.NEXT_PUBLIC_USE_AKASH_TTS === 'true' 
        ? "/api/tts/akash" 
        : "/api/tts/generate"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: note.content,
          noteId: note.id,
          title: note.title,
        }),
      })

      if (response.ok) {
        // Create a blob URL for the audio
        const audioBlob = await response.blob()
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
      } else {
        const errorData = await response.json()
        alert(`Failed to generate audio: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error generating audio:", error)
      alert("Failed to generate audio. Please try again.")
    } finally {
      setIsGeneratingAudio(false)
      setGeneratingNoteId(null)
    }
  }

  const closeAudioPlayer = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioNote(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading your library...</span>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-xl mb-2">Your note library is empty</p>
        <p>Upload some notes to get started!</p>
        <Button 
          onClick={fetchNotes} 
          variant="outline" 
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            My Library
          </h2>
          <p className="text-gray-600 text-lg">
            {notes.length} note{notes.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-300"
            />
          </div>
          <Button 
            onClick={fetchNotes} 
            variant="outline" 
            size="icon"
            title="Refresh library"
            className="h-12 w-12 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 rounded-xl transition-all duration-300"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {filteredNotes.length === 0 && searchQuery ? (
        <div className="text-center text-gray-500 py-8">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No notes found matching "{searchQuery}"</p>
          <Button 
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="mt-2"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="card-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2 flex-1 group-hover:text-purple-700 transition-colors duration-300">
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => generateAudio(note)}
                      title="Generate audio"
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                      disabled={isGeneratingAudio}
                    >
                      {generatingNoteId === note.id ? (
                        <VolumeX className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedNote(note)}
                      title="View note"
                      className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {truncateContent(note.content)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(note.uploaded_at)}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                    <FileText className="h-3 w-3 mr-1" />
                    {note.content.length} chars
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedNote.title}
                  </h2>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(selectedNote.uploaded_at)}
                    </Badge>
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {selectedNote.content.length} characters
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                  {selectedNote.content}
                </pre>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => deleteNote(selectedNote.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Note
              </Button>
              <Button onClick={() => setSelectedNote(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {(isGeneratingAudio || audioUrl) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <AudioPlayer
            audioUrl={audioUrl || undefined}
            title={audioNote?.title || ""}
            onClose={closeAudioPlayer}
            isGenerating={isGeneratingAudio}
          />
        </div>
      )}
    </div>
  )
} 