import type {
  Metadata,
} from "next"

import type {
  ReactNode,
} from "react"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "en",
  path: "/refund-and-cancellation-policy",
  title: "Refund and Cancellation Policy | Nusa Gili Boat",
  description: "Cancellation, booking change, no-show, operator cancellation, and refund terms for fast boat tickets booked through Nusa Gili Boat.",
})

type PolicySectionProps = {
  number: number
  title: string
  children: ReactNode
}

type BulletListProps = {
  items: string[]
}

function PolicySection({
  number,
  title,
  children,
}: PolicySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        {number}. {title}
      </h2>

      {children}
    </section>
  )
}

function BulletList({
  items,
}: BulletListProps) {
  return (
    <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
      {items.map((item) => (
        <li key={item}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function RefundAndCancellationPolicyPage() {
  return (
    <PublicInfoPage
      locale="en"
      eyebrow="Booking Information"
      title="Refund and Cancellation Policy"
      description="This policy explains the terms that apply to cancellations, travel changes, no-shows, operator cancellations, and refunds for bookings made through Nusa Gili Boat."
      lastUpdated="June 30, 2026"
    >
      <PolicySection
        number={1}
        title="Agreement to this policy"
      >
        <p className="leading-8 text-slate-600">
          By making a booking or completing a payment
          through Nusa Gili Boat, the customer is
          considered to have read and understood this
          Refund and Cancellation Policy.
        </p>

        <p className="leading-8 text-slate-600">
          This policy forms part of the Nusa Gili Boat
          Terms and Conditions and should be read
          together with the travel information, fare
          conditions, and operator policies displayed
          before payment.
        </p>

        <p className="leading-8 text-slate-600">
          Where a booking is made for other passengers,
          the person making the booking is responsible
          for communicating this policy to every
          passenger included in the reservation.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="The role of Nusa Gili Boat"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is an online booking platform
          that helps customers search for and book fast
          boat tickets from operators available through
          our system.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is not the owner or operator
          of the vessel. Vessel operations, crew,
          sailing safety, schedules, departure
          decisions, and transportation services are
          managed by the relevant operator.
        </p>

        <p className="leading-8 text-slate-600">
          We assist with receiving customer requests,
          reviewing booking information, communicating
          with operators, processing approved changes,
          and facilitating refunds in accordance with
          the applicable terms.
        </p>
      </PolicySection>

      <PolicySection
        number={3}
        title="Operator policies and fare conditions"
      >
        <p className="leading-8 text-slate-600">
          Each operator or fare type may have different
          cancellation, change, no-show, and refund
          conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Any operator-specific or fare-specific terms
          displayed before payment form part of the
          customer&apos;s booking.
        </p>

        <p className="leading-8 text-slate-600">
          Where specific operator terms are not
          available, a request will be handled based on
          the general policy on this page, the condition
          of the booking, and confirmation received
          from the operator.
        </p>

        <p className="leading-8 text-slate-600">
          Operator policies are not intended to remove
          consumer rights that cannot be excluded under
          the laws of the Republic of Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="Cancellations requested by customers"
      >
        <p className="leading-8 text-slate-600">
          A cancellation request must be submitted
          through an official customer support channel
          before the scheduled departure time.
        </p>

        <p className="leading-8 text-slate-600">
          The request time is calculated from the time
          a complete request is received by Nusa Gili
          Boat, not from the time the customer begins
          writing or sends a message without complete
          booking information.
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">
                    Time of request
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    General conditions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    More than 72 hours before departure
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    The booking may be eligible for a
                    refund after taking into account the
                    operator&apos;s terms, fare
                    conditions, and charges that are
                    genuinely non-refundable.
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    Between 24 and 72 hours before
                    departure
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    A full refund, partial refund,
                    travel credit, or refusal of a
                    refund may apply depending on the
                    operator&apos;s policy and fare
                    type.
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    Less than 24 hours before departure
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    The booking is generally
                    non-refundable unless the operator
                    approves another resolution or the
                    law requires a different outcome.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm leading-7 text-slate-500">
          This table describes the general policy.
          Specific terms displayed in the trip details
          or at checkout may differ.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Promotional tickets and special fares"
      >
        <p className="leading-8 text-slate-600">
          Tickets purchased through a promotion,
          voucher, flash sale, discount, special
          campaign, or limited fare may be subject to
          additional conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Depending on the displayed terms, these
          tickets may:
        </p>

        <BulletList
          items={[
            "Be non-cancellable.",
            "Be non-refundable.",
            "Be non-changeable.",
            "Be non-transferable to another passenger.",
            "Have a specific validity period or travel schedule.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Promotional or special-fare conditions will
          be communicated before payment where they
          apply to the customer&apos;s booking.
        </p>
      </PolicySection>

      <PolicySection
        number={6}
        title="Failure to attend or no-show"
      >
        <p className="leading-8 text-slate-600">
          A passenger may be considered a no-show when
          the passenger:
        </p>

        <BulletList
          items={[
            "Does not arrive before the check-in deadline.",
            "Arrives after check-in or boarding has closed.",
            "Is not present at the designated departure point.",
            "Does not bring the required identification or travel documents.",
            "Does not meet the applicable travel requirements.",
            "Cannot travel because of a personal error or decision.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          A booking classified as a no-show is
          generally not eligible for a refund,
          rescheduling, or conversion into travel
          credit unless the operator specifically
          approves another resolution.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Booking changes"
      >
        <p className="leading-8 text-slate-600">
          Customers may request changes to:
        </p>

        <BulletList
          items={[
            "Travel date.",
            "Departure time or schedule.",
            "Route or port.",
            "Passenger names and details.",
            "Operator or vessel.",
            "Number of passengers.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          All change requests are subject to seat
          availability, operator policy, fare type,
          timing of the request, and approval from the
          relevant parties.
        </p>

        <p className="leading-8 text-slate-600">
          Fare differences, change fees,
          administrative charges, or operator
          penalties may apply. The applicable amount
          will be communicated before the change is
          processed where that information is
          available.
        </p>

        <p className="leading-8 text-slate-600">
          A change is not considered completed until
          the customer receives confirmation of the
          change from Nusa Gili Boat.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="One-way and round-trip bookings"
      >
        <p className="leading-8 text-slate-600">
          A one-way booking consists of one journey or
          one travel leg.
        </p>

        <p className="leading-8 text-slate-600">
          A round-trip booking consists of an outbound
          journey and a return journey that are treated
          as two separate travel legs.
        </p>

        <p className="leading-8 text-slate-600">
          Each leg may have a different operator,
          vessel, schedule, price, change conditions,
          and cancellation policy.
        </p>

        <p className="leading-8 text-slate-600">
          The cancellation or change of one leg does
          not automatically cancel or change the other
          leg.
        </p>

        <p className="leading-8 text-slate-600">
          A partial refund for a round-trip booking is
          calculated based on the value of the eligible
          leg, not the total value of the booking.
        </p>
      </PolicySection>

      <PolicySection
        number={9}
        title="Cancellations by an operator"
      >
        <p className="leading-8 text-slate-600">
          An operator may cancel a journey because of:
        </p>

        <BulletList
          items={[
            "Severe weather or unsafe sea conditions.",
            "High waves or tidal changes.",
            "Port closure or restrictions.",
            "Vessel damage, inspection, or technical problems.",
            "Operational requirements.",
            "Safety considerations.",
            "Instructions from the government or relevant authorities.",
            "Force majeure.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          In these circumstances, Nusa Gili Boat will
          assist in offering an available resolution,
          which may include:
        </p>

        <BulletList
          items={[
            "Transfer to the next available schedule.",
            "Transfer to another operator with the customer's approval.",
            "Travel credit where agreed.",
            "A partial or full refund for the cancelled travel leg.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Alternative travel arrangements remain
          subject to seat availability and operational
          conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Where a reasonable alternative is unavailable
          or is not accepted by the customer, a refund
          request for the cancelled journey will be
          processed according to operator policy, the
          value of the unused service, and applicable
          law.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Delays and schedule changes"
      >
        <p className="leading-8 text-slate-600">
          Departure times, arrival times, and journey
          durations are estimates.
        </p>

        <p className="leading-8 text-slate-600">
          An operator may change the time, vessel,
          check-in location, port, or route because of
          weather, sea conditions, technical issues,
          safety considerations, port congestion, or
          operational requirements.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat will make reasonable efforts
          to communicate a change after receiving
          information from the operator through email,
          telephone, WhatsApp, or the booking page.
        </p>

        <p className="leading-8 text-slate-600">
          A minor change that does not materially
          reduce the service does not automatically
          create a right to a refund or compensation.
        </p>
      </PolicySection>

      <PolicySection
        number={11}
        title="Significant schedule changes"
      >
        <p className="leading-8 text-slate-600">
          A change may be considered significant where
          it materially changes the date, route, port,
          or travel time so that the service no longer
          meets the main purpose of the customer&apos;s
          booking.
        </p>

        <p className="leading-8 text-slate-600">
          A resolution for a significant change may
          include an alternative schedule, alternative
          operator, travel credit, or a refund for the
          affected leg.
        </p>

        <p className="leading-8 text-slate-600">
          The customer must respond to the proposed
          resolution within the stated time limit so
          that the availability of an alternative can
          be maintained.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Force majeure"
      >
        <p className="leading-8 text-slate-600">
          Force majeure means an event beyond the
          reasonable control of Nusa Gili Boat and the
          operator that prevents or disrupts the
          journey from operating as planned.
        </p>

        <BulletList
          items={[
            "Extreme weather and dangerous sea conditions.",
            "Earthquakes, tsunamis, floods, or other natural disasters.",
            "Volcanic eruptions.",
            "Outbreaks, epidemics, or pandemics.",
            "War, terrorism, civil unrest, or security disruption.",
            "Strikes or disruption to public services.",
            "Port closures.",
            "Government restrictions or policies.",
            "Major disruption to infrastructure or systems.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          The resolution of an affected booking will
          take into account operator policy, available
          alternatives, payment status, services
          already used, and applicable law.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Unpaid or expired bookings"
      >
        <p className="leading-8 text-slate-600">
          A booking that remains unpaid after the
          payment deadline may expire and its seats may
          be released.
        </p>

        <p className="leading-8 text-slate-600">
          Because no funds have been successfully
          received, a booking that expires before
          payment does not require a refund process.
        </p>

        <p className="leading-8 text-slate-600">
          Where payment has been completed but the
          system has not updated the booking status,
          the customer must contact us and provide
          proof of the transaction so that the payment
          can be verified.
        </p>
      </PolicySection>

      <PolicySection
        number={14}
        title="Duplicate or incorrect payment amounts"
      >
        <p className="leading-8 text-slate-600">
          Where a customer makes more than one payment
          for the same order, the customer may request
          a refund of the excess payment.
        </p>

        <p className="leading-8 text-slate-600">
          The refund will be processed after the
          transaction number, payment amount,
          settlement status, and ownership of the
          transaction have been verified.
        </p>

        <p className="leading-8 text-slate-600">
          Where the amount paid is less than the amount
          due, the booking may remain unpaid until the
          outstanding amount is paid or the transaction
          is cancelled.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Third-party services"
      >
        <p className="leading-8 text-slate-600">
          Additional services purchased together with
          or separately from a ticket may have their
          own cancellation and refund policies.
        </p>

        <p className="leading-8 text-slate-600">
          These services may include:
        </p>

        <BulletList
          items={[
            "Shared shuttle or transfer services.",
            "Hotel transfers or private vehicles.",
            "Tours and activities.",
            "Accommodation.",
            "Travel insurance.",
            "Baggage or additional operator services.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Refunds for third-party services are subject
          to the terms of the relevant service provider
          communicated to the customer.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Charges that may be non-refundable"
      >
        <p className="leading-8 text-slate-600">
          Not every charge is automatically deducted
          from a refund. A deduction may only apply
          where the charge has genuinely been incurred,
          is not returned by the relevant party, is
          relevant to the transaction, and has been
          disclosed to the customer.
        </p>

        <p className="leading-8 text-slate-600">
          Charges that may be non-refundable include:
        </p>

        <BulletList
          items={[
            "Cancellation penalties imposed by an operator.",
            "Non-refundable bank charges.",
            "Currency conversion charges.",
            "Disclosed administrative or service charges.",
            "Insurance premiums for active coverage.",
            "Charges for third-party services that have been used or cannot be cancelled.",
            "Payment gateway charges classified by the payment provider as non-refundable.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat will not classify a charge as
          non-refundable where it has in fact been
          returned by the relevant provider.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Calculation of the refund amount"
      >
        <p className="leading-8 text-slate-600">
          The refund amount is determined based on:
        </p>

        <BulletList
          items={[
            "The amount successfully paid.",
            "The travel leg or service being cancelled.",
            "Any portion of the service already used.",
            "The time the cancellation request was submitted.",
            "The operator's policy and fare type.",
            "Any fare difference resulting from a change.",
            "Charges that are genuinely non-refundable.",
            "Any refund or compensation previously provided.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Before a refund is processed, the customer
          will be informed of the result of the review
          and the approved amount where available.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Refund method"
      >
        <p className="leading-8 text-slate-600">
          A refund will be returned through the
          original payment method where that method
          supports refunds.
        </p>

        <p className="leading-8 text-slate-600">
          Depending on the payment method, a refund may
          be processed through the payment gateway, a
          card limit reversal, electronic wallet, bank
          account, or another agreed method.
        </p>

        <p className="leading-8 text-slate-600">
          Where a refund to the original method is
          unavailable, we may request bank account
          details or other required information after
          verifying the customer&apos;s identity.
        </p>

        <p className="leading-8 text-slate-600">
          The account holder or recipient account name
          may be required to match the customer or
          payer name to help prevent fraud.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="Refund processing time"
      >
        <p className="leading-8 text-slate-600">
          The refund review begins after a complete
          request and all required supporting documents
          have been received.
        </p>

        <p className="leading-8 text-slate-600">
          Where operator approval is required, the
          process will continue after the operator
          provides its verification result.
        </p>

        <p className="leading-8 text-slate-600">
          After a refund has been approved and
          submitted to the payment provider, the funds
          generally take approximately 7 to 30 business
          days to be received.
        </p>

        <p className="leading-8 text-slate-600">
          This timeframe is an estimate and may vary
          depending on the bank, payment gateway, card
          issuer, electronic wallet, payment network,
          public holidays, and currency conversion
          process.
        </p>

        <p className="leading-8 text-slate-600">
          We will provide refund status information
          based on data available from the operator and
          payment provider.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="How to request a cancellation or refund"
      >
        <p className="leading-8 text-slate-600">
          A request must be submitted through the Nusa
          Gili Boat contact page or an official
          customer support channel.
        </p>

        <p className="leading-8 text-slate-600">
          The customer must provide:
        </p>

        <BulletList
          items={[
            "Booking code.",
            "Customer or passenger name.",
            "Email address used when making the booking.",
            "Telephone or WhatsApp number.",
            "The journey or travel leg to be cancelled.",
            "Reason for cancellation.",
            "Proof of payment where requested.",
            "Supporting documents where relevant.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          An incomplete request may delay the review
          process.
        </p>

        <p className="leading-8 text-slate-600">
          Submission of a request does not
          automatically mean that a refund has been
          approved. The customer will receive further
          information after the review has been
          completed.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Customer responsibilities"
      >
        <p className="leading-8 text-slate-600">
          Before completing payment, customers must
          review:
        </p>

        <BulletList
          items={[
            "Passenger names and information.",
            "Route and ports.",
            "Travel date and schedule.",
            "Operator and vessel.",
            "Number of passengers.",
            "Price and additional charges.",
            "Email address and contact number.",
            "Applicable cancellation and change policies.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Incorrect information provided by the
          customer may result in change fees, boarding
          refusal, a missed journey, or reduced refund
          eligibility.
        </p>

        <p className="leading-8 text-slate-600">
          The customer is also responsible for
          ensuring that the bank account, card,
          electronic wallet, or other payment method
          used is under their authority.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Chargebacks and payment disputes"
      >
        <p className="leading-8 text-slate-600">
          Customers are encouraged to contact Nusa
          Gili Boat first where there is a payment
          problem or refund request.
        </p>

        <p className="leading-8 text-slate-600">
          An unauthorized chargeback, use of a payment
          method without permission, or submission of
          false information may be investigated
          together with the payment provider and the
          relevant authorities.
        </p>

        <p className="leading-8 text-slate-600">
          While a payment dispute is being reviewed,
          the associated booking or refund may be
          temporarily placed on hold until verification
          is completed.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Allocation of responsibility"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is responsible for processing
          bookings, receiving requests, communicating
          available information, and facilitating
          approved refunds with reasonable care.
        </p>

        <p className="leading-8 text-slate-600">
          The operator is responsible for vessel
          operations, sailing safety, crew, operational
          changes, and the delivery of transportation
          services.
        </p>

        <p className="leading-8 text-slate-600">
          To the extent permitted by law, indirect
          costs such as additional hotel stays, onward
          flights, other transportation, tourism
          activities, or lost business opportunities
          do not automatically form part of a fast boat
          ticket refund.
        </p>

        <p className="leading-8 text-slate-600">
          Nothing in this policy is intended to remove
          consumer rights or liabilities that cannot
          be excluded under the laws of the Republic
          of Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Complaints about refund decisions"
      >
        <p className="leading-8 text-slate-600">
          Where a customer disagrees with the outcome
          of a refund review, the customer may request
          an explanation and should provide the booking
          code and reason for the objection.
        </p>

        <p className="leading-8 text-slate-600">
          We will review the booking information,
          payment evidence, fare conditions, operator
          policy, and previous communications.
        </p>

        <p className="leading-8 text-slate-600">
          We will first attempt to resolve the dispute
          through communication and good-faith
          discussion.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Changes to this policy"
      >
        <p className="leading-8 text-slate-600">
          This policy may be updated to reflect changes
          to our services, operators, payment
          technology, or applicable regulations.
        </p>

        <p className="leading-8 text-slate-600">
          The latest version will be published on this
          page together with the update date.
        </p>

        <p className="leading-8 text-slate-600">
          Unless required by law or agreed with the
          customer, the refund eligibility of a
          booking will refer to the terms in effect
          when the booking was made.
        </p>
      </PolicySection>

      <PolicySection
        number={26}
        title="Contact us"
      >
        <p className="leading-8 text-slate-600">
          Questions, cancellations, changes, and refund
          requests may be submitted through:
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <dl className="space-y-4 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-950">
                Service name
              </dt>

              <dd className="mt-1">
                Nusa Gili Boat
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-950">
                Email
              </dt>

              <dd className="mt-1">
                <a
                  href="mailto:nusagiliboat@gmail.com"
                  className="font-semibold text-sky-700 transition hover:text-sky-900"
                >
                  nusagiliboat@gmail.com
                </a>
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-950">
                Service hours
              </dt>

              <dd className="mt-1">
                Daily, 08:00–20:00 WITA
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Open the contact page
        </Link>
      </PolicySection>

    </PublicInfoPage>
  )
}
