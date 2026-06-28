import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title:
    "Terms and Conditions | Nusa Gili Boat",
  description:
    "Read the terms and conditions governing fast boat searches, bookings, payments, cancellations, and use of the Nusa Gili Boat website.",
}

export default function TermsAndConditionsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal Information"
      title="Terms and Conditions"
      description="These terms govern the use of the Nusa Gili Boat website and the booking services provided through our platform."
      lastUpdated="28 June 2026"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          1. Acceptance of these terms
        </h2>

        <p className="leading-8 text-slate-600">
          By accessing the Nusa Gili Boat website,
          searching for trips, or submitting a booking,
          you agree to these Terms and Conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Please read these terms carefully before
          completing a reservation. If you do not agree
          with these terms, you should not use our
          booking service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          2. About our service
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat provides an online platform
          through which customers can search for and
          reserve fast boat journeys offered by selected
          transportation operators.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat acts as a booking intermediary.
          The actual sea transportation service is
          provided and operated by the boat operator
          selected by the customer during the booking
          process.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          3. Booking information
        </h2>

        <p className="leading-8 text-slate-600">
          Customers must provide complete and accurate
          information when making a booking, including
          the customer name, email address, telephone or
          WhatsApp number, passenger details, travel
          dates, and selected route.
        </p>

        <p className="leading-8 text-slate-600">
          The customer is responsible for reviewing all
          booking information before submitting the
          reservation. Incorrect information may result
          in delays, additional charges, refusal of
          boarding, or cancellation by the operator.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          4. Passenger requirements
        </h2>

        <p className="leading-8 text-slate-600">
          Passengers may be required to present valid
          identification, travel documents, booking
          confirmation, or other documents requested by
          the operator or relevant authorities.
        </p>

        <p className="leading-8 text-slate-600">
          It is the customer&apos;s responsibility to
          ensure that every passenger complies with
          applicable immigration, health, safety, and
          travel requirements.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          5. Prices and payments
        </h2>

        <p className="leading-8 text-slate-600">
          Prices displayed on the website are shown in
          Indonesian Rupiah unless another currency is
          clearly stated.
        </p>

        <p className="leading-8 text-slate-600">
          The total amount payable will be displayed
          before the customer completes the booking.
          Additional charges may apply for optional
          services, excess baggage, transfers, port
          fees, or operator-specific services when
          clearly communicated.
        </p>

        <p className="leading-8 text-slate-600">
          Payment may be processed through an authorized
          third-party payment gateway. Nusa Gili Boat
          does not directly store complete payment card
          credentials or payment security codes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          6. Booking confirmation
        </h2>

        <p className="leading-8 text-slate-600">
          A submitted reservation is not considered
          fully confirmed until the required payment has
          been successfully received and the booking
          status has been updated to confirmed.
        </p>

        <p className="leading-8 text-slate-600">
          Customers should retain their booking code and
          confirmation information. A booking may be
          accessed using the booking code and the email
          address provided during checkout.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          7. Schedules and operators
        </h2>

        <p className="leading-8 text-slate-600">
          Departure times, arrival times, vessels,
          routes, meeting points, and travel durations
          are supplied by the relevant boat operator and
          may change.
        </p>

        <p className="leading-8 text-slate-600">
          Operators may adjust or cancel a journey due
          to weather, sea conditions, safety concerns,
          technical problems, operational requirements,
          passenger capacity, or instructions from
          government and port authorities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          8. Check-in and boarding
        </h2>

        <p className="leading-8 text-slate-600">
          Passengers must arrive at the designated
          meeting point within the check-in time stated
          in the booking confirmation or operator
          instructions.
        </p>

        <p className="leading-8 text-slate-600">
          Passengers who arrive late may be refused
          boarding and may not be entitled to a refund
          or rescheduling.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          9. Baggage and personal belongings
        </h2>

        <p className="leading-8 text-slate-600">
          Baggage limits and restrictions may differ
          between operators. Customers should review the
          operator&apos;s baggage requirements before
          departure.
        </p>

        <p className="leading-8 text-slate-600">
          Passengers remain responsible for their
          personal belongings. Valuable, fragile,
          prohibited, dangerous, or illegal items must
          not be placed in checked baggage or carried on
          board contrary to applicable rules.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          10. Changes, cancellations, and refunds
        </h2>

        <p className="leading-8 text-slate-600">
          Requests to change or cancel a booking are
          subject to availability, operator conditions,
          the time remaining before departure, and the
          payment status of the booking.
        </p>

        <p className="leading-8 text-slate-600">
          Administrative fees, operator penalties, or
          payment processing charges may be deducted
          from an approved refund where applicable.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Refund and Cancellation Policy
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          11. Weather and force majeure
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat and the relevant operator will
          not be responsible for delays, changes, or
          cancellations caused by circumstances beyond
          reasonable control.
        </p>

        <p className="leading-8 text-slate-600">
          Such circumstances may include severe weather,
          unsafe sea conditions, natural disasters,
          epidemics, government restrictions, port
          closures, strikes, civil disturbances,
          technical emergencies, and other force majeure
          events.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          12. Limitation of responsibility
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is responsible for providing
          the booking service with reasonable care. The
          selected operator remains responsible for
          operating the vessel and delivering the
          transportation service.
        </p>

        <p className="leading-8 text-slate-600">
          To the extent permitted by applicable law,
          Nusa Gili Boat is not responsible for indirect
          losses, missed connections, accommodation
          costs, personal schedule changes, or other
          consequential expenses resulting from an
          operator delay, cancellation, or schedule
          adjustment.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          13. Acceptable use
        </h2>

        <p className="leading-8 text-slate-600">
          Customers must not misuse the website,
          interfere with its operation, attempt
          unauthorized access, submit false bookings,
          conduct fraudulent transactions, or use the
          service for unlawful purposes.
        </p>

        <p className="leading-8 text-slate-600">
          We may restrict access, cancel suspicious
          reservations, or report suspected fraudulent
          activity to payment providers and relevant
          authorities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          14. Privacy
        </h2>

        <p className="leading-8 text-slate-600">
          Personal information collected through the
          website will be handled in accordance with our
          Privacy Policy and applicable Indonesian data
          protection requirements.
        </p>

        <Link
          href="/privacy-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Privacy Policy
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          15. Changes to these terms
        </h2>

        <p className="leading-8 text-slate-600">
          We may update these Terms and Conditions to
          reflect changes in our service, operator
          requirements, payment methods, or applicable
          regulations.
        </p>

        <p className="leading-8 text-slate-600">
          The latest version will be published on this
          page together with the most recent update date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          16. Governing law
        </h2>

        <p className="leading-8 text-slate-600">
          These Terms and Conditions are governed by the
          laws of the Republic of Indonesia. Any dispute
          should first be addressed through good-faith
          communication between the customer and Nusa
          Gili Boat.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          17. Contact us
        </h2>

        <p className="leading-8 text-slate-600">
          Questions about these terms or an existing
          booking can be submitted through our contact
          page.
        </p>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Contact Nusa Gili Boat
        </Link>
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Draft business details
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          The official business identity, address,
          customer service contact, payment procedures,
          and operator-specific conditions will be
          finalized before production payments are
          activated.
        </p>
      </aside>
    </PublicInfoPage>
  )
}