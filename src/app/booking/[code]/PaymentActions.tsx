"use client"

import {
  useState,
} from "react"

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

type PaymentApiResponse = {
  success?: boolean
  error?: string
  payment?: {
    sessionId?: unknown
    referenceId?: unknown
    paymentUrl?: unknown
  }
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
    "completed",
  ])

function normalizeStatus(
  value: string
): string {
  return value.trim().toLowerCase()
}

function cleanText(
  value: unknown
): string {
  return String(value ?? "").trim()
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
    isCreatingPayment,
    setIsCreatingPayment,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const paymentIsAvailable =
    !BLOCKED_BOOKING_STATUSES.has(
      normalizeStatus(bookingStatus)
    ) &&
    !FINAL_PAYMENT_STATUSES.has(
      normalizeStatus(paymentStatus)
    )

  async function handlePayment() {
    if (
      isCreatingPayment ||
      !paymentIsAvailable
    ) {
      return
    }

    setErrorMessage("")
    setIsCreatingPayment(true)

    try {
      const response =
        await fetch(
          "/api/payments/ipaymu",
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
        PaymentApiResponse

      try {
        result =
          JSON.parse(
            responseText
          ) as PaymentApiResponse
      } catch {
        console.error(
          "Payment API returned non-JSON:",
          {
            status:
              response.status,

            contentType:
              response.headers.get(
                "content-type"
              ),
          }
        )

        throw new Error(
          "The payment service returned an invalid response."
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
          "The payment session could not be created."
        )
      }

      const referenceId =
        cleanText(
          result.payment
            ?.referenceId
        )

      const paymentUrl =
        cleanText(
          result.payment
            ?.paymentUrl
        )

      if (
        referenceId !== bookingCode
      ) {
        throw new Error(
          "The payment reference does not match this booking."
        )
      }

      let parsedPaymentUrl: URL

      try {
        parsedPaymentUrl =
          new URL(paymentUrl)
      } catch {
        throw new Error(
          "The payment service returned an invalid payment URL."
        )
      }

      if (
        parsedPaymentUrl.protocol !==
        "https:"
      ) {
        throw new Error(
          "The payment service returned an insecure payment URL."
        )
      }

      window.location.assign(
        parsedPaymentUrl.toString()
      )
    } catch (error) {
      console.error(
        "Payment session creation error:",
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The payment service is currently unavailable."
      )

      setIsCreatingPayment(false)
    }
  }

  if (!paymentIsAvailable) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Payment is no longer available for this booking.
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          The booking may already be paid, completed,
          cancelled, or expired.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <p className="text-sm font-black uppercase tracking-wider text-sky-700">
          Secure online payment
        </p>

        <h3 className="mt-2 text-lg font-black text-sky-950">
          Pay your booking with iPaymu
        </h3>

        <p className="mt-2 text-sm leading-6 text-sky-800">
          You will be redirected to the secure iPaymu
          payment page to select an available payment
          method.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-500">
              Booking
            </dt>

            <dd className="text-right font-black text-slate-950">
              {bookingCode}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-500">
              Passenger
            </dt>

            <dd className="text-right font-black text-slate-950">
              {customerFullName}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-500">
              Route
            </dt>

            <dd className="text-right font-black text-slate-950">
              {routeFrom} to {routeTo}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-500">
              Departure
            </dt>

            <dd className="text-right font-black text-slate-950">
              {departureLabel}
            </dd>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-start justify-between gap-4">
              <dt className="font-black text-slate-700">
                Total payment
              </dt>

              <dd className="text-right text-lg font-black text-cyan-700">
                {totalLabel}
              </dd>
            </div>
          </div>
        </dl>

        <button
          type="button"
          onClick={handlePayment}
          disabled={isCreatingPayment}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isCreatingPayment
            ? "Preparing secure payment..."
            : "Pay securely with iPaymu"}
        </button>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-bold text-red-800">
              Payment could not be started
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-5 text-slate-600">
          Card numbers, CVV, PIN, OTP, and banking
          passwords are entered only on the secure
          payment provider page. Nusa Gili Boat does
          not request these details through WhatsApp.
        </p>
      </div>
    </div>
  )
}
