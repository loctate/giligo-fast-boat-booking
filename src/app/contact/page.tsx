import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title: "Contact Us | Nusa Gili Boat",
  description:
    "Contact Nusa Gili Boat for booking assistance, travel information, payment questions, cancellations, and other customer support requests.",
}

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact Us"
      title="We are here to help with your journey"
      description="Contact the Nusa Gili Boat team for assistance with bookings, schedules, payments, passenger details, cancellations, or other travel-related questions."
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Customer support
        </h2>

        <p className="leading-8 text-slate-600">
          Our customer support team can assist with
          booking information, travel schedules,
          passenger details, payment confirmation, and
          changes related to your reservation.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              Email
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Our official customer service email address
              will be published before production
              payments become available.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              WhatsApp
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Our official WhatsApp customer service
              number will be published before the
              commercial launch.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          When contacting us
        </h2>

        <p className="leading-8 text-slate-600">
          To help us locate your reservation quickly,
          please include the following information:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>Your booking code</li>
          <li>The customer name used for the booking</li>
          <li>The email address used during checkout</li>
          <li>Your departure date and selected route</li>
          <li>
            A brief explanation of the assistance needed
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          Do not send passwords, payment card numbers,
          security codes, or other sensitive financial
          information through email or WhatsApp.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Support categories
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">
              Booking assistance
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Questions about routes, schedules,
              passenger information, availability, or
              booking confirmation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">
              Payment assistance
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Questions about payment status, failed
              transactions, pending payments, or payment
              confirmation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">
              Changes and cancellations
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Requests concerning booking changes,
              cancellations, refunds, or operator
              schedule adjustments.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">
              Technical support
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Assistance when the website, booking
              lookup, checkout, or payment process does
              not work as expected.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Response time
        </h2>

        <p className="leading-8 text-slate-600">
          We aim to respond to customer inquiries as soon
          as reasonably possible during our operating
          hours. Response times may be longer during
          weekends, public holidays, severe weather, or
          periods of high booking activity.
        </p>

        <p className="leading-8 text-slate-600">
          For urgent travel-day matters, customers should
          also follow the instructions and contact
          information provided by the selected boat
          operator.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Cancellations and refunds
        </h2>

        <p className="leading-8 text-slate-600">
          Cancellation and refund eligibility may depend
          on the selected operator, departure schedule,
          payment status, and the time the request is
          submitted.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read our refund and cancellation policy
        </Link>
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Contact details are being finalized
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          The official customer service email, WhatsApp
          number, business address, and operating hours
          will be added before Nusa Gili Boat begins
          accepting production payments.
        </p>
      </aside>
    </PublicInfoPage>
  )
}