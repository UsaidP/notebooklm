import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../utils/async-handler.js';
import { prisma } from '../../lib/prisma.js';
import {
  createDocument,
  getDocument,
  getDocumentsByNotebook,
  updateDocumentStatus,
  deleteDocument
} from '../../services/documentService.js';
import { uploadPDF } from '../../services/appwrite.js';
import { addDocumentJob } from '../../queues/pdf-queue.js';

const router = Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * POST /api/documents/upload
 * Upload PDF(s) to Appwrite, create Document records, queue processing jobs
 * Supports single or multiple file uploads
 */
router.post('/upload', upload.array('pdf', 10), asyncHandler(async (req, res) => {
  const { notebookId } = req.body;
  const files = req.files;
  const clerkUserId = req.userId;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files provided'
    });
  }

  if (!notebookId) {
    return res.status(400).json({
      success: false,
      error: 'notebookId is required'
    });
  }

  // Get or create internal user
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true }
  });

  if (!user) {
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

  // Verify notebook exists and belongs to user before processing
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: user.id }
  });

  if (!notebook) {
    return res.status(404).json({
      success: false,
      error: 'Notebook not found or access denied',
      details: `No notebook found with ID "${notebookId}" for your account. Please create a notebook first.`
    });
  }

  const uploadedDocuments = [];

  // Process each file
  for (const file of files) {
    try {
      // 1. Upload to Appwrite
      const appwriteFile = await uploadPDF(file.buffer, file.originalname);
      console.log(`[Upload] Uploaded ${file.originalname} to Appwrite: ${appwriteFile.$id}`);

      // 2. Create Document record in PostgreSQL
      const document = await createDocument({
        notebookId,
        name: file.originalname,
        appwriteId: appwriteFile.$id,
        sizeBytes: file.size,
        mimeType: file.mimetype
      }, clerkUserId);

      console.log(`[Upload] Created document record: ${document.id}`);

      // 3. Update status to QUEUED
      await updateDocumentStatus(document.id, 'QUEUED');

      // 4. Add to processing queue
      await addDocumentJob({
        documentId: document.id,
        userId: user.id,
        notebookId,
        appwriteFileId: appwriteFile.$id,
        fileName: file.originalname
      });

      console.log(`[Upload] Queued document for processing: ${document.id}`);

      uploadedDocuments.push({
        id: document.id,
        name: document.name,
        status: 'QUEUED',
        createdAt: document.createdAt
      });
    } catch (error) {
      console.error(`[Upload] Error processing ${file.originalname}:`, error.message);
      uploadedDocuments.push({
        name: file.originalname,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    data: uploadedDocuments,
    summary: {
      total: files.length,
      succeeded: uploadedDocuments.filter(d => d.status === 'QUEUED').length,
      failed: uploadedDocuments.filter(d => d.status === 'FAILED').length
    }
  });
}));

/**
 * GET /api/documents
 * List all documents for a notebook
 */
router.get('/', asyncHandler(async (req, res) => {
  const { notebookId } = req.query;

  if (!notebookId) {
    return res.status(400).json({
      success: false,
      error: 'notebookId query parameter is required'
    });
  }

  const documents = await getDocumentsByNotebook(notebookId, req.userId);

  res.json({
    success: true,
    data: documents
  });
}));

/**
 * GET /api/documents/:id
 * Get document details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const document = await getDocument(req.params.id, req.userId);

  res.json({
    success: true,
    data: document
  });
}));

/**
 * GET /api/documents/:id/status
 * Get document processing status
 */
router.get('/:id/status', asyncHandler(async (req, res) => {
  const document = await getDocument(req.params.id, req.userId);

  res.json({
    success: true,
    data: {
      id: document.id,
      name: document.name,
      status: document.status,
      totalChunks: document.totalChunks,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    }
  });
}));

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteDocument(req.params.id, req.userId);

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
}));

/**
 * POST /api/documents/:id/retry
 * Retry processing a failed document
 */
router.post('/:id/retry', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clerkUserId = req.userId;

  // 1. Get document and verify ownership
  const document = await getDocument(id, clerkUserId);

  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // 2. Only allow retry for FAILED documents (or maybe PENDING if stuck)
  if (document.status !== 'FAILED' && document.status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      error: `Cannot retry document with status: ${document.status}`
    });
  }

  // 3. Update status to QUEUED
  await updateDocumentStatus(document.id, 'QUEUED');

  // 4. Add to processing queue
  await addDocumentJob({
    documentId: document.id,
    userId: document.notebook.userId, // Use internal userId from the joined notebook
    notebookId: document.notebookId,
    appwriteFileId: document.appwriteId,
    fileName: document.name
  });

  console.log(`[Retry] Re-queued document for processing: ${document.id}`);

  res.json({
    success: true,
    message: 'Retry initiated',
    data: {
      id: document.id,
      status: 'QUEUED'
    }
  });
}));

export default router;