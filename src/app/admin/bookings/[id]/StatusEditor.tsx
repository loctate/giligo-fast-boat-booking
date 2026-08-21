"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type StatusEditorProps = {
  rowId: string
  initialBookingStatus: string
  initialPaymentStatus: string
  paymentReviewRequired: boolean
  paymentReviewReason: string | null
  paymentReviewAt: string | null
}

type UpdateResponse = {
  success?: boolean
  error?: string
}

function isAllowedStatusPair(
  bookingStatus: string,
  paymentStatus: string
): boolean {
  if (bookingStatus === "Pending") {
    return paymentStatus === "Pending"
  }

  if (
    bookingStatus === "Confirmed" ||
    bookingStatus === "Completed"
  ) {
    return (
      paymentStatus === "Demo" ||
      paymentStatus === "Paid" ||
      paymentStatus === "Refunded"
    )
  }

  return (
    bookingStatus === "Cancelled" &&
    (
      paymentStatus === "Demo" ||
      paymentStatus === "Pending" ||
      paymentStatus === "Paid" ||
      paymentStatus === "Refunded"
    )
  )
}

function getStatusPairMessage(
  bookingStatus: string
): string {
  if (bookingStatus === "Pending") {
    return "Pending bookings must use Pending payment status because their seats are still held."
  }

  if (
    bookingStatus === "Confirmed" ||
    bookingStatus === "Completed"
  ) {
    return "Confirmed or Completed bookings must use Demo, Paid, or Refunded payment status."
  }

  if (bookingStatus === "Cancelled") {
    return ""
  }

  return "Select a valid booking and payment status combination."
}

export default function StatusEditor({
  rowId,
  initialBookingStatus,
  initialPaymentStatus,
  paymentReviewRequired,
  paymentReviewReason,
  paymentReviewAt,
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

  const statusPairIsValid =
    isAllowedStatusPair(
      bookingStatus,
      paymentStatus
    )

  const statusPairMessage =
    getStatusPairMessage(
      bookingStatus
    )

  const cancelledPaidNeedsReview =
    bookingStatus === "Cancelled" &&
    paymentStatus === "Paid"

  const callbackPaymentNeedsReview =
    paymentReviewRequired === true

  const paymentReviewCanResolve =
    (
      bookingStatus === "Confirmed" &&
      paymentStatus === "Paid"
    ) ||
    (
      bookingStatus === "Cancelled" &&
      paymentStatus === "Refunded"
    )

  const reviewReasonLabel =
    paymentReviewReason ===
    "LATE_SUCCESS_AFTER_SEAT_RELEASE"
      ? "Payment received after seat release"
      : paymentReviewReason ||
        "Payment review required"

  const reviewAtLabel =
    paymentReviewAt
      ? new Intl.DateTimeFormat(
          "en-GB",
          {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Makassar",
          }
        ).format(
          new Date(paymentReviewAt)
        )
      : null

  async function handleResolvePaymentReview() {
    if (
      isSaving ||
      !callbackPaymentNeedsReview
    ) {
      return
    }

    if (!statusPairIsValid) {
      setIsError(true)
      setMessage(
        statusPairMessage
      )
      return
    }

    if (!paymentReviewCanResolve) {
      setIsError(true)
      setMessage(
        "Resolve the review as Confirmed + Paid or Cancelled + Refunded."
      )
      return
    }

    const confirmed =
      window.confirm(
        bookingStatus === "Confirmed"
          ? "Resolve this payment review and reactivate the booking? Seat availability will be checked before the change is committed."
          : "Mark this payment review as resolved using the currently selected booking and payment statuses?"
      )

    if (!confirmed) {
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            bookingStatus,
            paymentStatus,
            resolvePaymentReview:
              true,
          }),
        }
      )

      const result =
        (await response.json()) as
          UpdateResponse

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Payment review could not be resolved."
        )
      }

      setMessage(
        "Payment review resolved successfully."
      )

      router.refresh()
    } catch (error) {
      console.error(
        "Payment review resolution error:",
        error
      )

      setIsError(true)

      setMessage(
        error instanceof Error
          ? error.message
          : "Payment review could not be resolved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave() {
    if (isSaving) {
      return
    }

    if (!statusPairIsValid) {
      setIsError(true)
      setMessage(
        statusPairMessage
      )
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

        {callbackPaymentNeedsReview && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <p className="font-black">
              Action required: {reviewReasonLabel}
            </p>

            {reviewAtLabel && (
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                Review recorded {reviewAtLabel} WITA
              </p>
            )}

            <p className="mt-2 leading-6">
              A payment callback was received after this booking had already released its seats.
              The booking remains cancelled and no seats have been reserved again.
            </p>

            <p className="mt-2 font-semibold leading-6">
              Resolve this review only as Confirmed + Paid after verifying seats, or Cancelled + Refunded after the refund is completed.
            </p>

            <button
              type="button"
              onClick={
                handleResolvePaymentReview
              }
              disabled={
                isSaving ||
                !statusPairIsValid ||
                !paymentReviewCanResolve
              }
              className="mt-4 rounded-lg bg-amber-900 px-4 py-2 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Processing..."
                : "Mark payment review resolved"}
            </button>
          </div>
        )}

        {cancelledPaidNeedsReview && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
          >
            <p className="font-black">
              Action required: payment received after cancellation
            </p>

            <p className="mt-2 leading-6">
              The seats have already been released.
              This booking is not confirmed, and its seats are not reserved.
            </p>

            <p className="mt-2 font-semibold leading-6">
              Process a refund, or reactivate the booking only after checking seat availability.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
        <p className="font-bold">
          Seat lifecycle
        </p>

        <p className="mt-1 leading-6">
          Pending uses held seats.
          Confirmed and Completed use booked seats.
          Cancelled releases the seats.
        </p>
      </div>

      {!statusPairIsValid && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {statusPairMessage}
        </div>
      )}

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
          disabled={isSaving || !statusPairIsValid}
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