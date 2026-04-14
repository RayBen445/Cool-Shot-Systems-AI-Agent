"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ModeSelector } from "@/components/chat/mode-selector"
import { ArtifactPanel } from "@/components/chat/artifact-panel"
import { streamChatMessage } from "@/lib/api"
import { ProtectedPage } from "@/lib/protected-page"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  mode?: string
  artifacts?: Array<{
    id: string
    type: string
    content: string
  }>
  timestamp: Date
}

export interface Artifact {
  id: string
  type: string
  content: string
  title?: string
}

const MODES = [
  {
    id: "chat",
    name: "Chat",
    icon: "message-circle",
    command: "/chat",
    description: "General conversation",
  },
  {
    id: "code",
    name: "Code",
    icon: "code",
    command: "/code",
    description: "Code generation",
  },
  {
    id: "reason",
    name: "Reason",
    icon: "brain",
    command: "/reason",
    description: "Deep analysis",
  },
  {
    id: "create",
    name: "Create",
    icon: "sparkles",
    command: "/create",
    description: "Creative writing",
  },
  {
    id: "research",
    name: "Research",
    icon: "search",
    command: "/research",
    description: "Research & analysis",
  },
  {
    id: "system",
    name: "System",
    icon: "terminal",
    command: "/system",
    description: "DevOps & CLI",
  },
  {
    id: "teach",
    name: "Teach",
    icon: "graduation-cap",
    command: "/teach",
    description: "Learning mode",
  },
  {
    id: "plan",
    name: "Plan",
    icon: "calendar",
    command: "/plan",
    description: "Project planning",
  },
]

function ChatPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [currentMode, setCurrentMode] = useState("chat")
  const [isStreaming, setIsStreaming] = useState(false)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Detect mode from command
      let mode = currentMode
      let cleanContent = content

      for (const m of MODES) {
        if (content.toLowerCase().startsWith(m.command + " ")) {
          mode = m.id
          cleanContent = content.slice(m.command.length + 1)
          setCurrentMode(mode)
          break
        }
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: cleanContent,
        mode,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        mode,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      try {
        // Build history for context
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        await streamChatMessage(
          content,
          history,
          mode,
          (token) => {
            setMessages((prev) => {
              const updated = [...prev]
              const lastMsg = updated[updated.length - 1]
              if (lastMsg.role === "assistant") {
                lastMsg.content += token
              }
              return updated
            })
          },
          (tool, params) => {
            // Handle tool calls
            if (tool === "image_generation") {
              // Trigger image generation UI
              console.log("Image generation requested:", params)
            }
          }
        )

        // Extract artifacts from response
        const lastMessage = messages[messages.length - 1]
        if (lastMessage?.content) {
          const artifactRegex =
            /<artifact type="(\w+)">([\s\S]*?)<\/artifact>/g
          let match
          while ((match = artifactRegex.exec(lastMessage.content)) !== null) {
            const newArtifact: Artifact = {
              id: `artifact-${Date.now()}-${Math.random()}`,
              type: match[1],
              content: match[2].trim(),
            }
            setArtifacts((prev) => [...prev, newArtifact])
          }
        }
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg.role === "assistant" && !lastMsg.content) {
            lastMsg.content =
              "Sorry, I encountered an error. Please try again."
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [currentMode, isStreaming, messages]
  )

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const handleClearChat = useCallback(() => {
    setMessages([])
    setArtifacts([])
  }, [])

  const handleArtifactClick = useCallback((artifact: Artifact) => {
    setSelectedArtifact(artifact)
    setShowArtifactPanel(true)
  }, [])

  return (
    <div className="flex h-full flex-1">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <ChatHeader
          currentMode={currentMode}
          onClearChat={handleClearChat}
          messageCount={messages.length}
        />

        {/* Mode Selector */}
        <ModeSelector
          modes={MODES}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          onArtifactClick={handleArtifactClick}
          messagesEndRef={messagesEndRef}
        />

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          currentMode={currentMode}
        />
      </div>

      {/* Artifact Panel */}
      {showArtifactPanel && selectedArtifact && (
        <ArtifactPanel
          artifact={selectedArtifact}
          onClose={() => setShowArtifactPanel(false)}
        />
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <ProtectedPage>
      <ChatPageContent />
    </ProtectedPage>
  )
}
