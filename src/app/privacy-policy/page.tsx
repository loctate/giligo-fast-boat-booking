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
  path: "/privacy-policy",
  title: "Privacy Policy | Nusa Gili Boat",
  description: "The Nusa Gili Boat Privacy Policy explains how we collect, use, store, share, and protect the personal data of customers and passengers.",
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

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage
      locale="en"
      eyebrow="Personal Data Protection"
      title="Privacy Policy"
      description="This Privacy Policy explains how Nusa Gili Boat obtains, collects, uses, stores, shares, and protects personal data when you use our website and booking services."
      lastUpdated="June 30, 2026"
    >
      <PolicySection
        number={1}
        title="Introduction"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat respects the privacy of our
          customers, passengers, and every user of our
          website. We are committed to processing
          personal data responsibly, transparently,
          securely, and in accordance with applicable
          law.
        </p>

        <p className="leading-8 text-slate-600">
          This Privacy Policy applies when you visit
          our website, search for a journey, make a
          booking, complete a payment, retrieve a
          booking, contact customer support, or use
          another service provided by Nusa Gili Boat.
        </p>

        <p className="leading-8 text-slate-600">
          By using our services, you acknowledge that
          you have received and read this Privacy
          Policy. Where consent is required for a
          specific processing activity, we will request
          that consent separately where necessary.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="Data controller"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat acts as the party that
          determines the purposes and methods of
          processing personal data in connection with
          the operation of our website and booking
          services.
        </p>

        <p className="leading-8 text-slate-600">
          In connection with travel and payment
          services, fast boat operators and payment
          providers may act as data controllers or data
          processors according to their respective
          roles, services, and policies.
        </p>

        <p className="leading-8 text-slate-600">
          Questions or requests relating to personal
          data may be submitted using the contact
          information provided at the end of this
          Privacy Policy.
        </p>
      </PolicySection>

      <PolicySection
        number={3}
        title="Personal data we collect"
      >
        <p className="leading-8 text-slate-600">
          The types of data we collect depend on how
          you use our services. This data may include:
        </p>

        <h3 className="text-lg font-semibold text-slate-950">
          A. Customer information
        </h3>

        <BulletList
          items={[
            "Full name.",
            "Email address.",
            "Telephone or WhatsApp number.",
            "Nationality where required.",
            "Other contact information provided voluntarily.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          B. Passenger information
        </h3>

        <BulletList
          items={[
            "Passenger names.",
            "Passenger category, such as adult, child, or infant.",
            "Number of passengers.",
            "Nationality or identification information where required by an operator.",
            "Information about special assistance requirements provided voluntarily.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          C. Booking and travel information
        </h3>

        <BulletList
          items={[
            "Booking code.",
            "Travel route and date.",
            "Departure and destination ports.",
            "Departure and arrival schedule.",
            "Selected operator and vessel.",
            "One-way or round-trip journey.",
            "Number of seats and travel price.",
            "Booking, change, cancellation, and refund status.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          D. Payment information
        </h3>

        <BulletList
          items={[
            "Reference number or transaction ID.",
            "Order ID issued by the payment provider.",
            "Transaction amount.",
            "Payment method.",
            "Payment status.",
            "Transaction time.",
            "Refund or payment cancellation information.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          E. Technical information
        </h3>

        <BulletList
          items={[
            "IP address.",
            "Browser type and version.",
            "Operating system.",
            "Device type.",
            "Access date and time.",
            "Pages visited.",
            "Referring website or page.",
            "Log data, system errors, and security activity.",
            "Cookies, session storage, and similar technologies.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          F. Communications and customer support
        </h3>

        <BulletList
          items={[
            "Email and WhatsApp messages.",
            "Change or cancellation requests.",
            "Complaints and descriptions of events.",
            "Documents or evidence provided to handle a request.",
            "Customer preferences relating to marketing communications.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Please do not send a PIN, CVV, banking
          password, OTP code, or other confidential
          financial information through email,
          WhatsApp, or a customer support form.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="Sources of personal data"
      >
        <p className="leading-8 text-slate-600">
          We may obtain personal data:
        </p>

        <BulletList
          items={[
            "Directly from customers when they search for a journey, make a booking, or contact us.",
            "From a person making a booking on behalf of another passenger.",
            "From the fast boat operator responsible for the journey.",
            "From a payment gateway, bank, or payment method provider.",
            "From technical systems, server logs, cookies, and security tools.",
            "From service providers that support our website and booking operations.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          A customer who provides another
          passenger&apos;s data must ensure that the
          data is provided for a lawful travel purpose
          and that the passenger has received the
          necessary information about how their data
          will be processed.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Purposes for which we use data"
      >
        <p className="leading-8 text-slate-600">
          We may use personal data to:
        </p>

        <BulletList
          items={[
            "Display and process travel options.",
            "Create, manage, and confirm bookings.",
            "Allocate seats on a selected journey.",
            "Provide necessary information to a fast boat operator.",
            "Process and verify payments.",
            "Issue and send booking confirmations.",
            "Issue and send e-tickets when that feature becomes available.",
            "Provide check-in and departure information.",
            "Communicate schedule changes, delays, or cancellations.",
            "Process booking changes, complaints, and refunds.",
            "Provide customer support.",
            "Detect and prevent fraud or misuse.",
            "Protect the security of the website, server, database, and transactions.",
            "Analyze and improve website performance and user experience.",
            "Comply with accounting, tax, legal, and regulatory obligations.",
            "Handle claims, disputes, audits, or inspections.",
            "Send marketing communications where the customer has chosen to receive them.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={6}
        title="Legal bases for processing"
      >
        <p className="leading-8 text-slate-600">
          Depending on the circumstances, personal
          data may be processed on the basis of:
        </p>

        <BulletList
          items={[
            "Performance of a contract or action requested by a customer to create and fulfill a booking.",
            "Customer consent for specific processing, such as marketing communications.",
            "Compliance with legal and regulatory obligations.",
            "Protection of the vital interests of a customer or passenger in certain circumstances.",
            "Legitimate interests relating to security, fraud prevention, service management, and system improvement, provided those interests do not override user rights.",
            "Another legal basis permitted under applicable laws and regulations.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Where processing is based on consent, a user
          may withdraw that consent in accordance with
          applicable law. Withdrawal of consent does
          not affect the lawfulness of processing
          completed before the withdrawal.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Sharing data with fast boat operators"
      >
        <p className="leading-8 text-slate-600">
          We may provide necessary information to the
          operator responsible for the journey selected
          by the customer.
        </p>

        <p className="leading-8 text-slate-600">
          This information may include:
        </p>

        <BulletList
          items={[
            "Customer and passenger names.",
            "Contact number.",
            "Booking code or reference.",
            "Number and category of passengers.",
            "Travel route, schedule, and date.",
            "Information required for check-in and boarding.",
            "Relevant special assistance information provided by the customer.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          The operator may process this data for
          transportation, safety, passenger manifest,
          check-in, and applicable legal purposes.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="Payment processing"
      >
        <p className="leading-8 text-slate-600">
          Online payments may be processed through
          Midtrans or another payment provider
          displayed on the payment page.
        </p>

        <p className="leading-8 text-slate-600">
          A payment provider may collect and process
          the data required to verify, authorize,
          complete, cancel, or refund a transaction.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat may receive transaction
          information such as the order ID,
          transaction ID, payment method, payment
          amount, transaction status, payment time,
          and refund status.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat does not intend to store
          complete payment card numbers, CVV codes,
          PINs, banking passwords, or OTP codes. That
          sensitive information is processed through
          the relevant payment provider&apos;s system.
        </p>

        <a
          href="https://midtrans.com/id/pemberitahuan-privasi"
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Read the Midtrans Privacy Notice
        </a>
      </PolicySection>

      <PolicySection
        number={9}
        title="Other parties that may receive data"
      >
        <p className="leading-8 text-slate-600">
          Where necessary to operate our services, we
          may share data with:
        </p>

        <BulletList
          items={[
            "Hosting, server, cloud, database, and data storage providers.",
            "Email, notification, and customer communication providers.",
            "Security, monitoring, and fraud prevention providers.",
            "Analytics and website performance measurement providers.",
            "Accounting, audit, tax, or professional service providers.",
            "Banks, payment gateways, and payment service providers.",
            "Government agencies, regulators, courts, or law enforcement authorities where required.",
            "Other parties acting on the user's instructions or with the user's consent.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          We aim to provide only the data that is
          relevant and necessary for the purpose of
          the recipient&apos;s service.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Sale of personal data"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat does not sell or rent
          customer personal data as a commercial
          database to another party.
        </p>

        <p className="leading-8 text-slate-600">
          Data is shared with operators, payment
          providers, and technical service providers
          to deliver services or fulfill lawful
          obligations, not for the purpose of selling
          personal data.
        </p>
      </PolicySection>

      <PolicySection
        number={11}
        title="Cookies and browser storage"
      >
        <p className="leading-8 text-slate-600">
          Our website may use cookies, session
          storage, local storage, and similar
          technologies to:
        </p>

        <BulletList
          items={[
            "Maintain website navigation and user sessions.",
            "Temporarily store booking information.",
            "Help customers access a confirmation page.",
            "Maintain security and prevent misuse.",
            "Remember certain choices or preferences.",
            "Measure website performance and usage.",
            "Detect and resolve technical errors.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Users may delete or restrict cookies through
          their browser settings. Some website
          functions may not operate properly when
          these technologies are disabled.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Analytics and marketing communications"
      >
        <p className="leading-8 text-slate-600">
          We may use website usage information to
          understand page performance, improve the
          booking process, and enhance the user
          experience.
        </p>

        <p className="leading-8 text-slate-600">
          If a third-party analytics tool is used,
          information about that tool will be added to
          this Privacy Policy or the relevant cookie
          notice.
        </p>

        <p className="leading-8 text-slate-600">
          Promotional communications, ticket offers,
          destination information, and newsletters
          will only be sent based on customer choice
          or consent where required.
        </p>

        <p className="leading-8 text-slate-600">
          Customers may stop receiving promotional
          communications using an unsubscribe link or
          by contacting us. Important booking and
          travel messages may still be sent where
          necessary to provide the service.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Accuracy of data"
      >
        <p className="leading-8 text-slate-600">
          Customers are responsible for providing
          accurate, complete, and current information.
        </p>

        <p className="leading-8 text-slate-600">
          Incorrect information may result in failed
          communication, an incorrect e-ticket,
          check-in difficulties, boarding refusal, or
          problems with a refund.
        </p>

        <p className="leading-8 text-slate-600">
          Customers should contact us immediately if
          they identify an error in booking or
          passenger information.
        </p>
      </PolicySection>

      <PolicySection
        number={14}
        title="Storage and retention periods"
      >
        <p className="leading-8 text-slate-600">
          Data may be stored in booking systems,
          databases, servers, backups, payment
          systems, emails, and customer support
          records.
        </p>

        <p className="leading-8 text-slate-600">
          We retain data only for as long as necessary
          to:
        </p>

        <BulletList
          items={[
            "Complete and provide evidence of booking transactions.",
            "Provide customer support.",
            "Handle changes, refunds, claims, and disputes.",
            "Prevent fraud and maintain security.",
            "Comply with accounting, audit, tax, and legal obligations.",
            "Maintain backups and service continuity.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Retention periods may vary depending on the
          type of data, purpose of processing,
          relationship with the customer, and legal
          obligations.
        </p>

        <p className="leading-8 text-slate-600">
          Data that is no longer required will be
          deleted, destroyed, anonymized, or restricted
          from further processing in accordance with
          applicable policies and requirements.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Data security"
      >
        <p className="leading-8 text-slate-600">
          We implement reasonable administrative,
          technical, and organizational measures to
          protect data against:
        </p>

        <BulletList
          items={[
            "Unauthorized access.",
            "Unauthorized use or disclosure.",
            "Improper alteration of data.",
            "Loss or damage to data.",
            "Destruction of data.",
            "Attacks, fraud, and misuse of systems.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Protection measures may include encrypted
          connections, restricted server access,
          authentication, firewalls, security
          monitoring, backups, system updates, and
          activity logging.
        </p>

        <p className="leading-8 text-slate-600">
          No method of electronic transmission or
          storage can be guaranteed to be entirely
          risk-free. We will continue to adjust our
          protections according to service needs and
          identified risks.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Personal data breaches"
      >
        <p className="leading-8 text-slate-600">
          If an incident results in damage, loss,
          alteration, disclosure, or unauthorized
          access to personal data, we will investigate,
          respond, recover, and take steps to mitigate
          the associated risks.
        </p>

        <p className="leading-8 text-slate-600">
          We will notify affected parties and the
          relevant authorities in the form and within
          the time required by applicable laws and
          regulations.
        </p>

        <p className="leading-8 text-slate-600">
          A notification may include the type of data
          affected, the known time and cause of the
          incident, the potential impact, and the
          response and recovery actions taken.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Cross-border processing and transfers"
      >
        <p className="leading-8 text-slate-600">
          Some technology service providers may use
          infrastructure or personnel located outside
          the user&apos;s location or outside
          Indonesia.
        </p>

        <p className="leading-8 text-slate-600">
          Where data must be transferred outside
          Indonesia, we will consider applicable data
          protection requirements, including the level
          of protection, binding safeguards, or consent
          where required.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Children's data"
      >
        <p className="leading-8 text-slate-600">
          The person making a booking must be at least
          18 years old.
        </p>

        <p className="leading-8 text-slate-600">
          Data relating to a child or infant may be
          processed as passenger data where the booking
          is made by a parent, legal guardian, or
          responsible adult.
        </p>

        <p className="leading-8 text-slate-600">
          A person providing a child&apos;s data
          confirms that they have the authority
          required to provide that data for booking
          and travel purposes.
        </p>

        <p className="leading-8 text-slate-600">
          If we become aware that a child&apos;s data
          has been provided without appropriate
          authority, we may take steps to restrict or
          delete it, provided this does not conflict
          with legal obligations or a lawful booking.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="User rights relating to personal data"
      >
        <p className="leading-8 text-slate-600">
          Subject to applicable law and identity
          verification, users may have the right to:
        </p>

        <BulletList
          items={[
            "Obtain information about the purposes and legal basis of processing.",
            "Access and obtain a copy of their personal data.",
            "Complete, update, or correct inaccurate data.",
            "Withdraw consent where processing is based on consent.",
            "Request that data be stopped, deleted, or destroyed where permitted.",
            "Request the suspension or restriction of processing in certain circumstances.",
            "Object to decisions based solely on automated processing that produce legal or similarly significant effects.",
            "Obtain or transfer data in an appropriate format where applicable.",
            "Submit a complaint and seek compensation using an available legal mechanism.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Certain rights may be restricted where data
          remains necessary to fulfill a booking,
          comply with a legal obligation, prevent
          fraud, resolve a dispute, or protect the
          rights of another party.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="How to exercise your data rights"
      >
        <p className="leading-8 text-slate-600">
          A data-related request may be submitted by
          email or through the Nusa Gili Boat contact
          page.
        </p>

        <p className="leading-8 text-slate-600">
          The request should include:
        </p>

        <BulletList
          items={[
            "Full name.",
            "Email address or contact number used when making the booking.",
            "Booking code where the request relates to a transaction.",
            "The type of request being submitted.",
            "Supporting information required for verification.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          We may request identity verification to
          prevent data from being disclosed, changed,
          or deleted at the request of an unauthorized
          person.
        </p>

        <p className="leading-8 text-slate-600">
          We will handle the request in accordance
          with the procedures and timeframes required
          by applicable laws and regulations.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Automated decisions and fraud prevention"
      >
        <p className="leading-8 text-slate-600">
          Our systems may automatically check seat
          availability, input validity, payment status,
          and suspicious activity.
        </p>

        <p className="leading-8 text-slate-600">
          Payment providers may also use automated
          systems to assess risk, authorize
          transactions, and prevent fraud according to
          their own policies.
        </p>

        <p className="leading-8 text-slate-600">
          Where an automated decision has a significant
          effect on a user, the user may contact us to
          request an explanation or review to the
          extent that right applies.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Third-party links and services"
      >
        <p className="leading-8 text-slate-600">
          Our website may contain links to operators,
          payment providers, maps, social media, or
          other third-party websites.
        </p>

        <p className="leading-8 text-slate-600">
          Data processing on a third-party website is
          subject to that party&apos;s privacy policy.
          Nusa Gili Boat does not control all privacy
          practices of those independent parties.
        </p>

        <p className="leading-8 text-slate-600">
          Users are encouraged to read a third
          party&apos;s privacy notice before providing
          personal data.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Changes to this Privacy Policy"
      >
        <p className="leading-8 text-slate-600">
          We may update this Privacy Policy to reflect
          changes in our services, technology, payment
          providers, business processes, or
          regulations.
        </p>

        <p className="leading-8 text-slate-600">
          The latest version will be published on this
          page together with the date of the update.
        </p>

        <p className="leading-8 text-slate-600">
          Where a change materially affects how we
          process data, we will aim to provide an
          appropriate additional notice.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Governing law and language"
      >
        <p className="leading-8 text-slate-600">
          This Privacy Policy is governed by and
          interpreted in accordance with the laws of
          the Republic of Indonesia, including
          requirements relating to personal data
          protection and electronic systems.
        </p>

        <p className="leading-8 text-slate-600">
          This policy was originally prepared in
          Bahasa Indonesia. A translation into another
          language may be provided for the convenience
          of users.
        </p>

        <p className="leading-8 text-slate-600">
          If there is any difference in interpretation,
          the Bahasa Indonesia version will prevail to
          the extent permitted by law.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Contact us"
      >
        <p className="leading-8 text-slate-600">
          Questions, complaints, and requests relating
          to personal data may be submitted through:
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
                Website
              </dt>

              <dd className="mt-1">
                https://www.nusagiliboat.com
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
