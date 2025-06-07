"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Calendar, FileText, Trash2, Eye, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

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

  useEffect(() => {
    fetchNotes()
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Library</h2>
          <p className="text-gray-600">
            {notes.length} note{notes.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={fetchNotes} 
            variant="outline" 
            size="icon"
            title="Refresh library"
          >
            <RefreshCw className="h-4 w-4" />
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
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2 flex-1">
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedNote(note)}
                      title="View note"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {truncateContent(note.content)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(note.uploaded_at)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
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
    </div>
  )
} 