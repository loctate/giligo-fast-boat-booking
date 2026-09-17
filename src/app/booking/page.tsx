"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useState,
  type FormEvent,
} from "react"

export default function BookingLookupEntryPage() {
  const router = useRouter()

  const [bookingCode, setBookingCode] =
    useState("")

  const [errorMessage, setErrorMessage] =
    useState("")

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const normalizedCode =
      bookingCode
        .trim()
        .toUpperCase()

    if (!normalizedCode) {
      setErrorMessage(
        "Please enter your booking code."
      )
      return
    }

    if (
      normalizedCode.length > 40 ||
      !/^[A-Z0-9-]+$/.test(
        normalizedCode
      )
    ) {
      setErrorMessage(
        "Please enter a valid booking code."
      )
      return
    }

    setErrorMessage("")

    router.push(
      `/booking/${encodeURIComponent(
        normalizedCode
      )}`
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="font-black text-slate-950"
          >
            Nusa Gili Boat
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-cyan-700 hover:text-cyan-900"
          >
            Back to homepage
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
            My Booking
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Find your booking
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Enter the booking code from your booking
            confirmation. You will be asked to verify
            the email address used when the booking was
            created.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Booking code
              </span>

              <input
                type="text"
                value={bookingCode}
                onChange={(event) =>
                  setBookingCode(
                    event.target.value
                  )
                }
                placeholder="Example: GG-260831-A3C7DFA1"
                autoComplete="off"
                maxLength={40}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 uppercase text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            {errorMessage && (
              <p
                role="alert"
                className="mt-3 text-sm font-semibold text-red-600"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-cyan-700 px-5 py-3.5 font-black text-white transition hover:bg-cyan-800"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-sm leading-6 text-slate-500">
            For your privacy, booking details are only
            shown after the booking code and email
            address have been verified.
          </p>
        </div>
      </section>
    </main>
  )
}
