"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type StatusEditorProps = {
  rowId: string
  initialBookingStatus: string
  initialPaymentStatus: string
}

type UpdateResponse = {
  success?: boolean
  error?: string
}

export default function StatusEditor({
  rowId,
  initialBookingStatus,
  initialPaymentStatus,
}: StatusEditorProps) {
  const router = useRouter()

  const [bookingStatus, setBookingStatus] =
    useState(initialBookingStatus)

  const [paymentStatus, setPaymentStatus] =
    useState(initialPaymentStatus)

  const [isSaving, setIsSaving] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [isError, setIsError] =
    useState(false)

  async function handleSave() {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setMessage("")
    setIsError(false)

    try {
      const response = await fetch(
        "/api/bookings/" + rowId,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingStatus,
            paymentStatus,
          }),
        }
      )

      const result =
        (await response.json()) as UpdateResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Status could not be updated."
        )
      }

      setMessage(
        "Booking status updated successfully."
      )

      router.refresh()
    } catch (error) {
      console.error(
        "Status update error:",
        error
      )

      setIsError(true)

      setMessage(
        error instanceof Error
          ? error.message
          : "Status could not be updated."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
        Administration
      </p>

      <h2 className="mt-2 text-xl font-black">
        Update booking status
      </h2>

      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Booking status
          </span>

          <select
            value={bookingStatus}
            onChange={(event) =>
              setBookingStatus(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="Pending">
              Pending
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Payment status
          </span>

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="Demo">
              Demo
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>
        </label>

        {message && (
          <div
            className={
              "rounded-xl border p-4 text-sm font-semibold " +
              (isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700")
            }
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-cyan-600 px-5 py-3.5 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSaving
            ? "Saving Changes..."
            : "Save Status Changes"}
        </button>
      </div>
    </section>
  )
}