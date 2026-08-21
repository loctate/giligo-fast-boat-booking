import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "en",
  path: "/contact",
  title: "Contact Us | Nusa Gili Boat",
  description: "Contact Nusa Gili Boat for fast boat booking assistance, schedules, passenger details, online payment assistance, confirmation, changes, and cancellations.",
})

const businessEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "nusagiliboat@gmail.com"

const businessWhatsapp = String(
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP ??
    "6282180126117"
).replace(/\D/g, "")

const businessWhatsappUrl =
  `https://wa.me/${businessWhatsapp}`

function formatWhatsappNumber(
  value: string
): string {
  if (
    value.startsWith("62") &&
    value.length >= 12
  ) {
    const localNumber = value.slice(2)

    return [
      "+62",
      localNumber.slice(0, 3),
      localNumber.slice(3, 7),
      localNumber.slice(7),
    ]
      .filter(Boolean)
      .join(" ")
  }

  return value ? `+${value}` : "Not configured"
}

export default function ContactPage() {
  return (
    <PublicInfoPage
      locale="en"
      eyebrow="Customer Support"
      title="Contact Us"
      description="Contact Nusa Gili Boat for assistance with fast boat searches, bookings, passenger information, online payments, confirmation, schedule updates, changes, cancellations, and refunds."
      lastUpdated="July 24, 2026"
    >
      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
        <h2 className="text-xl font-black text-cyan-950">
          Official Nusa Gili Boat support
        </h2>

        <p className="mt-3 leading-7 text-cyan-900">
          For an existing reservation, include your
          booking code, passenger name, route, and travel
          date so our admin can review the request more
          efficiently.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">
            Business email
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Email support
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Use email for general enquiries, booking
            documents, detailed requests, and matters that
            do not require an immediate response.
          </p>

          <a
            href={`mailto:${businessEmail}`}
            className="mt-5 inline-flex break-all font-bold text-cyan-700 transition hover:text-cyan-900"
          >
            {businessEmail}
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">
            WhatsApp
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Booking and payment assistance
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Use WhatsApp for booking assistance, payment
            support, and time-sensitive travel questions.
            Online payments are completed through the secure
            iPaymu payment page.
          </p>

          <a
            href={businessWhatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex font-bold text-emerald-700 transition hover:text-emerald-900"
          >
            {formatWhatsappNumber(businessWhatsapp)}
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
            Operating location
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Registered business address
          </h2>

          <address className="mt-3 not-italic leading-7 text-slate-600">
            Jl. Gelong Baru Selatan V No. 37
            <br />
            RT 008/RW 001
            <br />
            Tomang, Grogol Petamburan
            <br />
            West Jakarta 11440
            <br />
            DKI Jakarta, Indonesia
          </address>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Nusa Gili Boat is an online booking service.
            This operating location is not a public
            walk-in ticket counter or physical retail
            store.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet-700">
            Customer-service hours
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Every day
          </h2>

          <p className="mt-3 text-lg font-bold text-slate-800">
            08:00–20:00 WIB
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Messages received outside operating hours may
            be answered on the following service period.
            Urgent operational updates remain subject to
            information received from the fast boat
            operator.
          </p>
        </article>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Information to include when contacting us
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Providing complete information helps the admin
            locate and review your booking.
          </p>
        </div>

        <ul className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
          {[
            "Booking code, when already available.",
            "Customer and passenger name.",
            "Customer email and WhatsApp number.",
            "Departure point and destination.",
            "Travel date and departure schedule.",
            "Selected payment method or payment status.",
            "Clear description of the assistance required.",
            "Payment proof only when requested by the admin.",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-amber-950">
          Payment and account security
        </h2>

        <p className="mt-3 leading-7 text-amber-900">
          Never send your PIN, OTP, CVV, banking
          password, complete card number, or other
          confidential financial credentials through
          WhatsApp, email, or a contact form. Complete
          online payments only through the secure payment
          page provided for your Nusa Gili Boat booking.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">
          Helpful information
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Review the answers and policies below before
          contacting support. They explain the booking,
          payment, cancellation, refund, and personal-data
          procedures.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/faq"
            className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Frequently Asked Questions
          </Link>

          <Link
            href="/terms-and-conditions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Terms and Conditions
          </Link>

          <Link
            href="/refund-and-cancellation-policy"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Refund Policy
          </Link>

          <Link
            href="/privacy-policy"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Privacy Policy
          </Link>
        </div>
      </section>
    </PublicInfoPage>
  )
}
