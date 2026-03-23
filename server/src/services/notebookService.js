import { prisma } from '../lib/prisma.js';

/**
 * Helper: Get or create internal user from Clerk user ID
 */
const getOrCreateUser = async (clerkUserId) => {
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true }
  });

  if (!user) {
    // Auto-create user if not found (webhook may have failed)
    console.log(`[Auth] Auto-creating user for Clerk ID: ${clerkUserId}`);
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: `${clerkUserId}@placeholder.local`, // Placeholder, will be updated by webhook
        name: null,
      },
      select: { id: true }
    });
    console.log(`[Auth] Created user: ${user.id}`);
  }

  return user;
};

/**
 * Notebook Service
 * Handles all notebook CRUD operations with tenant isolation
 */

/**
 * Get all notebooks for a user
 * @param {string} clerkUserId - The Clerk user's ID
 * @returns {Promise<Array>} List of notebooks
 */
export const getNotebooks = async (clerkUserId) => {
  const user = await getOrCreateUser(clerkUserId);

  return prisma.notebook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { documents: true, chatSessions: true }
      }
    }
  });
};

/**
 * Get a single notebook by ID
 * @param {string} notebookId - Notebook ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Notebook details
 */
export const getNotebook = async (notebookId, clerkUserId) => {
  const user = await getOrCreateUser(clerkUserId);

  return prisma.notebook.findFirst({
    where: {
      id: notebookId,
      userId: user.id
    },
    include: {
      documents: {
        select: {
          id: true,
          name: true,
          status: true,
          totalChunks: true,
          createdAt: true
        }
      },
      chatSessions: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          updatedAt: true
        }
      }
    }
  });
};

/**
 * Create a new notebook
 * @param {Object} data - Notebook data
 * @param {string} data.title - Notebook title
 * @param {string} [data.description] - Optional description
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<Object>} Created notebook
 */
export const createNotebook = async ({ title, description }, clerkUserId) => {
  // Validate input
  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (title.length > 100) {
    throw new Error('Title must be less than 100 characters');
  }

  if (description && description.length > 500) {
    throw new Error('Description must be less than 500 characters');
  }

  // Get or create internal user
  const user = await getOrCreateUser(clerkUserId);

  return prisma.notebook.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      userId: user.id
    }
  });
};

/**
 * Update a notebook
 * @param {string} notebookId - Notebook ID
 * @param {Object} data - Update data
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Updated notebook
 */
export const updateNotebook = async (notebookId, { title, description }, clerkUserId) => {
  const user = await getOrCreateUser(clerkUserId);

  // Verify ownership
  const existing = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id }
  });

  if (!existing) {
    throw new Error('Notebook not found or access denied');
  }

  // Validate input
  if (title !== undefined) {
    if (title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (title.length > 100) {
      throw new Error('Title must be less than 100 characters');
    }
  }

  if (description !== undefined && description.length > 500) {
    throw new Error('Description must be less than 500 characters');
  }

  return prisma.notebook.update({
    where: { id: notebookId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null })
    }
  });
};

/**
 * Delete a notebook and all associated data
 * @param {string} notebookId - Notebook ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Deleted notebook
 */
export const deleteNotebook = async (notebookId, clerkUserId) => {
  const user = await getOrCreateUser(clerkUserId);

  // Verify ownership
  const existing = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id }
  });

  if (!existing) {
    throw new Error('Notebook not found or access denied');
  }

  // Prisma will cascade delete documents and chatSessions
  return prisma.notebook.delete({
    where: { id: notebookId }
  });
};

/**
 * Get notebook stats
 * @param {string} notebookId - Notebook ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Stats object
 */
export const getNotebookStats = async (notebookId, clerkUserId) => {
  const user = await getOrCreateUser(clerkUserId);

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id },
    include: {
      _count: {
        select: { documents: true, chatSessions: true }
      },
      documents: {
        select: { status: true }
      }
    }
  });

  if (!notebook) {
    throw new Error('Notebook not found or access denied');
  }

  const documentStatus = notebook.documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDocuments: notebook._count.documents,
    totalChatSessions: notebook._count.chatSessions,
    documentStatus
  };
};
