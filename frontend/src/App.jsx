import { useState } from "react"
import axios from "axios"

export default function App() {

  const [started, setStarted] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)


  const handleFileUpload = async (event) => {

    const file = event.target.files[0]

    if (!file) return

    setUploadedFile(file)
    setUploading(true)

    try {

      const formData = new FormData()

      formData.append("file", file)

      await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      )

      setUploadSuccess(true)
      setStarted(true)

    } catch (error) {

      console.error(error)

    } finally {

      setUploading(false)
    }
  }


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
          question: currentQuestion
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
            {/* Home Page */}
            <div className="text-center max-w-5xl mt-12 mb-16">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">
                  AI Powered Retrieval System
                </span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight mb-8">
                The Future of
                <span className="block bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Document Intelligence
                </span>
              </h1>

              <p className="text-gray-400 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto mb-12">
                Upload PDFs, ask intelligent questions, summarize books,
                and interact with your documents through an AI-powered
                retrieval engine.
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


            {/* Example Chat */}
            <div className="w-full max-w-5xl space-y-12">

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
                  S
                </div>

                <div className="max-w-4xl">
                  <p className="text-2xl leading-relaxed text-gray-100">
                    Welcome. Upload a PDF and ask questions about your document.
                    I can explain concepts, summarize sections, and retrieve
                    information intelligently using vector search.
                  </p>
                </div>
              </div>


              <div className="flex justify-end">
                <div className="max-w-2xl bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl rounded-tr-md px-8 py-6 shadow-2xl shadow-purple-500/20">
                  <p className="text-xl text-white leading-relaxed">
                    Explain the main idea of chapter 2.
                  </p>
                </div>
              </div>


              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
                  S
                </div>

                <div className="max-w-4xl space-y-5">

                  <p className="text-2xl leading-relaxed text-gray-100">
                    Chapter 2 primarily focuses on the fundamentals of neural
                    network architectures and how layered representations improve
                    pattern recognition in machine learning systems.
                  </p>

                  <div className="p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                    <p className="text-gray-400 mb-3 text-sm">
                      Retrieved Context
                    </p>

                    <p className="text-gray-300 leading-relaxed">
                      “Neural networks learn hierarchical feature representations
                      through multiple transformation layers...”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>

        ) : (

          <div className="w-full max-w-5xl h-[90vh] flex flex-col">

            {/* Chat Header */}
            <div className="flex items-center justify-between py-4 mb-6">

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg">
                  S
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Smart RAG Assistant
                  </h2>

                  <p className="text-gray-400 text-sm">
                    Retrieval-Augmented Generation System
                  </p>
                </div>
              </div>

              <label
                htmlFor="pdfUpload"
                className="cursor-pointer px-5 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300"
              >
                Upload PDF
              </label>
            </div>


            {/* Uploaded File */}
            {
              uploadedFile && (
                <div className="mb-6 flex items-center gap-3 w-fit px-5 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg">
                    📄
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      {uploadedFile.name}
                    </p>

                    <p className="text-sm text-gray-400">
                      Vector database ready
                    </p>
                  </div>
                </div>
              )
            }


            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-10 pr-2 pb-10">

              {
                messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center h-full">

                    <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 flex items-center justify-center text-6xl font-black shadow-2xl shadow-purple-500/30 mb-8">
                      S
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                      Ask Anything About
                      <span className="block bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                        Your Documents
                      </span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                      Upload a PDF and begin chatting naturally.
                    </p>
                  </div>
                )
              }


              {messages.map((message, index) => (

                <div
                  key={index}
                  className={`flex ${message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                    }`}
                >

                  {
                    message.role === "assistant" && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-lg shrink-0 mr-4 mt-1">
                        S
                      </div>
                    )
                  }


                  <div
                    className={`max-w-3xl ${message.role === "user"
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl rounded-tr-md px-6 py-5"
                        : "px-1 py-1"
                      }`}
                  >

                    {
                      message.role === "user" && uploadedFile && (
                        <div className="mb-4 flex items-center gap-2 w-fit px-3 py-2 rounded-xl bg-white/10 border border-white/10">
                          <span>📄</span>
                          <span className="text-sm text-white">
                            {uploadedFile.name}
                          </span>
                        </div>
                      )
                    }

                    <p
                      className={`leading-relaxed text-[17px] ${message.role === "user"
                          ? "text-white"
                          : "text-gray-100"
                        }`}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}


              {
                thinking && (
                  <div className="flex items-center gap-4">

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                      S
                    </div>

                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100" />
                      <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )
              }
            </div>


            {/* Chat Input */}
            <div className="sticky bottom-0 py-4 backdrop-blur-2xl bg-black/20">

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 backdrop-blur-2xl shadow-2xl shadow-cyan-500/10">

                <label
                  htmlFor="pdfUpload"
                  className="cursor-pointer w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center text-xl shrink-0"
                >
                  +
                </label>

                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendQuestion()
                    }
                  }}
                  placeholder="Ask anything about your document..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-lg"
                />

                <button
                  onClick={sendQuestion}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 transition-all duration-300 font-semibold shadow-lg shadow-purple-500/30"
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
