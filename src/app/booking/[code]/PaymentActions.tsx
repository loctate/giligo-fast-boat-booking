"use client"

import { useState } from "react"

type PaymentActionsProps = {
  bookingCode: string
  bookingStatus: string
  paymentStatus: string
  customerFullName: string
  customerEmail: string
  routeFrom: string
  routeTo: string
  departureLabel: string
  totalLabel: string
}

type SnapTokenApiResponse = {
  success?: boolean
  redirectUrl?: string
  error?: string
}

const FINAL_PAYMENT_STATUSES =
  new Set([
    "paid",
    "settlement",
    "settled",
    "capture",
    "captured",
    "success",
    "completed",
    "refunded",
    "chargeback",
  ])

const BLOCKED_BOOKING_STATUSES =
  new Set([
    "cancelled",
    "canceled",
    "expired",
  ])

function normalizeStatus(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
}

export default function PaymentActions({
  bookingCode,
  bookingStatus,
  paymentStatus,
  customerFullName,
  customerEmail,
  routeFrom,
  routeTo,
  departureLabel,
  totalLabel,
}: PaymentActionsProps) {
  const [
    isStartingPayment,
    setIsStartingPayment,
  ] = useState(false)

  const [
    paymentError,
    setPaymentError,
  ] = useState("")

  const paymentIsAvailable =
    !BLOCKED_BOOKING_STATUSES.has(
      normalizeStatus(
        bookingStatus
      )
    ) &&
    !FINAL_PAYMENT_STATUSES.has(
      normalizeStatus(
        paymentStatus
      )
    )

  const supportWhatsapp =
    String(
      process.env
        .NEXT_PUBLIC_SUPPORT_WHATSAPP ??
        ""
    ).replace(/\D/g, "")

  const manualPaymentLines = [
    "Hello Nusa Gili Boat Support,",
    "",
    "I need assistance with manual payment.",
    `Booking code: ${bookingCode}`,
    `Passenger: ${customerFullName}`,
    `Email: ${customerEmail}`,
    `Route: ${routeFrom} to ${routeTo}`,
    `Departure: ${departureLabel}`,
    `Payment status: ${paymentStatus}`,
    `Total: ${totalLabel}`,
  ]

  const manualPaymentUrl =
    supportWhatsapp
      ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
          manualPaymentLines.join("\n")
        )}`
      : ""

  async function handleMidtransPayment() {
    if (isStartingPayment) {
      return
    }

    setIsStartingPayment(true)
    setPaymentError("")

    try {
      const response =
        await fetch(
          "/api/payments/midtrans/snap-token",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              bookingCode,
              email:
                customerEmail,
            }),
          }
        )

      const responseText =
        await response.text()

      let result:
        SnapTokenApiResponse

      try {
        result = JSON.parse(
          responseText
        ) as SnapTokenApiResponse
      } catch {
        throw new Error(
          "The payment service returned an invalid response."
        )
      }

      if (
        !response.ok ||
        !result.success ||
        !result.redirectUrl
      ) {
        throw new Error(
          result.error ||
            "The payment page could not be opened."
        )
      }

      window.location.assign(
        result.redirectUrl
      )
    } catch (error) {
      console.error(
        "Midtrans payment error:",
        error
      )

      setPaymentError(
        error instanceof Error
          ? error.message
          : "The payment service is temporarily unavailable."
      )

      setIsStartingPayment(false)
    }
  }

  if (!paymentIsAvailable) {
    return (
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
        Online payment is no longer
        available for this booking.
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={
          handleMidtransPayment
        }
        disabled={
          isStartingPayment
        }
        className="w-full rounded-xl bg-cyan-600 px-5 py-3.5 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isStartingPayment
          ? "Opening Secure Payment..."
          : "Pay Securely with Midtrans"}
      </button>

      {manualPaymentUrl ? (
        <a
          href={
            manualPaymentUrl
          }
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-center font-black text-emerald-700 transition hover:bg-emerald-100"
        >
          Manual Payment Assistance
        </a>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-700">
          Manual payment support is
          not configured.
        </div>
      )}

      <p className="text-center text-xs leading-5 text-slate-500">
        Online payments are processed
        securely by Midtrans. Manual
        assistance remains available
        when online payment cannot be
        completed.
      </p>

      {paymentError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {paymentError}
        </div>
      )}
    </div>
  )
}
