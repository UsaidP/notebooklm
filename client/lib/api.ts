import { useAuth } from "@clerk/nextjs"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Create an authenticated Axios instance
 * This should be used in Client Components only
 */
export function useApiClient() {
  const { getToken } = useAuth()

  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Request interceptor to add auth token
  client.interceptors.request.use(async (config) => {
    try {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error("Failed to get auth token:", error)
    }
    return config
  })

  return client
}

/**
 * Server-side API client (for Server Components)
 * Uses the session token from cookies
 */
export async function getServerApiClient(sessionToken: string | null) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (sessionToken) {
    client.defaults.headers.Authorization = `Bearer ${sessionToken}`
  }

  return client
}

/**
 * Simple API client for non-authenticated requests
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})
