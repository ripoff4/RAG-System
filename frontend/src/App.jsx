import { useEffect, useState } from "react"
import axios from "axios"

export default function App() {

  const [started, setStarted] = useState(false)

  const [uploadedFiles, setUploadedFiles] = useState([])

  const [uploading, setUploading] = useState(false)

  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [question, setQuestion] = useState("")

  const [messages, setMessages] = useState([])

  const [thinking, setThinking] = useState(false)

  const [sessionId, setSessionId] = useState("")


  // =====================================================
  // CREATE / LOAD SESSION
  // =====================================================

  useEffect(() => {

    let existingSession = localStorage.getItem("session_id")

    if (!existingSession) {

      existingSession = crypto.randomUUID()

      localStorage.setItem(
        "session_id",
        existingSession
      )
    }

    setSessionId(existingSession)

    loadHistory(existingSession)

  }, [])


  // =====================================================
  // LOAD CHAT HISTORY
  // =====================================================

  const loadHistory = async (id) => {

    try {

      const response = await axios.get(
        `http://127.0.0.1:8000/history/${id}`
      )

      const history = response.data.history || []

      if (history.length > 0) {

        setMessages(history)

        setStarted(true)
      }

    } catch (error) {

      console.error(error)
    }
  }


  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const handleFileUpload = async (event) => {

    const file = event.target.files[0]

    if (!file) return

    setUploading(true)

    try {

      const formData = new FormData()

      formData.append("file", file)

      await axios.post(

        `http://127.0.0.1:8000/upload?session_id=${sessionId}`,

        formData
      )

      // =========================================
      // ADD FILE TO EXISTING FILES
      // =========================================

      setUploadedFiles((prev) => [...prev, file])

      setUploadSuccess(true)

      setStarted(true)

    } catch (error) {

      console.error(error)

    } finally {

      setUploading(false)
    }
  }


  // =====================================================
  // SEND QUESTION
  // =====================================================

  const sendQuestion = async () => {

    if (!question.trim()) return

    const userMessage = {

      role: "user",

      content: question
    }

    setMessages((prev) => [...prev, userMessage])

    const currentQuestion = question

    setQuestion("")

    setThinking(true)

    try {

      const response = await axios.post(

        "http://127.0.0.1:8000/chat",

        {

          question: currentQuestion,

          session_id: sessionId
        }
      )

      const aiMessage = {

        role: "assistant",

        content: response.data.response
      }

      setMessages((prev) => [...prev, aiMessage])

    } catch (error) {

      console.error(error)

    } finally {

      setThinking(false)
    }
  }


  // =====================================================
  // CLEAR CHAT
  // =====================================================

  const clearChat = async () => {

    try {

      await axios.delete(
        `http://127.0.0.1:8000/history/${sessionId}`
      )

      setMessages([])

    } catch (error) {

      console.error(error)
    }
  }


  return (

    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".pdf"
        id="pdfUpload"
        className="hidden"
        onChange={handleFileUpload}
      />


      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] bg-purple-600/30 blur-3xl rounded-full" />

        <div className="absolute bottom-[-150px] right-[-100px] w-[450px] h-[450px] bg-cyan-500/20 blur-3xl rounded-full" />

      </div>


      <div className="relative z-10 min-h-screen px-4 py-8 flex flex-col items-center">

        {!started ? (

          <>
            {/* HOME */}
            <div className="text-center max-w-5xl mt-12 mb-16">

              <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight mb-8">

                The Future of

                <span className="block bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">

                  Document Intelligence

                </span>
              </h1>

              <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto mb-12">

                Upload PDFs and chat with your documents using AI.

              </p>


              <div className="flex items-center justify-center gap-5 flex-wrap">

                <button
                  onClick={() => setStarted(true)}
                  className="px-10 py-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:scale-105 transition-all duration-300 font-bold text-lg shadow-2xl shadow-purple-500/30"
                >
                  Start Chatting
                </button>


                <label
                  htmlFor="pdfUpload"
                  className="cursor-pointer px-10 py-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 font-bold text-lg"
                >
                  {
                    uploading
                      ? "Processing PDF..."
                      : "Upload PDF"
                  }
                </label>
              </div>


              {
                uploadSuccess && (

                  <p className="text-green-400 mt-6 text-lg">

                    PDF uploaded successfully ✨

                  </p>
                )
              }
            </div>
          </>

        ) : (

          <div className="w-full max-w-5xl h-[90vh] flex flex-col">

            {/* HEADER */}
            <div className="flex items-center justify-between py-4 mb-6">

              <div>

                <h2 className="text-2xl font-bold">
                  Smart RAG Assistant
                </h2>

                <p className="text-gray-400 text-sm">
                  Session: {sessionId.slice(0, 8)}
                </p>
              </div>


              <div className="flex gap-3">

                <button
                  onClick={clearChat}
                  className="px-5 py-3 rounded-2xl bg-red-500/20 border border-red-500/20 hover:bg-red-500/30 transition-all duration-300"
                >
                  Clear Chat
                </button>


                <label
                  htmlFor="pdfUpload"
                  className="cursor-pointer px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300"
                >
                  Upload PDF
                </label>
              </div>
            </div>


            {/* MULTI FILE DISPLAY */}
            {
              uploadedFiles.length > 0 && (

                <div className="mb-6 flex flex-wrap gap-4">

                  {
                    uploadedFiles.map((file, index) => (

                      <div
                        key={index}
                        className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                      >

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg">

                          📄

                        </div>

                        <div>

                          <p className="font-medium text-white">
                            {file.name}
                          </p>

                          <p className="text-sm text-gray-400">
                            Indexed in vector database
                          </p>

                        </div>
                      </div>
                    ))
                  }
                </div>
              )
            }


            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto space-y-10 pr-2 pb-10">

              {messages.map((message, index) => (

                <div
                  key={index}
                  className={`flex ${message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >

                  <div
                    className={`max-w-3xl ${message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl rounded-tr-md px-6 py-5"
                      : "px-6 py-5 bg-white/5 border border-white/10 rounded-3xl"
                      }`}
                  >

                    {
                      message.role === "user" &&
                      uploadedFiles.length > 0 && (

                        <div className="mb-4 flex flex-wrap gap-2">

                          {
                            uploadedFiles.map((file, index) => (

                              <div
                                key={index}
                                className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-sm"
                              >
                                📄 {file.name}
                              </div>
                            ))
                          }
                        </div>
                      )
                    }

                    <p className="leading-relaxed text-[17px]">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}


              {
                thinking && (

                  <div className="flex items-center gap-4">

                    <div className="flex gap-2">

                      <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" />

                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100" />

                      <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />

                    </div>
                  </div>
                )
              }
            </div>


            {/* INPUT */}
            <div className="sticky bottom-0 py-4 backdrop-blur-2xl bg-black/20">

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 backdrop-blur-2xl">

                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {

                    if (e.key === "Enter") {

                      sendQuestion()
                    }
                  }}
                  placeholder="Ask anything about your documents..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-lg"
                />

                <button
                  onClick={sendQuestion}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}