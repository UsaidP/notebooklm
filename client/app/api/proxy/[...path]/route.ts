import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "") // strip trailing slash

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params)
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params)
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params)
}

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const { getToken } = await auth()
  const token = await getToken()

  const path = params.path.join("/")
  const search = req.nextUrl.search
  const targetUrl = `${BACKEND_URL}/${path}${search}`

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const isFormData = req.headers.get("content-type")?.includes("multipart/form-data")

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: isFormData ? { Authorization: headers["Authorization"] } : headers,
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = isFormData ? await req.blob() : await req.text()
  }

  const response = await fetch(targetUrl, fetchOptions)

  // Handle SSE streaming responses
  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  }

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  })
}
