/**
 * Tenant Scoping Middleware
 * Injects userId into request for multi-tenant data isolation
 * Ensures all queries are scoped to the authenticated user
 */

/**
 * Middleware to ensure userId is present on request
 * Must be used after auth middleware
 */
export const requireTenant = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID not found. Authentication required.'
    });
  }

  // Set tenant context for all downstream operations
  req.tenant = {
    userId: req.userId,
    // Future: can add orgId, teamId for multi-org support
  };

  console.log(`[Tenant] Scoped to user: ${req.userId}`);
  next();
};

/**
 * Create Prisma query filter for tenant isolation
 * Usage: prisma.notebook.findMany({ where: tenantFilter(req) })
 */
export const tenantFilter = (req) => {
  if (!req.userId) {
    throw new Error('Cannot create tenant filter: userId not found');
  }
  return { userId: req.userId };
};

/**
 * Middleware to validate notebook access
 * Ensures user owns the notebook they're accessing
 */
export const validateNotebookAccess = async (req, res, next) => {
  const { notebookId } = req.params;

  if (!notebookId) {
    return next(); // No notebookId to validate
  }

  if (!req.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access notebooks'
    });
  }

  try {
    // Import Prisma client dynamically to avoid circular deps
    const { prisma } = await import('../lib/prisma.js');

    // Find internal user ID from Clerk user ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId: user.id
      }
    });

    if (!notebook) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notebook not found or access denied'
      });
    }

    // Attach notebook to request for downstream use
    req.notebook = notebook;
    next();
  } catch (error) {
    console.error('[Tenant] Error validating notebook access:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate notebook access'
    });
  }
};

/**
 * Generate Qdrant collection name for user+notebook isolation
 * Format: user_{userId}_notebook_{notebookId}
 */
export const getCollectionName = (userId, notebookId) => {
  return `user_${userId}_notebook_${notebookId}`;
};
