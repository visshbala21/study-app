"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react"

export default function UploadNotes() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))

      // Read file content if it's a text file
      if (selectedFile.type === "text/plain" || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setContent(e.target?.result as string)
        }
        reader.readAsText(selectedFile)
      } else {
        setUploadStatus("error")
        setMessage("Please upload a text file (.txt or .md)")
        setTimeout(() => setUploadStatus("idle"), 3000)
      }
    }
  }

  const clearFile = () => {
    setFile(null)
    setTitle("")
    setContent("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setUploadStatus("error")
      setMessage("Please fill in both title and content")
      setTimeout(() => setUploadStatus("idle"), 3000)
      return
    }

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      const response = await fetch("/api/notes/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      })

      const data = await response.json()

      if (response.ok) {
        setUploadStatus("success")
        setMessage(data.message || "Note uploaded successfully!")
        setTitle("")
        setContent("")
        setFile(null)
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('noteUploaded', { detail: data.note }))
        }
      } else {
        setUploadStatus("error")
        setMessage(data.error || "Failed to upload note")
      }
    } catch (error) {
      setUploadStatus("error")
      setMessage("Network error occurred")
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadStatus("idle"), 5000)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Upload Your Notes
          </CardTitle>
          <p className="text-gray-600 mt-2 text-lg">
            Transform your study materials into interactive learning experiences
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File (Optional)
              </Label>
              
              {!file ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-600 mb-1">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports .txt and .md files
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">
                          {(file.size / 1024).toFixed(1)} KB • Ready to upload
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={clearFile}
                      variant="ghost"
                      size="sm"
                      className="text-green-700 hover:bg-green-100"
                      disabled={isUploading}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  {file ? "Edit details below" : "Or enter manually"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Note Title
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter a descriptive title for your notes..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-300"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Note Content
              </Label>
              <Textarea
                id="content"
                placeholder="Paste your study notes here... The AI will analyze and create study materials from this content."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] text-base border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-300 resize-none"
                disabled={isUploading}
              />
              <div className="text-xs text-gray-500 mt-1">
                {content.length} characters • Tip: Longer, detailed notes produce better AI-generated materials
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUploading || !title.trim() || !content.trim()}
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:shadow-lg hover:shadow-purple-500/25 border-0 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Processing Your Notes...
                </>
              ) : (
                <>
                  <Upload className="mr-3 h-5 w-5" />
                  Upload & Process Notes
                </>
              )}
            </Button>
          </form>

          {/* Status Messages */}
          {uploadStatus !== "idle" && (
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              uploadStatus === "success" 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="flex items-center gap-3">
                {uploadStatus === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Pro Tips for Better Results
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>File Upload:</strong> Drag & drop .txt or .md files for instant content loading</li>
              <li>• Include key concepts, definitions, and detailed explanations</li>
              <li>• Use clear headings and bullet points for better organization</li>
              <li>• Add examples and case studies to enhance AI comprehension</li>
              <li>• Longer notes (500+ words) generate more comprehensive materials</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
