import { prisma } from '../lib/prisma.js';

/**
 * Helper: Get or create internal user ID from Clerk user ID
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
        email: `${clerkUserId}@placeholder.local`,
        name: null,
      },
      select: { id: true }
    });
    console.log(`[Auth] Created user: ${user.id}`);
  }

  return user.id;
};

/**
 * Document Service
 * Handles all document CRUD operations with tenant isolation
 */

/**
 * Create a new document record
 * @param {Object} data - Document data
 * @param {string} data.notebookId - Notebook ID
 * @param {string} data.name - File name
 * @param {string} data.appwriteId - Appwrite file ID
 * @param {number} [data.sizeBytes] - File size in bytes
 * @param {string} [data.mimeType] - MIME type
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Created document
 */
export const createDocument = async ({ notebookId, name, appwriteId, sizeBytes, mimeType }, clerkUserId) => {
  const userId = await getOrCreateUser(clerkUserId);

  // Verify notebook ownership
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId }
  });

  if (!notebook) {
    throw new Error('Notebook not found or access denied');
  }

  return prisma.document.create({
    data: {
      name,
      appwriteId,
      mimeType: mimeType || 'application/pdf',
      sizeBytes,
      status: 'PENDING',
      notebookId
    }
  });
};

/**
 * Get a single document by ID
 * @param {string} documentId - Document ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Document details
 */
export const getDocument = async (documentId, clerkUserId) => {
  const userId = await getOrCreateUser(clerkUserId);

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      notebook: { userId }
    },
    include: {
      notebook: {
        select: { id: true, title: true }
      }
    }
  });

  if (!document) {
    throw new Error('Document not found or access denied');
  }

  return document;
};

/**
 * Get all documents for a notebook
 * @param {string} notebookId - Notebook ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Array>} List of documents
 */
export const getDocumentsByNotebook = async (notebookId, clerkUserId) => {
  const userId = await getOrCreateUser(clerkUserId);

  // Verify notebook ownership
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId }
  });

  if (!notebook) {
    throw new Error('Notebook not found or access denied');
  }

  return prisma.document.findMany({
    where: { notebookId },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Update document status
 * @param {string} documentId - Document ID
 * @param {string} status - New status (PENDING, QUEUED, PROCESSING, INDEXED, FAILED)
 * @param {Object} [options] - Additional options
 * @param {number} [options.chunkCount] - Number of chunks
 * @param {string} [options.errorMessage] - Error message if failed
 * @returns {Promise<Object>} Updated document
 */
export const updateDocumentStatus = async (documentId, status, options = {}) => {
  const { chunkCount, errorMessage } = options;

  return prisma.document.update({
    where: { id: documentId },
    data: {
      status,
      ...(chunkCount !== undefined && { totalChunks: chunkCount }),
      updatedAt: new Date()
    }
  });
};

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Object>} Deleted document
 */
export const deleteDocument = async (documentId, clerkUserId) => {
  const userId = await getOrCreateUser(clerkUserId);

  // Verify ownership
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      notebook: { userId }
    }
  });

  if (!document) {
    throw new Error('Document not found or access denied');
  }

  return prisma.document.delete({
    where: { id: documentId }
  });
};

/**
 * Get documents by status
 * @param {string} status - Document status
 * @param {string} clerkUserId - Clerk user ID for tenant check
 * @returns {Promise<Array>} List of documents
 */
export const getDocumentsByStatus = async (status, clerkUserId) => {
  const userId = await getOrCreateUser(clerkUserId);

  return prisma.document.findMany({
    where: {
      status,
      notebook: { userId }
    },
    include: {
      notebook: {
        select: { id: true, title: true }
      }
    }
  });
};
