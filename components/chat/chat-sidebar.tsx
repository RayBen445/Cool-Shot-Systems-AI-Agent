"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Plus,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  updatedAt: Date
  messageCount: number
}

export function ChatSidebar() {
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Code review assistance",
      updatedAt: new Date(),
      messageCount: 12,
    },
    {
      id: "2",
      title: "Project planning",
      updatedAt: new Date(Date.now() - 86400000),
      messageCount: 8,
    },
    {
      id: "3",
      title: "Research on AI trends",
      updatedAt: new Date(Date.now() - 172800000),
      messageCount: 15,
    },
  ])
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  )
  const [showMenu, setShowMenu] = useState<string | null>(null)

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `new-${Date.now()}`,
      title: "New Chat",
      updatedAt: new Date(),
      messageCount: 0,
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversation(newConv.id)
  }

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversation === id) {
      setActiveConversation(null)
    }
    setShowMenu(null)
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col border-r border-border bg-card"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bold"
              >
                Cool-Shot AI
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-border bg-muted/50 py-2.5 font-medium transition-all hover:bg-muted",
            collapsed ? "justify-center px-2" : "px-4"
          )}
        >
          <Plus className="h-5 w-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2 px-2 text-xs font-medium text-muted-foreground"
            >
              Recent
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative">
              <button
                onClick={() => setActiveConversation(conv.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  activeConversation === conv.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 truncate"
                    >
                      {conv.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Menu Button */}
              {!collapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(showMenu === conv.id ? null : conv.id)
                    }}
                    className="rounded-md p-1 hover:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu === conv.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg">
                      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <Bookmark className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conv.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {/* User Info */}
        {user && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-lg px-3 py-2",
              collapsed ? "justify-center" : ""
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-medium">
                    {user.displayName || "User"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center" : ""
            )}
          >
            <Settings className="h-4 w-4" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
