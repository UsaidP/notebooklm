"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ChatSession {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: string
  content: string
  sources: any | null
  createdAt: string
}

export interface SessionWithMessages {
  session: ChatSession
  messages: ChatMessage[]
}

// Fetch chat history for a notebook
async function fetchHistory(
  notebookId: string,
  token: string | null
): Promise<SessionWithMessages> {
  const res = await axios.get(
    `${API_BASE_URL}/api/chat/${notebookId}/history`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  return res.data
}

// Post a message to a notebook chat
async function postMessage(
  notebookId: string,
  token: string | null,
  message: string
): Promise<ChatMessage> {
  const res = await axios.post(
    `${API_BASE_URL}/api/chat/${notebookId}/message`,
    { message },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  return res.data
}

// Clear chat history for a notebook
async function clearHistory(
  notebookId: string,
  token: string | null
): Promise<void> {
  await axios.delete(`${API_BASE_URL}/api/chat/${notebookId}/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// Fetch a single session by ID (legacy support)
async function fetchSession(
  sessionId: string,
  token: string | null
): Promise<SessionWithMessages> {
  const res = await axios.get(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  return res.data
}

export function useSessions(notebookId: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ["history", notebookId],
    queryFn: async () => {
      const token = await getToken()
      return fetchHistory(notebookId, token)
    },
    enabled: !!notebookId,
    staleTime: 30_000,
  })
}

export function useSession(sessionId: string | null) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const token = await getToken()
      return fetchSession(sessionId!, token)
    },
    enabled: !!sessionId,
    staleTime: 60_000,
  })
}

export function useSessionMutations(notebookId: string) {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const post = useMutation({
    mutationFn: async (message: string) => {
      const token = await getToken()
      return postMessage(notebookId, token, message)
    },
  })

  const clear = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      await clearHistory(notebookId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history", notebookId] })
    },
  })

  return {
    postMessage: post.mutateAsync,
    clearHistory: clear.mutateAsync,
    isPosting: post.isPending,
    isClearing: clear.isPending,
  }
}
