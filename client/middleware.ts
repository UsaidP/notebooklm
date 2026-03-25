import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/notebooks(.*)",
  "/settings(.*)",
])

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
])

export default clerkMiddleware((auth, req) => {
  // Safely check authentication - won't crash if Clerk not configured
  const { userId, redirectToSignIn } = auth()

  // If user is signed in and trying to access auth routes, redirect to dashboard
  if (userId && isAuthRoute(req)) {
    const dashboardUrl = new URL("/notebooks", req.url)
    return Response.redirect(dashboardUrl)
  }

  // If user is not signed in and trying to access protected routes, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
})

export const config = {
  // Run middleware on all routes except static files and health check
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
}
