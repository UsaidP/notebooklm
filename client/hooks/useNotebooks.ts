"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Notebook {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    documents: number
    chatSessions: number
  }
}

/**
 * Parse date strings from API to Date objects
 */
function parseNotebookDates(data: any): Notebook {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

async function fetchNotebooks(token: string | null): Promise<Notebook[]> {
  const res = await axios.get(`${API_BASE_URL}/api/notebooks`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.data.data.map(parseNotebookDates)
}

async function fetchNotebook(
  id: string,
  token: string | null
): Promise<Notebook> {
  const res = await axios.get(`${API_BASE_URL}/api/notebooks/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return parseNotebookDates(res.data.data)
}

export function useNotebooks() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ["notebooks"],
    queryFn: async () => {
      const token = await getToken()
      return fetchNotebooks(token)
    },
    staleTime: 30_000,
  })
}

export function useNotebook(id: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ["notebooks", id],
    queryFn: async () => {
      const token = await getToken()
      return fetchNotebook(id, token)
    },
    enabled: !!id,
  })
}

export function useNotebookMutations() {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const create = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const token = await getToken()
      const res = await axios.post(`${API_BASE_URL}/api/notebooks`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return res.data.data as Notebook
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      await axios.delete(`${API_BASE_URL}/api/notebooks/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] })
    },
  })

  return {
    createNotebook: create.mutateAsync,
    deleteNotebook: remove.mutateAsync,
    isPending: create.isPending || remove.isPending,
  }
}
