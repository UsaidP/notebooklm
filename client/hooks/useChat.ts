"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useRef, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Source {
  documentId: string
  documentName: string
  page: number | null
  score: number
  text: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  isStreaming?: boolean
  timestamp: Date
}

interface UseChatReturn {
  messages: Message[]
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string, selectedSourceIds?: string[]) => Promise<void>
  stopStreaming: () => void
  clearMessages: () => void
}

export type { UseChatReturn }

export function useChat(notebookId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { getToken } = useAuth()

  // Load existing chat history for this notebook on mount
  useEffect(() => {
    if (!notebookId) return
    const controller = new AbortController()

    const loadHistory = async () => {
      try {
        const token = await getToken()
        const response = await fetch(
          `${API_BASE_URL}/api/chat/${notebookId}/history`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
          }
        )
        if (response.ok) {
          const data = await response.json()
          const history = (data.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
            sources: m.sources ?? undefined,
            timestamp: new Date(m.createdAt),
          }))
          setMessages(history)
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to load chat history:", err)
        }
      }
    }

    loadHistory()
    return () => controller.abort()
  }, [notebookId, getToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string, selectedSourceIds: string[] = []) => {
      if (!content.trim() || isStreaming) return

      setError(null)
      const userMsgId = crypto.randomUUID()
      const asstMsgId = crypto.randomUUID()

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: content.trim(),
          timestamp: new Date(),
        },
        {
          id: asstMsgId,
          role: "assistant",
          content: "",
          isStreaming: true,
          timestamp: new Date(),
        },
      ])

      setIsStreaming(true)
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      try {
        const token = await getToken()

        const response = await fetch(
          `${API_BASE_URL}/api/chat/${notebookId}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message: content.trim(),
              selectedSourceIds,
            }),
            signal: abortControllerRef.current.signal,
          }
        )

        if (!response.ok) {
          if (response.status === 401)
            throw new Error("Unauthorized. Please sign in again.")
          if (response.status === 429)
            throw new Error("Too many requests. Please wait a moment.")
          const err = await response.json().catch(() => ({}))
          throw new Error(
            err.error || `Request failed with status ${response.status}`
          )
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        if (!reader) throw new Error("No response body from server.")

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "token") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId
                      ? { ...m, content: m.content + data.content }
                      : m
                  )
                )
              }
              if (data.type === "sources") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, sources: data.sources } : m
                  )
                )
              }
              if (data.type === "done") {
                setIsStreaming(false)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, isStreaming: false } : m
                  )
                )
              }
              if (data.type === "error") {
                setError(data.message)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === asstMsgId ? { ...m, isStreaming: false } : m
                  )
                )
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong")
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.id === asstMsgId && !last.content) {
              return prev.filter((m) => m.id !== asstMsgId)
            }
            return prev.map((m) =>
              m.id === asstMsgId ? { ...m, isStreaming: false } : m
            )
          })
        }
      } finally {
        setIsStreaming(false)
      }
    },
    [notebookId, isStreaming, getToken]
  )

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  }
}
