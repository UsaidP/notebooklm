import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

/**
 * Clerk JWT Authentication Middleware
 * Validates Clerk JWT on every request and extracts userId
 * 
 * Usage: app.use(requireAuth) or router.get('/path', requireAuth, handler)
 */
export const requireAuth = ClerkExpressRequireAuth({
  // Optional: customize error handling
  onError: (error, req, res) => {
    console.error('Clerk auth error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or missing authentication token'
    });
  }
});

/**
 * Optional auth middleware - attaches user if token present, doesn't reject
 */
export const optionalAuth = (req, res, next) => {
  // Try to get auth info from Clerk if available
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }

  // Let Clerk middleware handle it
  ClerkExpressRequireAuth()(req, res, (err) => {
    if (err) {
      req.userId = null;
    }
    next();
  });
};

/**
 * Extract userId from authenticated request
 * Must be used after requireAuth middleware
 */
export const extractUserId = (req, res, next) => {
  if (req.auth && req.auth.userId) {
    req.userId = req.auth.userId;
    console.log(`[Auth] User authenticated: ${req.userId}`);
  } else {
    console.warn('[Auth] No userId found in auth context');
  }
  next();
};
