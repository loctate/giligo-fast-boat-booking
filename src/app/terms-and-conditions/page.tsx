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
  path: "/terms-and-conditions",
  title: "Terms and Conditions | Nusa Gili Boat",
  description: "Terms and conditions governing website use, trip searches, bookings, payments, changes, cancellations, and fast boat services booked through Nusa Gili Boat.",
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

export default function TermsAndConditionsPage() {
  return (
    <PublicInfoPage
      locale="en"
      eyebrow="Legal Information"
      title="Terms and Conditions"
      description="These Terms and Conditions govern the use of our website, trip searches, ticket bookings, payments, changes, cancellations, and fast boat services booked through Nusa Gili Boat."
      lastUpdated="June 30, 2026"
    >
      <PolicySection
        number={1}
        title="Agreement to these Terms and Conditions"
      >
        <p className="leading-8 text-slate-600">
          Welcome to Nusa Gili Boat. By accessing,
          browsing, searching for a trip, making a
          booking, completing a payment, or using any
          service available through the Nusa Gili Boat
          website, the user is considered to have read,
          understood, and agreed to these Terms and
          Conditions.
        </p>

        <p className="leading-8 text-slate-600">
          A user who does not agree with any part of
          these terms should not continue using the
          service or make a booking.
        </p>

        <p className="leading-8 text-slate-600">
          A user who makes a booking on behalf of
          another person confirms that they are
          authorized to provide the passenger&apos;s
          information and have communicated the
          applicable travel terms to every passenger
          included in the booking.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="Definitions"
      >
        <p className="leading-8 text-slate-600">
          In these Terms and Conditions, the following
          terms have the meanings described below:
        </p>

        <BulletList
          items={[
            "Nusa Gili Boat is an online platform that provides fast boat trip search and ticket booking services.",
            "User means any person who accesses the website or uses a Nusa Gili Boat service.",
            "Customer means a user who creates or pays for a booking.",
            "Passenger means a person whose name is recorded in a booking to use a transportation service.",
            "Operator means the fast boat transportation provider that operates the journey selected by the customer.",
            "Booking means a travel reservation created through the Nusa Gili Boat system.",
            "Booking code means the unique code used to identify a customer reservation.",
            "Booking confirmation means electronic information containing the details and status of a customer reservation.",
            "E-ticket means an electronic ticket or voucher issued after payment has been completed and the booking has been confirmed.",
            "Journey or trip means a transportation service from a departure port to a destination port.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={3}
        title="Scope of services"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat helps users search for,
          compare, and book fast boat journeys to
          destinations available through the platform.
        </p>

        <p className="leading-8 text-slate-600">
          Destinations may include Bali, Nusa Penida,
          Nusa Lembongan, Nusa Ceningan, Gili
          Trawangan, Gili Air, Gili Meno, Lombok, and
          other inter-island routes subject to operator
          availability.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat acts as a booking intermediary
          between the customer and the operator. Sea
          transportation, vessels, crew, sailing
          safety, check-in, boarding, and the operation
          of the journey are provided by the relevant
          operator.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="User eligibility and requirements"
      >
        <p className="leading-8 text-slate-600">
          The person making a booking must be at least
          18 years old and have the legal authority to
          complete the transaction.
        </p>

        <p className="leading-8 text-slate-600">
          A booking for a child or infant must be made
          by a parent, legal guardian, or responsible
          adult accompanying or responsible for the
          journey.
        </p>

        <p className="leading-8 text-slate-600">
          Users must provide information that is
          accurate, complete, current, and capable of
          being verified.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Booking process"
      >
        <p className="leading-8 text-slate-600">
          Customers must select the route, date,
          schedule, operator, number of passengers, and
          travel details before entering customer and
          passenger information.
        </p>

        <p className="leading-8 text-slate-600">
          Before submitting a booking, customers must
          carefully review all information displayed on
          the checkout page.
        </p>

        <p className="leading-8 text-slate-600">
          After a booking is successfully created, the
          system will issue a booking code and display
          a confirmation page containing the
          reservation details and status.
        </p>

        <p className="leading-8 text-slate-600">
          A booking is not considered paid or confirmed
          merely because a booking code has been
          issued. Customers must check both the payment
          status and booking status.
        </p>
      </PolicySection>

      <PolicySection
        number={6}
        title="Seat availability"
      >
        <p className="leading-8 text-slate-600">
          Search results are based on schedule,
          inventory, and seat availability information
          recorded in the system at the time of the
          search.
        </p>

        <p className="leading-8 text-slate-600">
          Seat availability may change before a booking
          is successfully processed. Selecting a
          journey from the search results does not by
          itself guarantee that a seat has been
          reserved.
        </p>

        <p className="leading-8 text-slate-600">
          Bookings may only be made for travel dates
          that satisfy the minimum advance-booking
          period configured in the Nusa Gili Boat
          system.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Prices and additional charges"
      >
        <p className="leading-8 text-slate-600">
          The displayed price applies when the booking
          is created and may change before payment is
          successfully completed.
        </p>

        <p className="leading-8 text-slate-600">
          Prices on the website are displayed in
          Indonesian Rupiah unless clearly stated
          otherwise.
        </p>

        <p className="leading-8 text-slate-600">
          The price may include the fast boat ticket
          and any tax or other charge clearly listed in
          the payment breakdown.
        </p>

        <p className="leading-8 text-slate-600">
          Depending on the route and operator, the
          ticket price may not include:
        </p>

        <BulletList
          items={[
            "Port fees.",
            "Local government charges.",
            "Tourism area entrance fees.",
            "Conservation fees or government levies.",
            "Hotel transportation or shuttle services.",
            "Excess baggage or special-item charges.",
            "Additional services not included in the trip details.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Local charges not included in the online
          price may be collected by the operator, port,
          destination manager, or relevant authority.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="Payment"
      >
        <p className="leading-8 text-slate-600">
          Payment must be completed using one of the
          methods available on the payment page.
        </p>

        <p className="leading-8 text-slate-600">
          Online payments may be processed by a payment
          gateway provider, bank, virtual account,
          electronic wallet, QRIS, payment card
          provider, or another payment service
          provider.
        </p>

        <p className="leading-8 text-slate-600">
          The official status received from the payment
          provider will be used to determine whether a
          transaction is successful, pending, expired,
          cancelled, rejected, or refunded.
        </p>

        <p className="leading-8 text-slate-600">
          A booking that is not paid before the payment
          deadline may expire. Any seat previously
          allocated may be released without further
          notice.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat does not request a PIN, CVV,
          banking password, or OTP code through email,
          WhatsApp, or customer support.
        </p>
      </PolicySection>

      <PolicySection
        number={9}
        title="Booking confirmation and e-tickets"
      >
        <p className="leading-8 text-slate-600">
          A booking is confirmed after successful
          payment has been received and the booking
          status has been updated to confirmed by the
          system or the Nusa Gili Boat team.
        </p>

        <p className="leading-8 text-slate-600">
          After payment has been completed and the
          booking has been confirmed, the customer will
          receive a booking confirmation containing
          the booking code and travel information.
        </p>

        <p className="leading-8 text-slate-600">
          After the e-ticket feature is activated for
          the Nusa Gili Boat service, the system will
          also automatically issue an e-ticket or
          electronic voucher.
        </p>

        <p className="leading-8 text-slate-600">
          The e-ticket will be sent to the email
          address used when making the booking and may
          also be available through the booking details
          page.
        </p>

        <p className="leading-8 text-slate-600">
          Customers are responsible for checking the
          booking code, passenger names, route, date,
          operator, schedule, number of passengers,
          payment status, and all other information
          included in the confirmation or e-ticket.
        </p>

        <p className="leading-8 text-slate-600">
          If the customer identifies an error or
          discrepancy, the customer must contact
          customer support immediately after becoming
          aware of it and before the departure time.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Passenger responsibilities and check-in"
      >
        <p className="leading-8 text-slate-600">
          Passengers must comply with the check-in time
          specified by the operator or shown in the
          travel confirmation or e-ticket.
        </p>

        <p className="leading-8 text-slate-600">
          As a general guideline, passengers should
          arrive at the check-in location at least 60
          minutes before departure unless the operator
          provides different instructions.
        </p>

        <BulletList
          items={[
            "Bring the identification and travel documents required for the journey.",
            "Bring the booking confirmation or e-ticket if one has been issued.",
            "Follow the applicable check-in and boarding procedures.",
            "Comply with port rules.",
            "Follow safety instructions provided by the operator and vessel crew.",
            "Ensure that the provided contact information can receive travel updates.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={11}
        title="Travel schedules"
      >
        <p className="leading-8 text-slate-600">
          Departure times, arrival times, and journey
          durations are estimates based on the
          available schedule.
        </p>

        <p className="leading-8 text-slate-600">
          An operator may change the time, vessel,
          route, port, check-in location, or travel
          arrangements due to:
        </p>

        <BulletList
          items={[
            "Weather and sea conditions.",
            "Tidal conditions.",
            "Port congestion or closure.",
            "Technical disruption or inspection.",
            "Safety considerations.",
            "Capacity and operational requirements.",
            "Instructions from the government or port authorities.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat will make reasonable efforts
          to communicate updates received from the
          operator using the customer&apos;s contact
          information.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Delays and onward travel arrangements"
      >
        <p className="leading-8 text-slate-600">
          Sea transportation may be delayed due to
          weather, sea conditions, port conditions,
          technical issues, safety considerations, or
          operational circumstances.
        </p>

        <p className="leading-8 text-slate-600">
          Customers should allow sufficient time before
          a flight, hotel check-in, tour, meeting, or
          onward transportation connection.
        </p>

        <p className="leading-8 text-slate-600">
          To the extent permitted by law, indirect
          costs arising from an operator schedule
          change, including onward tickets, hotel
          costs, personal arrangements, or lost
          business opportunities, do not automatically
          become the responsibility of Nusa Gili Boat.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Changes and cancellations requested by customers"
      >
        <p className="leading-8 text-slate-600">
          Requests to change a passenger name, travel
          date, schedule, route, passenger details, or
          to cancel a booking must be submitted through
          an official customer support channel.
        </p>

        <p className="leading-8 text-slate-600">
          Approval of a change depends on operator
          policy, fare conditions, seat availability,
          payment status, and when the request is
          submitted.
        </p>

        <p className="leading-8 text-slate-600">
          Fare differences, operator penalties,
          administrative charges, or processing fees
          may apply where they have been disclosed and
          are relevant to the request.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Refund and Cancellation Policy
        </Link>
      </PolicySection>

      <PolicySection
        number={14}
        title="Cancellations by an operator"
      >
        <p className="leading-8 text-slate-600">
          An operator may cancel a journey because of
          severe weather, unsafe sea conditions,
          technical problems, operational reasons,
          port closure, instructions from an authority,
          or force majeure.
        </p>

        <p className="leading-8 text-slate-600">
          When a journey is cancelled by an operator,
          the available alternatives may include:
        </p>

        <BulletList
          items={[
            "Transfer to another schedule.",
            "Transfer to another operator with the customer's approval.",
            "Travel credit where agreed.",
            "A refund for the affected journey in accordance with the applicable policy.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Alternative travel arrangements remain
          subject to seat availability and operational
          conditions.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Failure to attend or no-show"
      >
        <p className="leading-8 text-slate-600">
          A passenger may be considered a no-show when
          the passenger:
        </p>

        <BulletList
          items={[
            "Does not attend at the required check-in time.",
            "Arrives after boarding has closed.",
            "Is not present at the designated departure point.",
            "Does not bring the required identification or documents.",
            "Does not satisfy the applicable travel requirements.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          A no-show booking is generally not eligible
          for a refund or rescheduling unless the
          operator decides otherwise.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Round-trip bookings"
      >
        <p className="leading-8 text-slate-600">
          A round-trip booking consists of an outbound
          journey and a return journey that are treated
          as two separate journeys.
        </p>

        <p className="leading-8 text-slate-600">
          Each journey may have a different operator,
          vessel, price, schedule, change conditions,
          and cancellation policy.
        </p>

        <p className="leading-8 text-slate-600">
          The cancellation or change of one journey
          does not automatically cancel the other
          journey unless this has been approved and
          confirmed.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Baggage"
      >
        <p className="leading-8 text-slate-600">
          Permitted baggage quantity, weight, size, and
          type are subject to the operator&apos;s
          conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Surfboards, bicycles, diving equipment,
          sporting equipment, animals, or oversized
          items may require prior approval and an
          additional charge.
        </p>

        <p className="leading-8 text-slate-600">
          Dangerous, flammable, explosive, illegal, or
          potentially unsafe items must not be carried.
        </p>

        <p className="leading-8 text-slate-600">
          Passengers are responsible for safeguarding
          money, documents, electronic devices,
          medication, jewelry, and other valuables.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Health and safety"
      >
        <p className="leading-8 text-slate-600">
          Fast boat travel may involve vessel movement,
          waves, boarding and disembarking procedures,
          and facilities that differ from land
          transportation.
        </p>

        <p className="leading-8 text-slate-600">
          Passengers who are pregnant, have a heart
          condition, back problem, limited mobility,
          another medical condition, or require special
          assistance should obtain medical advice and
          contact us before making a booking.
        </p>

        <p className="leading-8 text-slate-600">
          An operator may impose travel restrictions
          based on safety conditions, vessel
          facilities, sea conditions, and medical
          recommendations.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="Children and infants"
      >
        <p className="leading-8 text-slate-600">
          Children and infants must be accompanied by a
          responsible adult during check-in, boarding,
          and the journey.
        </p>

        <p className="leading-8 text-slate-600">
          Age categories, fares, seating, documents,
          and other requirements for children or
          infants are subject to the conditions of the
          selected operator.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="Travel documents"
      >
        <p className="leading-8 text-slate-600">
          Passengers are responsible for possessing
          the identification, passport, visa, travel
          authorization, ticket, or other documents
          required for the journey.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is not responsible for a
          check-in or boarding refusal caused by
          incomplete, incorrect, or invalid passenger
          documentation.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Travel insurance"
      >
        <p className="leading-8 text-slate-600">
          Customers are encouraged to obtain travel
          insurance appropriate to their travel needs
          and risks.
        </p>

        <p className="leading-8 text-slate-600">
          Depending on the policy selected by the
          customer, coverage may include accidents,
          medical expenses, trip cancellation, baggage
          loss, delays, and emergency evacuation.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Force majeure"
      >
        <p className="leading-8 text-slate-600">
          Force majeure means an event beyond
          reasonable control that prevents or disrupts
          the delivery of a service as planned.
        </p>

        <BulletList
          items={[
            "Extreme weather and dangerous sea conditions.",
            "Earthquakes, tsunamis, volcanic eruptions, or other natural disasters.",
            "Outbreaks, pandemics, or public health emergencies.",
            "War, terrorism, civil unrest, or security disruption.",
            "Strikes or disruption to public services.",
            "Port closures or government restrictions.",
            "Major technical failures affecting systems or infrastructure.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          The resolution of an affected booking will
          take into account the actual circumstances,
          operator policy, payment method, and
          applicable law.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Allocation of responsibility"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat is responsible for the
          booking services within our control,
          including processing booking data, presenting
          information, and providing customer
          assistance with reasonable care.
        </p>

        <p className="leading-8 text-slate-600">
          The operator is responsible for vessel
          operations, crew, transportation services,
          sailing safety, baggage accepted by the
          operator, and its operational decisions and
          actions.
        </p>

        <p className="leading-8 text-slate-600">
          Complaints regarding the operation of the
          transportation service may be referred to the
          relevant operator. Nusa Gili Boat may assist
          with communication and complaint handling
          based on the available information.
        </p>

        <p className="leading-8 text-slate-600">
          Nothing in these Terms and Conditions is
          intended to remove consumer rights or
          liabilities that cannot be excluded under
          the laws of the Republic of Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Accuracy of information"
      >
        <p className="leading-8 text-slate-600">
          We aim to display route, schedule, price,
          operator, vessel, and seat availability
          information accurately.
        </p>

        <p className="leading-8 text-slate-600">
          This information may change because of
          operator updates, inventory changes,
          operational requirements, or technical
          errors.
        </p>

        <p className="leading-8 text-slate-600">
          If an error is identified that materially
          affects a booking, we will contact the
          customer to offer an appropriate correction
          or resolution.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Website availability"
      >
        <p className="leading-8 text-slate-600">
          We aim to keep the website and services
          available but do not guarantee uninterrupted
          access at all times.
        </p>

        <p className="leading-8 text-slate-600">
          Temporary disruption may occur because of
          maintenance, software updates, network
          disruption, server problems, security
          incidents, or other circumstances beyond our
          control.
        </p>
      </PolicySection>

      <PolicySection
        number={26}
        title="Intellectual property"
      >
        <p className="leading-8 text-slate-600">
          The Nusa Gili Boat logo, name, text, design,
          illustrations, visual presentation, software
          code, and original content are protected
          under applicable intellectual property laws.
        </p>

        <p className="leading-8 text-slate-600">
          Content owned by an operator, photographer,
          service provider, or another party remains
          the property of its respective owner.
        </p>

        <p className="leading-8 text-slate-600">
          Users must not copy, sell, modify, or use
          content commercially without permission.
        </p>
      </PolicySection>

      <PolicySection
        number={27}
        title="User conduct"
      >
        <p className="leading-8 text-slate-600">
          Users must not:
        </p>

        <BulletList
          items={[
            "Submit false information or fraudulent bookings.",
            "Carry out fraudulent or unauthorized transactions.",
            "Access systems without authorization.",
            "Disrupt the security or operation of the website.",
            "Use malicious software or automation that harms the service.",
            "Use the website for activities that violate the law.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          We may reject a booking, restrict access,
          hold a transaction for review, or report
          suspected unlawful activity to the relevant
          parties or authorities.
        </p>
      </PolicySection>

      <PolicySection
        number={28}
        title="Personal data protection"
      >
        <p className="leading-8 text-slate-600">
          Customer and passenger data will be processed
          to provide bookings, payments, customer
          service, travel communications, e-ticket
          issuance, fraud prevention, and compliance
          with legal obligations.
        </p>

        <p className="leading-8 text-slate-600">
          More information about the data we collect,
          its purposes, data sharing, retention,
          security, and user rights is available in our
          Privacy Policy.
        </p>

        <Link
          href="/privacy-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Privacy Policy
        </Link>
      </PolicySection>

      <PolicySection
        number={29}
        title="Refunds"
      >
        <p className="leading-8 text-slate-600">
          Refund eligibility and the refund amount
          depend on the reason for cancellation, when
          the request is submitted, payment status,
          affected journey, operator policy, and fare
          conditions.
        </p>

        <p className="leading-8 text-slate-600">
          Refund processing times may vary depending on
          operator verification, the payment gateway,
          bank, electronic wallet, and payment method.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Refund and Cancellation Policy
        </Link>
      </PolicySection>

      <PolicySection
        number={30}
        title="Complaints and dispute resolution"
      >
        <p className="leading-8 text-slate-600">
          Customers may submit a complaint through an
          official contact channel and should include
          the booking code, booking email address, a
          description of the circumstances, and
          supporting evidence.
        </p>

        <p className="leading-8 text-slate-600">
          We will first attempt to resolve a dispute
          through communication and good-faith
          discussion with the customer and relevant
          operator.
        </p>

        <p className="leading-8 text-slate-600">
          If the matter cannot be resolved through
          discussion, the parties may use a dispute
          resolution mechanism available under the
          laws of the Republic of Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={31}
        title="Governing law and language"
      >
        <p className="leading-8 text-slate-600">
          These Terms and Conditions are governed by
          and interpreted in accordance with the laws
          of the Republic of Indonesia.
        </p>

        <p className="leading-8 text-slate-600">
          This document was originally prepared in
          Bahasa Indonesia. An English or other
          language translation may be provided for the
          convenience of customers.
        </p>

        <p className="leading-8 text-slate-600">
          If there is any difference in interpretation,
          the Bahasa Indonesia version will prevail to
          the extent permitted by law.
        </p>
      </PolicySection>

      <PolicySection
        number={32}
        title="Changes to these Terms and Conditions"
      >
        <p className="leading-8 text-slate-600">
          We may update these Terms and Conditions to
          reflect changes to our services, technology,
          operators, payment methods, or legal
          requirements.
        </p>

        <p className="leading-8 text-slate-600">
          The latest version and its update date will
          be published on this page.
        </p>

        <p className="leading-8 text-slate-600">
          Unless required by law, security
          considerations, or exceptional circumstances,
          the rights and obligations relating to an
          existing booking will refer to the terms in
          effect when the booking was made.
        </p>
      </PolicySection>

      <PolicySection
        number={33}
        title="Contact us"
      >
        <p className="leading-8 text-slate-600">
          Questions regarding these Terms and
          Conditions, bookings, payments, e-tickets,
          travel changes, or complaints may be
          submitted through our contact page.
        </p>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Contact Nusa Gili Boat
        </Link>
      </PolicySection>

    </PublicInfoPage>
  )
}
