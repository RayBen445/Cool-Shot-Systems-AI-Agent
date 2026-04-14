"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Copy, Download, Check, Maximize2, Minimize2 } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Artifact } from "@/app/chat/page"
import { cn } from "@/lib/utils"

interface ArtifactPanelProps {
  artifact: Artifact
  onClose: () => void
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `artifact-${artifact.id}.${getFileExtension(artifact.type)}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (type: string) => {
    switch (type) {
      case "code":
        return "txt"
      case "document":
        return "md"
      case "diagram":
        return "mmd"
      default:
        return "txt"
    }
  }

  const getLanguage = (type: string) => {
    switch (type) {
      case "code":
        return "typescript"
      case "document":
        return "markdown"
      case "diagram":
        return "mermaid"
      default:
        return "text"
    }
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "flex flex-col border-l border-border bg-card",
        expanded ? "fixed inset-0 z-50" : "w-[500px]"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div>
          <h3 className="font-semibold capitalize">{artifact.type} Artifact</h3>
          {artifact.title && (
            <p className="text-xs text-muted-foreground">{artifact.title}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Copy"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {artifact.type === "code" || artifact.type === "diagram" ? (
          <SyntaxHighlighter
            style={oneDark}
            language={getLanguage(artifact.type)}
            customStyle={{
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            }}
          >
            {artifact.content}
          </SyntaxHighlighter>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm">
              {artifact.content}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{artifact.content.length} characters</span>
          <span>{artifact.content.split("\n").length} lines</span>
        </div>
      </div>
    </motion.div>
  )
}
