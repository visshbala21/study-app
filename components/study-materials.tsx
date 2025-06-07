"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Brain, FileText, HelpCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Note {
  id: string
  title: string
  content: string
  uploaded_at: string
}

interface StudyMaterial {
  id: string
  type: "flashcard" | "summary" | "quiz"
  content: any
  created_at: string
}

export default function StudyMaterials() {
  const [notes, setNotes] = useState<Note[]>([])
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([])
  const [selectedNote, setSelectedNote] = useState<string>("")
  const [loadingStates, setLoadingStates] = useState({
    flashcard: false,
    summary: false,
    quiz: false,
  })
  const [activeFlashcard, setActiveFlashcard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [collapsedQuizzes, setCollapsedQuizzes] = useState<Set<string>>(new Set())
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>({}) // quizId -> questionIndex -> selectedOption
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, Set<number>>>({}) // quizId -> Set of answered question indices

  useEffect(() => {
    fetchNotes()
    fetchStudyMaterials()
  }, [])

  const fetchNotes = async () => {
    const { data, error } = await supabase.from("notes").select("*").order("uploaded_at", { ascending: false })

    if (!error && data) {
      setNotes(data)
    }
  }

  const fetchStudyMaterials = async () => {
    const { data, error } = await supabase.from("study_materials").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setStudyMaterials(data)
    }
  }

  const generateMaterial = async (type: "flashcard" | "summary" | "quiz") => {
    if (!selectedNote) return

    // Set loading state for specific button
    setLoadingStates(prev => ({ ...prev, [type]: true }))
    
    try {
      const response = await fetch("/api/study-materials/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: selectedNote, type }),
      })

      if (response.ok) {
        fetchStudyMaterials()
      }
    } catch (error) {
      console.error("Error generating material:", error)
    } finally {
      // Clear loading state for specific button
      setLoadingStates(prev => ({ ...prev, [type]: false }))
    }
  }

  const flashcards = studyMaterials.filter((m) => m.type === "flashcard")
  const summaries = studyMaterials.filter((m) => m.type === "summary")
  const quizzes = studyMaterials.filter((m) => m.type === "quiz")

  // Check if any button is loading (for disabling all buttons)
  const isAnyGenerating = Object.values(loadingStates).some(Boolean)

  // Toggle quiz collapse state
  const toggleQuizCollapse = (quizId: string) => {
    setCollapsedQuizzes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(quizId)) {
        newSet.delete(quizId)
      } else {
        newSet.add(quizId)
      }
      return newSet
    })
  }

  // Helper to get quiz title
  const getQuizTitle = (material: StudyMaterial, index: number) => {
    const questionCount = Array.isArray(material.content) ? material.content.length : 0
    const date = new Date(material.created_at).toLocaleDateString()
    return `Quiz ${index + 1} (${questionCount} questions) - ${date}`
  }

  // Handle quiz answer selection
  const handleAnswerSelection = (quizId: string, questionIndex: number, selectedOption: number) => {
    // Don't allow changes if question is already answered
    if (answeredQuestions[quizId]?.has(questionIndex)) {
      return
    }

    // Record the answer
    setQuizAnswers(prev => ({
      ...prev,
      [quizId]: {
        ...prev[quizId],
        [questionIndex]: selectedOption
      }
    }))

    // Mark question as answered
    setAnsweredQuestions(prev => ({
      ...prev,
      [quizId]: new Set([...(prev[quizId] || []), questionIndex])
    }))
  }

  // Reset quiz (allow retaking)
  const resetQuiz = (quizId: string) => {
    setQuizAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[quizId]
      return newAnswers
    })
    
    setAnsweredQuestions(prev => {
      const newAnswered = { ...prev }
      delete newAnswered[quizId]
      return newAnswered
    })
  }

  // Get quiz statistics
  const getQuizStats = (quizId: string, questions: any[]) => {
    const answered = answeredQuestions[quizId]?.size || 0
    const correct = questions.reduce((count, question, index) => {
      const userAnswer = quizAnswers[quizId]?.[index]
      const isAnswered = answeredQuestions[quizId]?.has(index)
      return isAnswered && userAnswer === question.correctAnswer ? count + 1 : count
    }, 0)
    
    return { answered, correct, total: questions.length }
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-secondary flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
            Generate Study Materials
          </CardTitle>
          <p className="text-gray-600 mt-2 text-lg">
            Transform your notes into flashcards, summaries, and quizzes with AI
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-700">Select Note</label>
            <select
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-base focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
            >
              <option value="">Choose a note to get started...</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => generateMaterial("flashcard")}
              disabled={!selectedNote || isAnyGenerating}
              className="h-14 text-base font-semibold bg-gradient-success hover:shadow-lg hover:shadow-blue-500/25 border-0 rounded-xl transition-all duration-300"
            >
              {loadingStates.flashcard ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
              Generate Flashcards
            </Button>
            <Button
              onClick={() => generateMaterial("summary")}
              disabled={!selectedNote || isAnyGenerating}
              className="h-14 text-base font-semibold bg-gradient-warning hover:shadow-lg hover:shadow-green-500/25 border-0 rounded-xl transition-all duration-300"
            >
              {loadingStates.summary ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
              Generate Summary
            </Button>
            <Button 
              onClick={() => generateMaterial("quiz")} 
              disabled={!selectedNote || isAnyGenerating} 
              className="h-14 text-base font-semibold bg-gradient-secondary hover:shadow-lg hover:shadow-pink-500/25 border-0 rounded-xl transition-all duration-300"
            >
              {loadingStates.quiz ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
              Generate Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="flashcards" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-xl h-14 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-2">
            <TabsTrigger 
              value="flashcards" 
              className="h-10 rounded-xl font-semibold text-gray-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              🃏 Flashcards ({flashcards.length})
            </TabsTrigger>
            <TabsTrigger 
              value="summaries"
              className="h-10 rounded-xl font-semibold text-gray-600 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              📄 Summaries ({summaries.length})
            </TabsTrigger>
            <TabsTrigger 
              value="quizzes"
              className="h-10 rounded-xl font-semibold text-gray-600 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              🧠 Quizzes ({quizzes.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="flashcards" className="space-y-4">
          {flashcards.map((material) => (
            <Card key={material.id}>
              <CardContent className="pt-6">
                {Array.isArray(material.content) && material.content.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {activeFlashcard + 1} / {material.content.length}
                      </Badge>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveFlashcard(Math.max(0, activeFlashcard - 1))}
                          disabled={activeFlashcard === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveFlashcard(Math.min(material.content.length - 1, activeFlashcard + 1))}
                          disabled={activeFlashcard === material.content.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div
                      className="min-h-[200px] p-6 border rounded-lg cursor-pointer"
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      <div className="text-center">
                        {!showAnswer ? (
                          <div>
                            <HelpCircle className="h-8 w-8 mx-auto mb-4 text-blue-500" />
                            <p className="text-lg font-medium">{material.content[activeFlashcard]?.question}</p>
                            <p className="text-sm text-gray-500 mt-4">Click to reveal answer</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg">{material.content[activeFlashcard]?.answer}</p>
                            <p className="text-sm text-gray-500 mt-4">Click to see question</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No flashcards available</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          {summaries.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>{material.content.summary || material.content.raw}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">No quizzes available</p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((material, quizIndex) => {
              const isCollapsed = collapsedQuizzes.has(material.id)
              const questionCount = Array.isArray(material.content) ? material.content.length : 0
              
              return (
                <Card key={material.id} className="overflow-hidden">
                  {/* Quiz Header - Always Visible */}
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleQuizCollapse(material.id)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        <span>{getQuizTitle(material, quizIndex)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {questionCount} questions
                        </Badge>
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  {/* Quiz Content - Collapsible */}
                  {!isCollapsed && (
                    <CardContent className="pt-0">
                      {Array.isArray(material.content) ? (
                        <div className="space-y-6">
                          {/* Quiz Statistics */}
                          {(() => {
                            const stats = getQuizStats(material.id, material.content)
                            return stats.answered > 0 ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      Progress: {stats.answered}/{stats.total} questions answered
                                    </p>
                                    <p className="text-sm text-blue-700">
                                      Score: {stats.correct}/{stats.answered} correct ({Math.round((stats.correct / stats.answered) * 100)}%)
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => resetQuiz(material.id)}
                                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                  >
                                    Reset Quiz
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                  📝 Select your answers below. You'll see the correct answer after each question.
                                </p>
                              </div>
                            )
                          })()}

                          {/* Questions */}
                          {material.content.map((question: any, index: number) => {
                            const isAnswered = answeredQuestions[material.id]?.has(index)
                            const userAnswer = quizAnswers[material.id]?.[index]
                            const isCorrect = isAnswered && userAnswer === question.correctAnswer
                            
                            return (
                              <div key={index} className={`border rounded-lg p-4 transition-colors ${
                                isAnswered 
                                  ? isCorrect 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-medium text-gray-900 flex-1">
                                    {index + 1}. {question.question}
                                  </h4>
                                  {isAnswered && (
                                    <div className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
                                      isCorrect 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  {question.options?.map((option: string, optIndex: number) => {
                                    const isSelected = userAnswer === optIndex
                                    const isCorrectOption = optIndex === question.correctAnswer
                                    
                                    return (
                                      <label 
                                        key={optIndex} 
                                        className={`flex items-center space-x-3 p-3 rounded transition-colors cursor-pointer ${
                                          isAnswered
                                            ? isCorrectOption
                                              ? 'bg-green-100 border border-green-300'
                                              : isSelected
                                                ? 'bg-red-100 border border-red-300'
                                                : 'bg-white border border-gray-200'
                                            : 'hover:bg-white border border-gray-200 hover:border-blue-300'
                                        } ${isAnswered ? 'cursor-not-allowed' : ''}`}
                                      >
                                        <input 
                                          type="radio" 
                                          name={`question-${material.id}-${index}`}
                                          className="text-blue-600 focus:ring-blue-500"
                                          disabled={isAnswered}
                                          checked={isSelected}
                                          onChange={() => handleAnswerSelection(material.id, index, optIndex)}
                                        />
                                        <span className={`flex-1 ${
                                          isAnswered && isCorrectOption 
                                            ? 'font-medium text-green-800' 
                                            : isAnswered && isSelected
                                              ? 'text-red-800'
                                              : 'text-gray-700'
                                        }`}>
                                          {option}
                                          {isAnswered && isCorrectOption && (
                                            <span className="ml-2 text-xs text-green-600">← Correct Answer</span>
                                          )}
                                          {isAnswered && isSelected && !isCorrectOption && (
                                            <span className="ml-2 text-xs text-red-600">← Your Answer</span>
                                          )}
                                        </span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                          
                          {/* Quiz Actions */}
                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm text-gray-600">
                              {(() => {
                                const stats = getQuizStats(material.id, material.content)
                                return stats.answered === stats.total && stats.total > 0
                                  ? `🎉 Quiz completed! Final score: ${stats.correct}/${stats.total} (${Math.round((stats.correct / stats.total) * 100)}%)`
                                  : "Select an answer for each question to see results"
                              })()}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleQuizCollapse(material.id)}
                            >
                              Collapse Quiz
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No quiz questions available</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
