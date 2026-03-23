"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type DocumentStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "INDEXED"
  | "FAILED"

export interface Document {
  id: string
  name: string
  status: DocumentStatus
  pageCount: number | null
  chunkCount: number | null
  sizeBytes: number
  notebookId: string
  createdAt: string
  updatedAt: string
}

async function fetchDocuments(
  notebookId: string,
  token: string | null
): Promise<Document[]> {
  const res = await axios.get(
    `${API_BASE_URL}/api/notebooks/${notebookId}/documents`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  return res.data.data
}

export function useDocuments(notebookId: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ["documents", notebookId],
    queryFn: async () => {
      const token = await getToken()
      return fetchDocuments(notebookId, token)
    },
    // Auto-poll while any doc is processing
    refetchInterval: (query) => {
      const data = query.state.data as Document[] | undefined
      const hasPending = data?.some((d: Document) =>
        ["PENDING", "QUEUED", "PROCESSING"].includes(d.status)
      )
      return hasPending ? 3000 : false
    },
  })
}

export function useDocumentMutations(notebookId: string) {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const upload = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (progress: number) => void
    }) => {
      const token = await getToken()
      const formData = new FormData()
      formData.append("pdf", file)
      formData.append("notebookId", notebookId)

      await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        onUploadProgress: (e) => {
          if (e.total && onProgress) {
            onProgress(Math.round((e.loaded * 100) / e.total))
          }
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", notebookId] })
    },
  })

  const remove = useMutation({
    mutationFn: async (documentId: string) => {
      const token = await getToken()
      await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", notebookId] })
    },
  })

  const retry = useMutation({
    mutationFn: async (documentId: string) => {
      const token = await getToken()
      await axios.post(
        `${API_BASE_URL}/api/documents/${documentId}/retry`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", notebookId] })
    },
  })

  return {
    uploadDocument: upload.mutateAsync,
    deleteDocument: remove.mutateAsync,
    retryProcessing: retry.mutateAsync,
    isUploading: upload.isPending,
    isRetrying: retry.isPending,
  }
}
