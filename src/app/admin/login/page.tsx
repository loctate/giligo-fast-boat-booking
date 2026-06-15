"use client"

import { useRouter } from "next/navigation"
import {
  useState,
  type FormEvent,
} from "react"

type LoginResponse = {
  success?: boolean
  error?: string
}

export default function AdminLoginPage() {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    const formData = new FormData(
      event.currentTarget
    )

    const email = String(
      formData.get("email") || ""
    ).trim()

    const password = String(
      formData.get("password") || ""
    )

    try {
      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const result =
        (await response.json()) as LoginResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Login failed."
        )
      }

      router.replace("/admin")
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Login failed."
      )

      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-4xl font-black text-white">
            Gili
            <span className="text-cyan-300">
              Go
            </span>
          </div>

          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Administration
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-7 shadow-2xl sm:p-9"
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            Secure access
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Admin Login
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to manage GiliGo bookings and
            payment statuses.
          </p>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </span>

              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </span>

              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Signing In..."
                : "Sign In to Dashboard"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          GiliGo administration access
        </p>
      </div>
    </main>
  )
}