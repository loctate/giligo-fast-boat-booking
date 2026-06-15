"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LogoutButton() {
  const router = useRouter()

  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })
    } finally {
      router.replace("/admin/login")
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
    >
      {isLoggingOut ? "Logging Out..." : "Logout"}
    </button>
  )
}