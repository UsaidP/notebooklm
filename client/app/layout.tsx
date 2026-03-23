import { ClerkProvider } from "@clerk/nextjs"
import { dark, neobrutalism } from "@clerk/ui/themes"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Providers } from "@/components/Providers"
import { Toaster } from "@/components/ui/sonner"
import ThemeProvider from "@/components/ui/theme_provider"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PDF Research Assistant",
  description: "AI-powered PDF research tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        signIn: { theme: neobrutalism },
      }}
    >
      <html
        lang="en"
        className={cn(inter.variable, "font-sans")}
        suppressHydrationWarning
      >
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <Providers>
                {children}
                <Toaster />
              </Providers>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
