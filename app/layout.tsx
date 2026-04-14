import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Cool-Shot AI | Advanced AI Assistant",
  description:
    "Experience the next generation of AI assistance. Multi-mode intelligence, deep reasoning, creative writing, and more.",
  keywords: [
    "AI assistant",
    "chatbot",
    "code generation",
    "creative writing",
    "research",
  ],
  authors: [{ name: "Cool-Shot Systems" }],
  openGraph: {
    title: "Cool-Shot AI | Advanced AI Assistant",
    description:
      "Experience the next generation of AI assistance with multi-mode intelligence.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
