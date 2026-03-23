"use client"

import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ChatColumn } from "@/components/chat/ChatColumn"
import { LeftSidebar } from "@/components/layout/LeftSidebar"
import { StudioSidebar } from "@/components/studio/StudioSidebar"
import { useChat } from "@/hooks/useChat"
import { useNotebook } from "@/hooks/useNotebooks"
import { useSourceSelection } from "@/hooks/useSourceSelection"

export default function NotebookPage() {
  const params = useParams()
  const notebookId = params.notebookId as string
  const { data: notebook } = useNotebook(notebookId)
  const { selectedIds } = useSourceSelection()
  const [isMobile, setIsMobile] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const chat = useChat(notebookId)

  // Responsive detection
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On desktop always show both sidebars
      if (!mobile) {
        setShowLeft(true)
        setShowRight(true)
      } else {
        setShowLeft(false)
        setShowRight(false)
      }
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ESC key closes sidebars on mobile
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile) {
        setShowLeft(false)
        setShowRight(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isMobile])

  const handleGenerate = (prompt: string) => {
    chat.sendMessage(prompt, Array.from(selectedIds))
  }

  // On mobile: opening one closes the other
  const toggleLeft = useCallback(() => {
    setShowLeft((v) => !v)
    if (isMobile) setShowRight(false)
  }, [isMobile])

  const toggleRight = useCallback(() => {
    setShowRight((v) => !v)
    if (isMobile) setShowLeft(false)
  }, [isMobile])

  const closeAll = () => {
    setShowLeft(false)
    setShowRight(false)
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dark overlay (mobile only) */}
      {isMobile && (showLeft || showRight) && (
        <div
          role="button"
          tabIndex={0}
          onClick={closeAll}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              closeAll()
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 40,
            backdropFilter: "blur(1px)",
          }}
        />
      )}

      {/* Left sidebar */}
      <div
        style={{
          width: isMobile ? 280 : 260,
          flexShrink: 0,
          height: "100%",
          ...(isMobile
            ? {
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 50,
              transform: showLeft ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
              boxShadow: showLeft ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
            }
            : {
              display: showLeft ? "flex" : "none",
              flexDirection: "column",
            }),
        }}
      >
        <LeftSidebar
          notebookId={notebookId}
          onClose={isMobile ? closeAll : undefined}
        />
      </div>

      {/* Main chat */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatColumn
          notebookId={notebookId}
          notebookName={notebook?.title}
          chat={chat}
          isMobile={isMobile}
          showLeftSidebar={showLeft}
          showRightSidebar={showRight}
          onToggleLeft={toggleLeft}
          onToggleRight={toggleRight}
        />
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: isMobile ? "85vw" : 300,
          flexShrink: 0,
          height: "100%",
          ...(isMobile
            ? {
              position: "fixed",
              top: 0,
              right: 0,
              zIndex: 50,
              transform: showRight ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
              boxShadow: showRight ? "-4px 0 24px rgba(0,0,0,0.18)" : "none",
            }
            : {
              display: showRight ? "flex" : "none",
              flexDirection: "column",
            }),
        }}
      >
        <StudioSidebar
          notebookId={notebookId}
          onGenerate={handleGenerate}
          onClose={isMobile ? closeAll : undefined}
        />
      </div>
    </div>
  )
}
