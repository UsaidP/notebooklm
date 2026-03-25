import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/notebooks(.*)", "/settings(.*)"])

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId, redirectToSignIn } = await auth()

    // If user is signed in and trying to access auth routes, redirect to dashboard
    if (userId && isAuthRoute(req)) {
      const dashboardUrl = new URL("/notebooks", req.url)
      return Response.redirect(dashboardUrl)
    }

    // If user is not signed in and trying to access protected routes, redirect to sign-in
    if (!userId && isProtectedRoute(req)) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
  } catch (error) {
    // Log error but don't crash - allows healthcheck to pass
    console.error("Middleware error:", error)
  }
})

export const config = {
  // Run middleware on all routes except:
  // - Static files
  // - Health check endpoint
  // - Public assets
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)).*)."],
}
