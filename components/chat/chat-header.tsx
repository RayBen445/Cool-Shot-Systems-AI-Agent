"use client"

import { Trash2, Share, Download } from "lucide-react"

interface ChatHeaderProps {
  currentMode: string
  onClearChat: () => void
  messageCount: number
}

export function ChatHeader({
  currentMode,
  onClearChat,
  messageCount,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold">
          {messageCount === 0 ? "New Chat" : "Chat"}
        </h1>
        {messageCount > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {messageCount} messages
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Share"
        >
          <Share className="h-4 w-4" />
        </button>
        <button
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Export"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={onClearChat}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          title="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
