import { useAuth } from "@clerk/nextjs"
import axios from "axios"

/**
 * Get the API base URL.
 * - In the browser: use /api/proxy (routes through Next.js, works in Codespaces/any host)
 * - Server-side: use INTERNAL_API_URL (direct container-to-container)
 */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Browser: proxy through Next.js so the URL is always relative to the current host
    return "/api/proxy"
  }
  // SSR: direct internal URL
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Create an authenticated Axios instance (Client Components only)
 */
export function useApiClient() {
  const { getToken } = useAuth()

  const client = axios.create({
    baseURL: typeof window !== "undefined" ? "/api/proxy" : API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  })

  client.interceptors.request.use(async (config) => {
    try {
      const token = await getToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch (error) {
      console.error("Failed to get auth token:", error)
    }
    return config
  })

  return client
}

/**
 * Server-side API client (Server Components)
 */
export async function getServerApiClient(sessionToken: string | null) {
  const client = axios.create({
    baseURL: process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" },
  })
  if (sessionToken) {
    client.defaults.headers.Authorization = `Bearer ${sessionToken}`
  }
  return client
}

/**
 * Simple unauthenticated client
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
})
