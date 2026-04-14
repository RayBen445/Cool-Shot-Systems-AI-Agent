"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

const modes = [
  {
    id: "chat",
    name: "Chat",
    icon: MessageCircle,
    command: "/chat",
    description: "General conversation with direct, insightful responses",
    example: {
      input: "What makes a great product?",
      output:
        "A great product solves a real problem elegantly. It should be intuitive enough that users don't need a manual, yet powerful enough that power users find depth. Focus on the core use case ruthlessly.",
    },
  },
  {
    id: "code",
    name: "Code",
    icon: Code2,
    command: "/code",
    description: "Production-ready code with best practices",
    example: {
      input: "Create a rate limiter in TypeScript",
      output: `export class RateLimiter {
  private tokens: number
  private lastRefill: number
  
  constructor(
    private maxTokens: number,
    private refillRate: number
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }
  
  tryConsume(): boolean {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return true
    }
    return false
  }
}`,
    },
  },
  {
    id: "reason",
    name: "Reason",
    icon: Brain,
    command: "/reason",
    description: "Deep analysis with transparent thinking chains",
    example: {
      input: "Should I use GraphQL or REST?",
      output:
        "Let me break this down:\n\n**Thinking:** Consider data requirements, client types, team expertise...\n\n**Analysis:**\n- GraphQL: Better for complex, nested data; mobile apps with bandwidth concerns\n- REST: Simpler caching, better for public APIs, lower learning curve\n\n**Recommendation:** Use REST unless you have multiple clients with varying data needs.",
    },
  },
  {
    id: "create",
    name: "Create",
    icon: Sparkles,
    command: "/create",
    description: "Creative writing that pushes boundaries",
    example: {
      input: "Write a tagline for a time-tracking app",
      output:
        '"Where did today go? Now you\'ll know."\n\nAlternatives:\n- "Track time. Find more."\n- "Every minute has a story."\n- "Time isn\'t lost. It\'s just misplaced."',
    },
  },
  {
    id: "research",
    name: "Research",
    icon: Search,
    command: "/research",
    description: "Synthesize information with structured insights",
    example: {
      input: "Compare React Server Components vs traditional SSR",
      output:
        "**Key Differences:**\n\n| Aspect | RSC | Traditional SSR |\n|--------|-----|----------------|\n| Hydration | Selective | Full page |\n| Bundle size | Smaller | Includes all code |\n| Streaming | Native | Requires setup |\n\n**Recommendation:** RSC for large apps with varying interactivity needs.",
    },
  },
  {
    id: "system",
    name: "System",
    icon: Terminal,
    command: "/system",
    description: "DevOps commands and infrastructure guidance",
    example: {
      input: "Deploy a Node.js app to Docker",
      output: `# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

# Build & Run
docker build -t myapp .
docker run -p 3000:3000 myapp`,
    },
  },
  {
    id: "teach",
    name: "Teach",
    icon: GraduationCap,
    command: "/teach",
    description: "Learn concepts with clear explanations",
    example: {
      input: "Explain closures in JavaScript",
      output:
        "**The Simple Explanation:**\nA closure is when a function \"remembers\" variables from where it was created, even when called elsewhere.\n\n**Analogy:**\nThink of it like a backpack. When you create a function inside another function, it takes a backpack with all the outer variables.\n\n**Try This:**\n```js\nfunction counter() {\n  let count = 0\n  return () => ++count\n}\n```",
    },
  },
  {
    id: "plan",
    name: "Plan",
    icon: Calendar,
    command: "/plan",
    description: "Strategic planning with actionable steps",
    example: {
      input: "Plan a MVP for a note-taking app",
      output:
        "**Week 1-2: Core Features**\n- [ ] Rich text editor\n- [ ] Local storage\n- [ ] Basic search\n\n**Week 3: Polish**\n- [ ] Dark mode\n- [ ] Keyboard shortcuts\n\n**Success Metrics:**\n- 50 beta users\n- 4+ star rating\n- <2s load time",
    },
  },
]

export function ModeShowcase() {
  const [activeMode, setActiveMode] = useState(modes[0])

  return (
    <div className="mt-16">
      {/* Mode Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeMode.id === mode.id
                ? "bg-primary text-primary-foreground glow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            )}
          >
            <mode.icon className="h-4 w-4" />
            {mode.name}
          </button>
        ))}
      </div>

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <div className="mx-auto max-w-4xl">
            {/* Description */}
            <div className="mb-6 text-center">
              <code className="rounded-md bg-primary/10 px-2 py-1 text-sm text-primary">
                {activeMode.command}
              </code>
              <p className="mt-2 text-muted-foreground">
                {activeMode.description}
              </p>
            </div>

            {/* Example Chat */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-4 py-2">
                <span className="text-xs text-muted-foreground">Example</span>
              </div>
              <div className="space-y-4 p-6">
                {/* User Input */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">
                    <p className="text-sm">{activeMode.example.input}</p>
                  </div>
                </div>

                {/* AI Output */}
                <div className="flex justify-start">
                  <div className="max-w-2xl rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                    <pre className="whitespace-pre-wrap text-sm">
                      {activeMode.example.output}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
