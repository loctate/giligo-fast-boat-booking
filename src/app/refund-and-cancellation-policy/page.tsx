import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title:
    "Refund and Cancellation Policy | Nusa Gili Boat",
  description:
    "Read the Nusa Gili Boat policy regarding booking cancellations, schedule changes, operator cancellations, refunds, and payment processing charges.",
}

export default function RefundAndCancellationPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Booking Policy"
      title="Refund and Cancellation Policy"
      description="This policy explains how booking cancellations, changes, operator disruptions, and refund requests are handled by Nusa Gili Boat."
      lastUpdated="28 June 2026"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          1. General policy
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat acts as a booking service
          between customers and participating fast boat
          operators.
        </p>

        <p className="leading-8 text-slate-600">
          Cancellation, rescheduling, and refund
          eligibility may depend on the selected
          operator, fare conditions, departure schedule,
          payment status, and the time the request is
          received.
        </p>

        <p className="leading-8 text-slate-600">
          Customers should review their travel details
          carefully before completing payment.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          2. Cancellation requests
        </h2>

        <p className="leading-8 text-slate-600">
          Cancellation requests must be submitted
          through an official Nusa Gili Boat customer
          service channel.
        </p>

        <p className="leading-8 text-slate-600">
          The request should include:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>The booking code</li>
          <li>
            The customer name and email address used
            during checkout
          </li>
          <li>The selected route and travel date</li>
          <li>
            The passenger or passengers affected by the
            request
          </li>
          <li>
            The reason for requesting cancellation
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          A cancellation is not considered completed
          until Nusa Gili Boat confirms that the request
          has been processed.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          3. Customer-initiated cancellations
        </h2>

        <p className="leading-8 text-slate-600">
          When a customer voluntarily cancels a booking,
          the amount eligible for refund will be
          determined according to the selected
          operator&apos;s cancellation conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Depending on the operator and the time
          remaining before departure, a booking may be:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>Eligible for a full refund</li>
          <li>
            Eligible for a partial refund after
            applicable deductions
          </li>
          <li>
            Eligible for rescheduling or travel credit
          </li>
          <li>Non-refundable</li>
        </ul>

        <p className="leading-8 text-slate-600">
          Requests submitted close to departure or after
          the scheduled departure time may not qualify
          for a refund.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          4. Unpaid and expired bookings
        </h2>

        <p className="leading-8 text-slate-600">
          A booking that has not been paid within the
          payment time limit may automatically expire.
        </p>

        <p className="leading-8 text-slate-600">
          When an unpaid booking expires, the reserved
          seats may be released back into the available
          inventory without further notice.
        </p>

        <p className="leading-8 text-slate-600">
          Because no successful payment has been
          received, an expired unpaid booking does not
          normally require a refund.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          5. Operator cancellation
        </h2>

        <p className="leading-8 text-slate-600">
          A boat operator may cancel a trip because of
          unsafe weather, sea conditions, technical
          issues, operational requirements, government
          instructions, port closures, or other safety
          considerations.
        </p>

        <p className="leading-8 text-slate-600">
          When the selected operator cancels a trip,
          Nusa Gili Boat will assist the customer with
          the available resolution offered by the
          operator, which may include:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>
            Rescheduling to another available departure
          </li>
          <li>
            Transferring the booking to another
            available operator
          </li>
          <li>
            Providing travel credit where applicable
          </li>
          <li>
            Processing an eligible refund
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          Alternative schedules and operators remain
          subject to seat availability and customer
          approval.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          6. Schedule changes
        </h2>

        <p className="leading-8 text-slate-600">
          Departure times, arrival times, vessels,
          routes, and meeting points may be changed by
          the operator.
        </p>

        <p className="leading-8 text-slate-600">
          Minor schedule adjustments that do not prevent
          the transportation service from being
          delivered may not automatically qualify for a
          refund.
        </p>

        <p className="leading-8 text-slate-600">
          When a significant schedule change materially
          affects the booked journey, Nusa Gili Boat
          will communicate the available alternatives
          provided by the operator.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          7. Round-trip bookings
        </h2>

        <p className="leading-8 text-slate-600">
          A round-trip booking contains an outbound
          journey and a return journey. Each journey may
          be operated under different schedules or
          operator conditions.
        </p>

        <p className="leading-8 text-slate-600">
          A cancellation or disruption affecting one
          journey does not automatically cancel the
          other journey unless this is confirmed by
          Nusa Gili Boat.
        </p>

        <p className="leading-8 text-slate-600">
          Refund calculations for round-trip bookings
          may be based on the value and conditions of
          each affected journey.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          8. Late arrival and no-show
        </h2>

        <p className="leading-8 text-slate-600">
          Customers and passengers are responsible for
          arriving at the designated meeting point
          within the check-in time communicated in the
          booking confirmation or operator instructions.
        </p>

        <p className="leading-8 text-slate-600">
          A passenger who arrives late, misses check-in,
          fails to appear, or is refused boarding due to
          missing documents may be treated as a no-show.
        </p>

        <p className="leading-8 text-slate-600">
          No-show bookings are generally not eligible
          for a refund or free rescheduling unless the
          operator decides otherwise.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          9. Incorrect passenger or booking information
        </h2>

        <p className="leading-8 text-slate-600">
          Customers are responsible for ensuring that
          passenger names, travel dates, routes, contact
          details, and other booking information are
          correct.
        </p>

        <p className="leading-8 text-slate-600">
          Requests to correct or change booking
          information may be subject to operator
          approval, availability, administrative fees,
          or fare differences.
        </p>

        <p className="leading-8 text-slate-600">
          A refund may not be available when the service
          cannot be used because incorrect information
          was supplied by the customer.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          10. Refund deductions
        </h2>

        <p className="leading-8 text-slate-600">
          Where permitted and clearly applicable, an
          approved refund may be reduced by:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>Operator cancellation penalties</li>
          <li>Administrative processing fees</li>
          <li>
            Non-refundable payment processing charges
          </li>
          <li>
            Bank, transfer, currency conversion, or
            settlement charges
          </li>
          <li>
            Services that have already been delivered
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          Any applicable deduction will be communicated
          before the refund is processed whenever
          reasonably possible.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          11. Refund method
        </h2>

        <p className="leading-8 text-slate-600">
          Approved refunds will normally be returned
          through the original payment method when
          supported by the payment provider.
        </p>

        <p className="leading-8 text-slate-600">
          In some circumstances, additional account
          information or identity verification may be
          required to process the refund safely.
        </p>

        <p className="leading-8 text-slate-600">
          Customers should never provide passwords,
          PINs, card security codes, or one-time
          passwords when requesting a refund.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          12. Refund processing time
        </h2>

        <p className="leading-8 text-slate-600">
          Refund processing begins after the request has
          been reviewed, approved, and confirmed with
          the relevant operator when required.
        </p>

        <p className="leading-8 text-slate-600">
          The time required for funds to appear in the
          customer&apos;s account may depend on the
          payment method, payment gateway, bank, and
          settlement process.
        </p>

        <p className="leading-8 text-slate-600">
          Delays caused by banks or payment providers
          may be outside the direct control of Nusa Gili
          Boat.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          13. Duplicate or incorrect payments
        </h2>

        <p className="leading-8 text-slate-600">
          Customers who believe they have made a
          duplicate payment or paid an incorrect amount
          should contact Nusa Gili Boat promptly.
        </p>

        <p className="leading-8 text-slate-600">
          The request will be reviewed using the booking
          record, transaction identifier, payment
          amount, and payment provider confirmation.
        </p>

        <p className="leading-8 text-slate-600">
          A screenshot alone may not be sufficient proof
          of a successful transaction. The status
          received from the authorized payment provider
          will be used to verify payment.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          14. Chargebacks and payment disputes
        </h2>

        <p className="leading-8 text-slate-600">
          Customers should contact Nusa Gili Boat before
          submitting a chargeback or payment dispute so
          that the booking and transaction can be
          investigated.
        </p>

        <p className="leading-8 text-slate-600">
          Fraudulent, abusive, or duplicate refund and
          chargeback claims may result in the booking
          being suspended and the relevant information
          being provided to the payment provider or
          competent authorities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          15. Force majeure
        </h2>

        <p className="leading-8 text-slate-600">
          Travel may be affected by circumstances beyond
          the reasonable control of Nusa Gili Boat or
          the operator.
        </p>

        <p className="leading-8 text-slate-600">
          These circumstances may include severe
          weather, unsafe sea conditions, natural
          disasters, government restrictions, port
          closures, public emergencies, strikes, civil
          disturbances, technical emergencies, or other
          force majeure events.
        </p>

        <p className="leading-8 text-slate-600">
          The resolution available during such events
          will depend on operator policies, applicable
          requirements, and the specific circumstances.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          16. How to submit a request
        </h2>

        <p className="leading-8 text-slate-600">
          Cancellation, change, and refund requests can
          be submitted through our official contact
          page.
        </p>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Contact Nusa Gili Boat
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          17. Related terms
        </h2>

        <p className="leading-8 text-slate-600">
          This policy should be read together with our
          Terms and Conditions and Privacy Policy.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/terms-and-conditions"
            className="font-semibold text-sky-700 transition hover:text-sky-900"
          >
            Terms and Conditions
          </Link>

          <Link
            href="/privacy-policy"
            className="font-semibold text-sky-700 transition hover:text-sky-900"
          >
            Privacy Policy
          </Link>
        </div>
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Final conditions are being prepared
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Exact cancellation deadlines, refund
          percentages, administrative fees, operator
          conditions, and processing time estimates will
          be finalized before production payments are
          activated.
        </p>
      </aside>
    </PublicInfoPage>
  )
}