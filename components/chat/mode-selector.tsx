"use client"

import {
  MessageCircle,
  Code2,
  Brain,
  Sparkles,
  Search,
  Terminal,
  GraduationCap,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Mode {
  id: string
  name: string
  icon: string
  command: string
  description: string
}

interface ModeSelectorProps {
  modes: Mode[]
  currentMode: string
  onModeChange: (mode: string) => void
}

const iconMap: Record<string, typeof MessageCircle> = {
  "message-circle": MessageCircle,
  code: Code2,
  brain: Brain,
  sparkles: Sparkles,
  search: Search,
  terminal: Terminal,
  "graduation-cap": GraduationCap,
  calendar: Calendar,
}

export function ModeSelector({
  modes,
  currentMode,
  onModeChange,
}: ModeSelectorProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
        {modes.map((mode) => {
          const Icon = iconMap[mode.icon] || MessageCircle
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all",
                currentMode === mode.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={mode.description}
            >
              <Icon className="h-4 w-4" />
              <span>{mode.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
