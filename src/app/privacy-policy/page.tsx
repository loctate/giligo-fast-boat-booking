import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title:
    "Privacy Policy | Nusa Gili Boat",
  description:
    "Learn how Nusa Gili Boat collects, uses, stores, protects, and shares personal information when customers search for trips, make bookings, and complete payments.",
}

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal Information"
      title="Privacy Policy"
      description="This Privacy Policy explains how Nusa Gili Boat collects, uses, stores, protects, and shares personal information when you use our website and booking services."
      lastUpdated="28 June 2026"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          1. Introduction
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat respects your privacy and is
          committed to handling personal information
          responsibly.
        </p>

        <p className="leading-8 text-slate-600">
          This policy applies when you visit our website,
          search for available trips, submit a booking,
          make a payment, contact customer support, or
          otherwise use our services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          2. Information we collect
        </h2>

        <p className="leading-8 text-slate-600">
          Depending on how you use our service, we may
          collect the following information:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>
            Customer name, email address, telephone
            number, and WhatsApp number
          </li>

          <li>
            Passenger names, passenger categories, and
            other information required for travel
          </li>

          <li>
            Selected route, travel date, departure time,
            return date, operator, vessel, and passenger
            count
          </li>

          <li>
            Booking code, booking status, payment status,
            transaction reference, and payment method
          </li>

          <li>
            Communications submitted through email,
            WhatsApp, customer support, or other contact
            channels
          </li>

          <li>
            Technical information such as IP address,
            browser type, device information, access
            time, referring page, and website activity
          </li>

          <li>
            Other information voluntarily provided when
            requesting assistance or completing a
            booking
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          3. How information is collected
        </h2>

        <p className="leading-8 text-slate-600">
          We may collect information directly from you
          when you complete a booking form, contact us,
          make a payment, or submit information through
          the website.
        </p>

        <p className="leading-8 text-slate-600">
          Certain technical information may also be
          collected automatically through server logs,
          cookies, browser storage, security tools, and
          similar technologies.
        </p>

        <p className="leading-8 text-slate-600">
          We may also receive transaction status,
          payment references, or verification
          information from our authorized payment
          service provider.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          4. How we use personal information
        </h2>

        <p className="leading-8 text-slate-600">
          We may use personal information for the
          following purposes:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>
            To create, process, confirm, and manage
            bookings
          </li>

          <li>
            To reserve seats with the selected fast boat
            operator
          </li>

          <li>
            To process and verify payment transactions
          </li>

          <li>
            To send booking confirmations, payment
            updates, schedule information, and service
            notifications
          </li>

          <li>
            To respond to questions, complaints,
            cancellation requests, and refund requests
          </li>

          <li>
            To prevent fraud, unauthorized transactions,
            abuse, and security incidents
          </li>

          <li>
            To improve our website, booking process,
            customer support, and operational procedures
          </li>

          <li>
            To comply with legal, tax, accounting,
            regulatory, safety, and law-enforcement
            requirements
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          5. Booking and operator information
        </h2>

        <p className="leading-8 text-slate-600">
          Information required to provide transportation
          services may be shared with the fast boat
          operator selected during the booking process.
        </p>

        <p className="leading-8 text-slate-600">
          This may include passenger names, passenger
          count, booking reference, travel date, route,
          contact information, and other information
          reasonably required to manage check-in and
          boarding.
        </p>

        <p className="leading-8 text-slate-600">
          Boat operators may have their own privacy
          procedures and legal responsibilities when
          handling passenger information.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          6. Payment processing
        </h2>

        <p className="leading-8 text-slate-600">
          Online payments may be processed by an
          authorized third-party payment gateway such as
          Midtrans.
        </p>

        <p className="leading-8 text-slate-600">
          Payment information submitted through the
          payment interface is processed according to
          the payment provider&apos;s security and
          privacy procedures.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat may receive transaction
          information such as the payment status,
          payment method, transaction identifier,
          transaction time, and amount paid.
        </p>

        <p className="leading-8 text-slate-600">
          We do not intend to directly store complete
          payment card numbers, card security codes,
          online banking passwords, or one-time
          passwords.
        </p>

        <a
          href="https://midtrans.com/id/pemberitahuan-privasi"
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Midtrans Privacy Notice
        </a>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          7. Sharing of information
        </h2>

        <p className="leading-8 text-slate-600">
          We may share personal information only when
          reasonably necessary with:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>
            Fast boat operators involved in the selected
            journey
          </li>

          <li>
            Payment gateways, banks, and payment service
            providers
          </li>

          <li>
            Hosting, database, email, security,
            analytics, and technical service providers
          </li>

          <li>
            Professional advisers such as accountants,
            auditors, or legal advisers
          </li>

          <li>
            Government agencies, regulators, courts, or
            law-enforcement authorities when legally
            required
          </li>

          <li>
            Other parties when you have provided
            authorization or consent
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          We do not sell customer personal information
          as a commercial database.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          8. Legal grounds for processing
        </h2>

        <p className="leading-8 text-slate-600">
          Personal information may be processed when it
          is necessary to provide the booking service,
          perform an agreement with the customer, comply
          with legal obligations, protect legitimate
          business and security interests, or respond to
          a request made by the customer.
        </p>

        <p className="leading-8 text-slate-600">
          Where consent is required, you may withdraw
          that consent subject to applicable legal,
          contractual, and operational requirements.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          9. Data storage and retention
        </h2>

        <p className="leading-8 text-slate-600">
          Personal information may be stored in systems
          used to operate our website, booking database,
          payment records, customer support, accounting,
          security, and backups.
        </p>

        <p className="leading-8 text-slate-600">
          We retain information only for as long as
          reasonably necessary for booking operations,
          dispute handling, fraud prevention, accounting,
          tax, legal compliance, and other legitimate
          business purposes.
        </p>

        <p className="leading-8 text-slate-600">
          Retention periods may differ depending on the
          type of information and the purpose for which
          it was collected.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          10. Data security
        </h2>

        <p className="leading-8 text-slate-600">
          We use reasonable administrative, technical,
          and organizational safeguards intended to
          protect personal information from unauthorized
          access, alteration, disclosure, loss, misuse,
          and destruction.
        </p>

        <p className="leading-8 text-slate-600">
          These measures may include access controls,
          encrypted connections, restricted server
          access, authentication controls, system
          monitoring, backups, and security updates.
        </p>

        <p className="leading-8 text-slate-600">
          No internet transmission or storage system can
          be guaranteed to be completely secure.
          Customers should protect their booking code,
          email account, devices, and other account
          information.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          11. Cookies and browser storage
        </h2>

        <p className="leading-8 text-slate-600">
          Our website may use cookies, session storage,
          local storage, and similar technologies to
          support navigation, preserve temporary booking
          information, improve performance, and protect
          the service.
        </p>

        <p className="leading-8 text-slate-600">
          Browser settings may allow you to restrict or
          delete cookies and stored website data.
          Disabling certain technologies may affect some
          website functions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          12. Your rights
        </h2>

        <p className="leading-8 text-slate-600">
          Subject to applicable law and verification of
          your identity, you may request:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          <li>
            Information about how your personal data is
            processed
          </li>

          <li>
            Access to personal information associated
            with your booking
          </li>

          <li>
            Correction of inaccurate or incomplete
            information
          </li>

          <li>
            Deletion or restriction of information when
            legally applicable
          </li>

          <li>
            Withdrawal of consent when processing is
            based on consent
          </li>

          <li>
            Submission of a complaint regarding the
            handling of personal information
          </li>
        </ul>

        <p className="leading-8 text-slate-600">
          Certain information may need to be retained
          when required for legal compliance, accounting,
          fraud prevention, disputes, or the performance
          of an existing booking.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          13. Children&apos;s information
        </h2>

        <p className="leading-8 text-slate-600">
          Passenger information relating to a child
          should be submitted only by the child&apos;s
          parent, guardian, or another adult authorized
          to arrange the child&apos;s travel.
        </p>

        <p className="leading-8 text-slate-600">
          By submitting a child passenger&apos;s
          information, the customer confirms that they
          are authorized to provide that information for
          booking and transportation purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          14. Third-party websites
        </h2>

        <p className="leading-8 text-slate-600">
          Our website may contain links to payment
          providers, operators, maps, social media, or
          other third-party websites.
        </p>

        <p className="leading-8 text-slate-600">
          Their privacy practices are governed by their
          own policies. Nusa Gili Boat is not responsible
          for the content or privacy practices of
          independent third-party websites.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          15. Changes to this policy
        </h2>

        <p className="leading-8 text-slate-600">
          We may update this Privacy Policy when our
          services, technology, payment providers,
          business procedures, or legal obligations
          change.
        </p>

        <p className="leading-8 text-slate-600">
          The updated version will be published on this
          page together with the latest revision date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          16. Contact us
        </h2>

        <p className="leading-8 text-slate-600">
          Questions, correction requests, access
          requests, or privacy complaints may be
          submitted through our contact page.
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
          Policy details are being finalized
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          The official business identity, privacy
          contact, operating address, data retention
          schedule, analytics tools, and final payment
          provider information will be updated before
          production payments are activated.
        </p>
      </aside>
    </PublicInfoPage>
  )
}