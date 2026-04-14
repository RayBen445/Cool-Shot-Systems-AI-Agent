import Link from "next/link"
import {
  Sparkles,
  Code2,
  Brain,
  Lightbulb,
  Search,
  FileText,
  ArrowRight,
  Zap,
  Shield,
  Globe,
} from "lucide-react"
import { HeroSection } from "@/components/landing/hero-section"
import { FeatureCard } from "@/components/landing/feature-card"
import { ModeShowcase } from "@/components/landing/mode-showcase"
import { CTASection } from "@/components/landing/cta-section"

const features = [
  {
    icon: Brain,
    title: "Deep Reasoning",
    description:
      "Watch the AI think through complex problems step-by-step with transparent reasoning chains.",
  },
  {
    icon: Code2,
    title: "Production Code",
    description:
      "Generate production-ready code with proper error handling, tests, and documentation.",
  },
  {
    icon: Sparkles,
    title: "Creative Engine",
    description:
      "Unleash creative potential with AI that pushes boundaries and avoids cliches.",
  },
  {
    icon: Search,
    title: "Research Mode",
    description:
      "Synthesize information from multiple angles with structured, actionable insights.",
  },
  {
    icon: FileText,
    title: "Artifact Generation",
    description:
      "Create and edit code, documents, and diagrams in a dedicated canvas view.",
  },
  {
    icon: Lightbulb,
    title: "Multi-Mode Intelligence",
    description:
      "Switch between specialized modes optimized for different tasks instantly.",
  },
]

const capabilities = [
  {
    icon: Zap,
    title: "Streaming Responses",
    description: "See answers form in real-time",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your data stays yours",
  },
  {
    icon: Globe,
    title: "Web Search",
    description: "Access real-time information",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Cool-Shot AI</span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <Link
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#modes"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Modes
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground md:hidden"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Capabilities Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {capabilities.map((cap) => (
              <div key={cap.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <cap.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Beyond Ordinary AI
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Cool-Shot AI is not just another chatbot. It&apos;s a
              multi-dimensional intelligence designed for power users who demand
              more.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Mode Showcase */}
      <section id="modes" className="border-t border-border bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Specialized <span className="gradient-text">Modes</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Switch between purpose-built modes to get the best results for any
              task.
            </p>
          </div>

          <ModeShowcase />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Cool-Shot AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for those who demand more from AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
