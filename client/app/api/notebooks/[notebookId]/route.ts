import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notebookId } = await params

    if (!notebookId) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      )
    }

    // Look up the internal user Id based on clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User mapping not found" },
        { status: 404 }
      )
    }

    // Verify notebook belongs to user
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    })

    if (!notebook || notebook.userId !== user.id) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      )
    }

    // Delete the notebook (cascade will delete docs/chats depending on Prisma schema)
    // For safety, we still wrap it in a try-catch for DB constraint issues
    await prisma.notebook.delete({
      where: { id: notebookId },
    })

    return NextResponse.json(
      { message: "Notebook deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting notebook:", error)
    return NextResponse.json(
      { error: "Failed to delete notebook" },
      { status: 500 }
    )
  }
}
