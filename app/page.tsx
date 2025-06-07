import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadNotes from "@/components/upload-notes"
import StudyMaterials from "@/components/study-materials"
import StudyChatbot from "@/components/study-chatbot"
import MyLibrary from "@/components/my-library"
import { BookOpen, Upload, Brain, MessageCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Study Assistant</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your notes into interactive study materials with AI-powered flashcards, summaries, and an
            intelligent chatbot
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Notes
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Study Materials
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Library
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="upload" className="flex justify-center">
              <UploadNotes />
            </TabsContent>

            <TabsContent value="materials">
              <StudyMaterials />
            </TabsContent>

            <TabsContent value="chat" className="flex justify-center">
              <StudyChatbot />
            </TabsContent>

            <TabsContent value="library">
              <MyLibrary />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
