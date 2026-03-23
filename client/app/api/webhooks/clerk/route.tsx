import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { prisma } from "@/lib/prisma"

/**
 * Clerk Webhook Handler
 * Syncs Clerk users to PostgreSQL database
 * Handles: user.created, user.updated, user.deleted
 */

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

async function validateRequest(request: Request) {
  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set")
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Missing Svix headers")
  }

  const body = await request.text()

  const wh = new Webhook(WEBHOOK_SECRET)

  const payload = wh.verify(body, {
    "svix-id": svix_id,
    "svix-timestamp": svix_timestamp,
    "svix-signature": svix_signature,
  }) as {
    type: string
    data: {
      id: string
      email_addresses: Array<{ email_address: string }>
      first_name?: string
      last_name?: string
      image_url?: string
    }
  }

  return { payload, body }
}

export async function POST(request: Request) {
  try {
    const { payload } = await validateRequest(request)
    const { type, data } = payload

    // Privacy-safe logging: only log non-identifying fields
    const isDebug = process.env.NODE_ENV === "development"
    if (isDebug) {
      console.log(`[Clerk Webhook] Received event: ${type}`)
    }

    switch (type) {
      case "user.created": {
        const email = data.email_addresses[0]?.email_address
        if (!email) {
          throw new Error("User created without email")
        }

        const user = await prisma.user.create({
          data: {
            clerkUserId: data.id,
            email: email,
            name:
              [data.first_name, data.last_name].filter(Boolean).join(" ") ||
              null,
            imageUrl: data.image_url || null,
          },
        })

        if (isDebug) {
          console.log(`[Clerk Webhook] Created user (eventType: ${type})`)
        }
        break
      }

      case "user.updated": {
        const email = data.email_addresses[0]?.email_address

        const updateData: Record<string, unknown> = {
          name:
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            null,
          imageUrl: data.image_url || null,
        }

        // Only include email if it exists
        if (email) {
          updateData.email = email
        }

        const user = await prisma.user.update({
          where: { clerkUserId: data.id },
          data: updateData,
        })

        if (isDebug) {
          console.log(`[Clerk Webhook] Updated user (eventType: ${type})`)
        }
        break
      }

      case "user.deleted": {
        await prisma.user.deleteMany({
          where: { clerkUserId: data.id },
        })

        if (isDebug) {
          console.log(`[Clerk Webhook] Deleted user (eventType: ${type})`)
        }
        break
      }

      default:
        if (isDebug) {
          console.log(`[Clerk Webhook] Unhandled event type: ${type}`)
        }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log error without exposing user identifiers
    const isDebug = process.env.NODE_ENV === "development"
    if (isDebug) {
      console.error("[Clerk Webhook] Error:", error)
    } else {
      console.error("[Clerk Webhook] Error occurred")
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    )
  }
}
