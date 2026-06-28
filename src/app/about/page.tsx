import type {
  Metadata,
} from "next"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title: "About Us | Nusa Gili Boat",
  description:
    "Learn about Nusa Gili Boat, an online booking service helping travelers find and book fast boat trips between Bali, the Gili Islands, and nearby destinations.",
}

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About Us"
      title="Making fast boat travel easier to plan"
      description="Nusa Gili Boat helps travelers search, compare, and book fast boat journeys between Bali, the Gili Islands, and nearby destinations."
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Who we are
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is an independent online
          booking service focused on fast boat travel
          in Indonesia. We connect customers with
          available trips provided by selected boat
          operators.
        </p>

        <p className="leading-8 text-slate-600">
          Our platform is designed to make the booking
          process clearer and more convenient, from
          selecting a route and travel date to receiving
          booking confirmation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          What we provide
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              Trip search
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Search available fast boat schedules
              based on route, travel date, and passenger
              count.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              One-way and round-trip booking
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Book one-way or return journeys through a
              simple and structured reservation process.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              Clear booking details
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Review operator, vessel, departure,
              arrival, passenger, and pricing information
              before completing a booking.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">
              Customer assistance
            </h3>

            <p className="mt-2 leading-7 text-slate-600">
              Contact our team when assistance is needed
              regarding reservations, schedules, or
              travel information.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Our role
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat acts as a booking service
          between customers and fast boat operators. The
          actual transportation service is operated by
          the boat operator selected during the booking
          process.
        </p>

        <p className="leading-8 text-slate-600">
          Departure times, vessels, routes, and travel
          conditions may be adjusted by operators due to
          weather, safety, operational requirements, or
          instructions from the relevant authorities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Our commitment
        </h2>

        <p className="leading-8 text-slate-600">
          We aim to provide accurate booking information,
          transparent pricing, secure payment processing,
          and responsive customer assistance.
        </p>

        <p className="leading-8 text-slate-600">
          As our service continues to develop, we will
          keep improving the platform to provide a more
          reliable and convenient travel booking
          experience.
        </p>
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Business information
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Detailed business identity, operating address,
          and customer service information will be
          updated before the service begins accepting
          production payments.
        </p>
      </aside>
    </PublicInfoPage>
  )
}