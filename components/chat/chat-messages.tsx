"use client"

import { RefObject } from "react"
import { motion } from "framer-motion"
import { User, Bot, Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Message, Artifact } from "@/app/chat/page"
import { cn } from "@/lib/utils"

interface ChatMessagesProps {
  messages: Message[]
  isStreaming: boolean
  onArtifactClick: (artifact: Artifact) => void
  messagesEndRef: RefObject<HTMLDivElement>
}

export function ChatMessages({
  messages,
  isStreaming,
  onArtifactClick,
  messagesEndRef,
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">How can I help you today?</h2>
        <p className="max-w-md text-center text-muted-foreground text-pretty">
          Start a conversation or use a mode command like /code, /reason, or
          /create to get specialized assistance.
        </p>

        {/* Quick Actions */}
        <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          {[
            { text: "Write a Python web scraper", mode: "code" },
            { text: "Explain quantum computing", mode: "teach" },
            { text: "Plan a product launch", mode: "plan" },
            { text: "Compare React vs Vue", mode: "research" },
          ].map((suggestion) => (
            <button
              key={suggestion.text}
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted"
            >
              <span className="text-xs text-primary">/{suggestion.mode}</span>
              <p className="mt-1">{suggestion.text}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            isStreaming={isStreaming && index === messages.length - 1}
            onArtifactClick={onArtifactClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isLast: boolean
  isStreaming: boolean
  onArtifactClick: (artifact: Artifact) => void
}

function MessageBubble({
  message,
  isLast,
  isStreaming,
  onArtifactClick,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-4", isUser ? "flex-row-reverse" : "")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-primary" : "bg-secondary"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "group relative max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary"
        )}
      >
        {/* Mode Badge */}
        {!isUser && message.mode && message.mode !== "chat" && (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {message.mode} mode
            </span>
          </div>
        )}

        {/* Message Content */}
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "")
                  const isInline =
                    !match &&
                    typeof children === "string" &&
                    !children.includes("\n")

                  if (isInline) {
                    return (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <div className="relative my-4">
                      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted px-4 py-2">
                        <span className="text-xs text-muted-foreground">
                          {match?.[1] || "code"}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children))
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match?.[1] || "text"}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: "0 0 0.5rem 0.5rem",
                          border: "1px solid hsl(var(--border))",
                          borderTop: "none",
                        }}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Streaming Indicator */}
            {isStreaming && isLast && (
              <span className="inline-block h-4 w-1 animate-pulse bg-primary" />
            )}
          </div>
        )}

        {/* Artifacts */}
        {message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => onArtifactClick(artifact)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4 text-primary" />
                <span>View {artifact.type} artifact</span>
              </button>
            ))}
          </div>
        )}

        {/* Copy Button (for assistant messages) */}
        {!isUser && !isStreaming && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-2 right-2 rounded-md bg-card p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}
