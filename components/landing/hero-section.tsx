"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/20 blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary">
              Now with Deep Reasoning Mode
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            AI That Thinks{" "}
            <span className="gradient-text">Beyond the Obvious</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl"
          >
            Cool-Shot AI delivers multi-mode intelligence, deep reasoning
            chains, and artifact generation. Not just another chatbot -
            it&apos;s your AI power tool.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 glow"
            >
              Start Creating
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#modes"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-lg font-medium transition-all hover:bg-card"
            >
              <Play className="h-5 w-5" />
              See Modes
            </Link>
          </motion.div>
        </div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-20 max-w-5xl"
        >
          <div className="gradient-border rounded-2xl">
            <div className="overflow-hidden rounded-2xl bg-card">
              {/* Window Chrome */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                  Cool-Shot AI
                </div>
              </div>

              {/* Chat Preview */}
              <div className="space-y-4 p-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">
                    <p className="text-sm">
                      /reason What are the tradeoffs between microservices and
                      monoliths?
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-2xl space-y-3 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-primary">
                        Reasoning Mode
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        Let me analyze this systematically:
                      </p>
                      <div className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                        <p className="text-xs italic">Thinking...</p>
                        <p className="mt-1">
                          Breaking down into: deployment complexity, team
                          autonomy, data consistency, operational overhead...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
