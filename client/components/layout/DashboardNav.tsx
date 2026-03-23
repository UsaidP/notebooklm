"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import LogoImage from "@/components/ui/logo-image"

export function DashboardNav() {
  return (
    <nav
      style={{
        height: 56,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}
    >
      {/* Logo */}
      <Link
        href="/notebooks"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
        }}
      >
        <LogoImage size={28} />
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.3px",
          }}
        >
          PrivyLM
        </span>
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User Avatar */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: {
              width: 32,
              height: 32,
            },
          },
        }}
      />
    </nav>
  )
}
