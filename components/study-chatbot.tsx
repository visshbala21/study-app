"use client"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, User, Bot } from "lucide-react"

// Component to render formatted message content
function MessageContent({ content }: { content: string }) {
  // Split content by double line breaks to create paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim())
  
  // Function to format text with bold markers
  const formatText = (text: string) => {
    // Handle **bold** text
    const boldRegex = /\*\*(.*?)\*\*/g
    const parts = []
    let lastIndex = 0
    let match
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      // Add the bold part
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : [text]
  }
  
  return (
    <div className="space-y-4 max-w-none">
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph contains mathematical equations (simple detection)
        if (paragraph.includes('\\[') || paragraph.includes('F = ma') || (paragraph.includes('=') && paragraph.includes('m'))) {
          return (
            <div key={index} className="space-y-2">
              {paragraph.split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('\\[') || line.includes('F = ma') || (line.includes('=') && line.length < 20 && line.includes('m'))) {
                  return (
                    <div key={lineIndex} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300 my-3">
                      <div className="font-mono text-center text-lg font-semibold text-blue-900">
                        {line.replace(/\\\[|\\\]/g, '').trim()}
                      </div>
                    </div>
                  )
                }
                return (
                  <p key={lineIndex} className="leading-relaxed text-gray-700 break-words">
                    {formatText(line)}
                  </p>
                )
              })}
            </div>
          )
        }
        
        // Handle section headers (lines that end with a colon)
        if (paragraph.includes(':') && paragraph.split('\n')[0].endsWith(':')) {
          const lines = paragraph.split('\n')
          return (
            <div key={index} className="space-y-2">
              <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-1 break-words">
                {formatText(lines[0])}
              </h4>
              {lines.slice(1).map((line, lineIndex) => (
                <p key={lineIndex} className="leading-relaxed text-gray-700 ml-2 break-words">
                  {formatText(line)}
                </p>
              ))}
            </div>
          )
        }
        
        // Handle numbered lists
        if (paragraph.match(/^\d+\./)) {
          return (
            <div key={index} className="space-y-2">
              {paragraph.split('\n').map((line, lineIndex) => {
                if (line.match(/^\d+\./)) {
                  const number = line.match(/^\d+\./)?.[0]
                  const text = line.replace(/^\d+\.\s*/, '')
                  return (
                    <div key={lineIndex} className="flex gap-3">
                      <span className="font-semibold text-blue-600 min-w-[2rem] text-sm flex-shrink-0">
                        {number}
                      </span>
                      <div className="leading-relaxed text-gray-700 flex-1 break-words">
                        {formatText(text)}
                      </div>
                    </div>
                  )
                }
                return (
                  <p key={lineIndex} className="leading-relaxed text-gray-700 ml-8 break-words">
                    {formatText(line)}
                  </p>
                )
              })}
            </div>
          )
        }
        
        // Handle bullet points
        if (paragraph.includes('- \\(') || paragraph.startsWith('-') || paragraph.includes('\n-')) {
          return (
            <div key={index} className="space-y-2">
              {paragraph.split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('-')) {
                  const text = line.replace(/^-\s*/, '').replace(/\\\(|\\\)/g, '')
                  return (
                    <div key={lineIndex} className="flex gap-3">
                      <span className="text-blue-500 mt-1 font-semibold flex-shrink-0">•</span>
                      <div className="leading-relaxed text-gray-700 flex-1 break-words">
                        {formatText(text)}
                      </div>
                    </div>
                  )
                }
                return (
                  <p key={lineIndex} className="leading-relaxed text-gray-700 break-words">
                    {formatText(line)}
                  </p>
                )
              })}
            </div>
          )
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="leading-relaxed text-gray-700 break-words">
            {formatText(paragraph)}
          </p>
        )
      })}
    </div>
  )
}

export default function StudyChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  return (
    <Card className="w-full max-w-4xl h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Study Assistant
        </CardTitle>
        <p className="text-sm text-gray-600">Ask questions about your notes and get contextual answers</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 mb-4 pr-4">
          <div className="space-y-6 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Start a conversation!</p>
                <p className="text-sm">Ask me about your notes or any topic you're studying.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={() => handleInputChange({ target: { value: "Explain Newton's 2nd Law" } } as any)}
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                  >
                    Explain Newton's 2nd Law
                  </button>
                  <button 
                    onClick={() => handleInputChange({ target: { value: "What is photosynthesis?" } } as any)}
                    className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                  >
                    What is photosynthesis?
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[90%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={`rounded-lg px-4 py-3 min-w-0 overflow-hidden ${
                      message.role === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-50 text-gray-900 border shadow-sm"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="break-words">{message.content}</p>
                    ) : (
                      <div className="text-sm">
                        <MessageContent content={message.content} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-50 border shadow-sm rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your notes..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
