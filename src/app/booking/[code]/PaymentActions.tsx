"use client"

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

type ManualPaymentMethod =
  | "qris"
  | "paypal-card"

const FINAL_PAYMENT_STATUSES = new Set([
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

const BLOCKED_BOOKING_STATUSES = new Set([
  "cancelled",
  "canceled",
  "expired",
])

function normalizeStatus(
  value: string
): string {
  return value.trim().toLowerCase()
}

function getSupportWhatsapp(): string {
  return String(
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
      process.env.NEXT_PUBLIC_WHATSAPP ??
      ""
  ).replace(/\D/g, "")
}

function getPaymentRequestMessage({
  method,
  bookingCode,
  customerFullName,
  customerEmail,
  routeFrom,
  routeTo,
  departureLabel,
  paymentStatus,
  totalLabel,
}: {
  method: ManualPaymentMethod
  bookingCode: string
  customerFullName: string
  customerEmail: string
  routeFrom: string
  routeTo: string
  departureLabel: string
  paymentStatus: string
  totalLabel: string
}): string {
  const methodLines =
    method === "qris"
      ? [
          "Selected payment method: QRIS",
          "Please send the official QRIS payment instructions for this booking.",
        ]
      : [
          "Selected payment method: Credit or Debit Card via PayPal",
          "Please send a secure PayPal payment link for this booking.",
        ]

  return [
    "Hello Nusa Gili Boat Support,",
    "",
    ...methodLines,
    "",
    `Booking code: ${bookingCode}`,
    `Passenger: ${customerFullName}`,
    `Email: ${customerEmail}`,
    `Route: ${routeFrom} to ${routeTo}`,
    `Departure: ${departureLabel}`,
    `Payment status: ${paymentStatus}`,
    `Total: ${totalLabel}`,
    "",
    "I understand that my booking will be confirmed after the payment has been verified by the admin.",
  ].join("\n")
}

function createWhatsappUrl(
  supportWhatsapp: string,
  message: string
): string {
  if (!supportWhatsapp) {
    return ""
  }

  return `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
    message
  )}`
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
  const paymentIsAvailable =
    !BLOCKED_BOOKING_STATUSES.has(
      normalizeStatus(bookingStatus)
    ) &&
    !FINAL_PAYMENT_STATUSES.has(
      normalizeStatus(paymentStatus)
    )

  const supportWhatsapp =
    getSupportWhatsapp()

  const qrisWhatsappUrl =
    createWhatsappUrl(
      supportWhatsapp,
      getPaymentRequestMessage({
        method: "qris",
        bookingCode,
        customerFullName,
        customerEmail,
        routeFrom,
        routeTo,
        departureLabel,
        paymentStatus,
        totalLabel,
      })
    )

  const paypalWhatsappUrl =
    createWhatsappUrl(
      supportWhatsapp,
      getPaymentRequestMessage({
        method: "paypal-card",
        bookingCode,
        customerFullName,
        customerEmail,
        routeFrom,
        routeTo,
        departureLabel,
        paymentStatus,
        totalLabel,
      })
    )

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

  if (!supportWhatsapp) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">
          Payment assistance is temporarily unavailable.
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          Please contact Nusa Gili Boat through the Contact
          Us page for further assistance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-black text-sky-950">
          Select your preferred payment method
        </p>

        <p className="mt-1 text-sm leading-6 text-sky-800">
          Payment instructions will be sent manually by
          Nusa Gili Boat support through WhatsApp.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-black text-slate-950">
            QRIS
          </p>

          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            Request the official QRIS code from our admin.
            Your booking will be confirmed after the
            payment has been verified.
          </p>

          <a
            href={qrisWhatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Pay with QRIS
          </a>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-black text-slate-950">
            Credit or Debit Card
          </p>

          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            Request a secure PayPal payment link from our
            admin. The payment link will be sent through
            WhatsApp.
          </p>

          <a
            href={paypalWhatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-sky-700"
          >
            Pay by Credit Card via PayPal
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-5 text-slate-600">
          Payment confirmation is performed manually by
          the admin. Never send your PIN, OTP, CVV,
          banking password, or complete card details
          through WhatsApp.
        </p>
      </div>
    </div>
  )
}
