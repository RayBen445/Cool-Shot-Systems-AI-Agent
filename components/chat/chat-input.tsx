"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Send, Square, Paperclip, Image, Search, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  onStopGeneration: () => void
  isStreaming: boolean
  currentMode: string
}

const commandHints: Record<string, string> = {
  chat: "Type a message...",
  code: "Describe what you want to build...",
  reason: "Ask a complex question to analyze...",
  create: "What would you like to create...",
  research: "What topic should I research...",
  system: "What system task do you need...",
  teach: "What would you like to learn...",
  plan: "What project should I plan...",
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  currentMode,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return
    onSendMessage(input)
    setInput("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }

    // Show command palette on /
    if (e.key === "/" && input === "") {
      setShowCommands(true)
    }
  }

  const handleCommandSelect = (command: string) => {
    setInput(command + " ")
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  const commands = [
    { cmd: "/code", desc: "Write production code" },
    { cmd: "/reason", desc: "Deep analysis mode" },
    { cmd: "/create", desc: "Creative writing" },
    { cmd: "/research", desc: "Research & analysis" },
    { cmd: "/system", desc: "DevOps commands" },
    { cmd: "/teach", desc: "Learning mode" },
    { cmd: "/plan", desc: "Project planning" },
    { cmd: "/search", desc: "Web search" },
    { cmd: "/imagine", desc: "Generate image" },
  ]

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="relative mx-auto max-w-3xl">
        {/* Command Palette */}
        {showCommands && (
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-popover p-2 shadow-lg">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              Commands
            </div>
            <div className="grid grid-cols-3 gap-1">
              {commands.map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => handleCommandSelect(c.cmd)}
                  className="rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="font-mono text-primary">{c.cmd}</span>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2">
          {/* Left Actions */}
          <div className="flex gap-1 pb-1">
            <button
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Generate image"
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Web search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (e.target.value === "" || !e.target.value.startsWith("/")) {
                setShowCommands(false)
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (input === "") setShowCommands(false)
            }}
            placeholder={commandHints[currentMode] || "Type a message..."}
            rows={1}
            className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm focus:outline-none"
          />

          {/* Right Actions */}
          <div className="flex gap-1 pb-1">
            <button
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>

            {isStreaming ? (
              <button
                onClick={onStopGeneration}
                className="rounded-lg bg-destructive p-2 text-destructive-foreground transition-colors hover:bg-destructive/90"
                title="Stop generation"
              >
                <Square className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  input.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
                )}
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mode:{" "}
            <span className="font-medium text-primary">{currentMode}</span>
          </span>
          <span>Press / for commands, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
