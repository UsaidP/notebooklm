import { Router } from 'express';
import {
  getNotebooks,
  getNotebook,
  createNotebook,
  updateNotebook,
  deleteNotebook
} from '../../services/notebookService.js';
import { getDocumentsByNotebook } from '../../services/documentService.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

/**
 * GET /notebooks
 * List all notebooks for the authenticated user
 */
router.get('/', asyncHandler(async (req, res) => {
  const notebooks = await getNotebooks(req.userId);
  res.json({
    success: true,
    data: notebooks
  });
}));

/**
 * GET /notebooks/:id
 * Get a single notebook by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const notebook = await getNotebook(req.params.id, req.userId);

  if (!notebook) {
    return res.status(404).json({
      success: false,
      error: 'Notebook not found'
    });
  }

  res.json({
    success: true,
    data: notebook
  });
}));

/**
 * POST /notebooks
 * Create a new notebook
 */
router.post('/', asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const notebook = await createNotebook(
    { title, description },
    req.userId
  );

  res.status(201).json({
    success: true,
    data: notebook
  });
}));

/**
 * PATCH /notebooks/:id
 * Update a notebook
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const notebook = await updateNotebook(
    req.params.id,
    { title, description },
    req.userId
  );

  res.json({
    success: true,
    data: notebook
  });
}));

/**
 * DELETE /notebooks/:id
 * Delete a notebook
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteNotebook(req.params.id, req.userId);

  res.json({
    success: true,
    message: 'Notebook deleted successfully'
  });
}));

/**
 * GET /notebooks/:id/documents
 * Get all documents for a notebook
 */
router.get('/:id/documents', asyncHandler(async (req, res) => {
  const documents = await getDocumentsByNotebook(req.params.id, req.userId);

  res.json({
    success: true,
    data: documents
  });
}));

export default router;
