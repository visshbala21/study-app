"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function UploadNotes() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))

      // Read file content if it's a text file
      if (selectedFile.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = (e) => {
          setContent(e.target?.result as string)
        }
        reader.readAsText(selectedFile)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    setIsUploading(true)
    try {
      // For demo purposes, we'll use a fixed demo user ID
      // In a production app, you would implement proper authentication
      const demoUserId = "demo-user-123"

      // Insert note
      const { data: note, error } = await supabase
        .from("notes")
        .insert({
          title,
          content,
          file_name: file?.name || null,
          user_id: demoUserId,
        })
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        throw new Error(`Database error: ${error.message}. Please make sure you've run the database setup SQL in your Supabase dashboard.`)
      }

      if (!note) {
        throw new Error("Note was not created successfully")
      }

      console.log("Note created successfully:", note.id)

      // Process the note to generate embeddings (optional - won't block upload)
      setIsProcessing(true)
      
      try {
        // Small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const processResponse = await fetch("/api/notes/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId: note.id }),
        })

        if (!processResponse.ok) {
          const errorText = await processResponse.text()
          let errorData: any = {}
          
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            console.error("Non-JSON error response:", errorText)
            errorData = { error: errorText || 'Unknown processing error' }
          }
          
          console.warn("Processing failed (note still saved):", errorData)
          
          // Reset form even if processing fails
          setTitle("")
          setContent("")
          setFile(null)

          alert("Note uploaded successfully! ✅\n\nNote: Embedding processing failed (likely network issue), but your note is saved and you can still use it for study materials generation.")
          return
        }

        const processResult = await processResponse.json()
        console.log("Note processed successfully:", processResult)

        // Reset form
        setTitle("")
        setContent("")
        setFile(null)

        alert("Note uploaded and processed successfully! ✅")
      } catch (processingError: any) {
        console.warn("Embeddings processing failed (note still saved):", processingError)
        
        // Reset form even if processing fails
        setTitle("")
        setContent("")
        setFile(null)

        alert("Note uploaded successfully! ✅\n\nNote: Embedding processing failed (likely network connectivity issue), but your note is saved and you can still generate study materials.")
      }
    } catch (error: any) {
      console.error("Error uploading note:", error)
      
      // Provide specific error messages
      if (error?.message?.includes("Database error")) {
        alert(`Upload failed: ${error.message}`)
      } else if (error?.message?.includes("Failed to process note")) {
        alert(`Note uploaded but processing failed: ${error.message}`)
      } else {
        alert(`Failed to upload note: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">Upload File (optional)</Label>
            <Input id="file" type="file" accept=".txt,.md" onChange={handleFileChange} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes or textbook excerpts here"
              rows={10}
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={isUploading || isProcessing} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessing ? "Processing..." : "Uploading..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Notes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
