import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadNotes from "@/components/upload-notes"
import StudyMaterials from "@/components/study-materials"
import StudyChatbot from "@/components/study-chatbot"
import MyLibrary from "@/components/my-library"
import { BookOpen, Upload, Brain, MessageCircle, Sparkles, Zap, Target } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-primary relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="container mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-2 mb-6 border border-white/30">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-white font-medium text-sm">AI-Powered Study Experience</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Smart Study
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-100 to-white bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Transform your notes into interactive study materials with AI-powered flashcards, 
              summaries, and an intelligent chatbot companion
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 text-white/80">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span className="font-medium">Instant AI Generation</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Target className="h-5 w-5 text-green-300" />
                <span className="font-medium">Smart Learning</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Brain className="h-5 w-5 text-pink-300" />
                <span className="font-medium">Personalized Experience</span>
              </div>
            </div>
          </div>

          {/* Main Application */}
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="upload" className="w-full">
              {/* Enhanced Tab Navigation */}
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-4 w-full max-w-2xl h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
                  <TabsTrigger 
                    value="upload" 
                    className="flex items-center gap-3 h-12 rounded-xl font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="materials" 
                    className="flex items-center gap-3 h-12 rounded-xl font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <Brain className="h-5 w-5" />
                    <span className="hidden sm:inline">Study</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat" 
                    className="flex items-center gap-3 h-12 rounded-xl font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="library" 
                    className="flex items-center gap-3 h-12 rounded-xl font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span className="hidden sm:inline">Library</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content with Glass Morphism */}
              <div className="mt-8">
                <TabsContent value="upload" className="mt-0">
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl glass rounded-3xl p-8 shadow-2xl">
                      <UploadNotes />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="mt-0">
                  <div className="glass rounded-3xl p-8 shadow-2xl">
                    <StudyMaterials />
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                  <div className="flex justify-center">
                    <div className="w-full max-w-4xl glass rounded-3xl p-8 shadow-2xl">
                      <StudyChatbot />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="library" className="mt-0">
                  <div className="glass rounded-3xl p-8 shadow-2xl">
                    <MyLibrary />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pb-8">
            <div className="inline-flex items-center gap-2 text-white/60 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI • Built for Students</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
