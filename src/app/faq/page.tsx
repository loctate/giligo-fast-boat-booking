import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "en",
  path: "/faq",
  title: "Frequently Asked Questions | Nusa Gili Boat",
  description: "Answers about fast boat booking, routes, schedules, secure online payment through iPaymu, confirmation, tickets, cancellations, refunds, baggage, and customer support.",
})

type FaqItem = {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: "What is Nusa Gili Boat?",
    answer: "Nusa Gili Boat is an online fast boat ticket booking service. We help customers search for schedules, select routes, submit passenger details, create bookings, and communicate with customer support for payment and confirmation.",
  },
  {
    question: "Who operates the fast boat journey?",
    answer: "The sea transportation service, vessel, crew, check-in, boarding, and journey are operated by the selected fast boat operator. Nusa Gili Boat manages the booking website, inventory information, customer communication, and booking administration.",
  },
  {
    question: "Which destinations and routes are available?",
    answer: "Available routes may include Bali, Nusa Penida, the Gili Islands, and Lombok. The exact routes, schedules, operators, prices, and seat availability shown on the website depend on the current inventory.",
  },
  {
    question: "How do I make a booking?",
    answer: "Select a one-way or return journey, choose the departure point, destination, travel date, and passenger count, then select an available trip. Complete the customer and passenger information, review the details, and submit the booking.",
  },
  {
    question: "Why can I not book for today or tomorrow?",
    answer: "Nusa Gili Boat applies a minimum advance-booking period. Trips can normally be booked from two days after the current date so the admin and operator have enough time to verify inventory and process the reservation.",
  },
  {
    question: "Does a search result guarantee that a seat is available?",
    answer: "Search results are based on the inventory recorded at the time of the search. A seat is not reserved until the booking has been created successfully. Availability may change before the booking is completed.",
  },
  {
    question: "When is my booking confirmed?",
    answer: "A booking code does not mean that payment or confirmation is complete. The booking is confirmed after payment has been received and verified by the admin, and the booking status has been changed to Confirmed.",
  },
  {
    question: "Which payment methods are currently available?",
    answer: "Available online payment methods are presented securely through iPaymu after a booking is created. Complete the payment using one of the methods available on the iPaymu payment page.",
  },
  {
    question: "How does QRIS payment work?",
    answer: "Select Pay with QRIS on the booking page. WhatsApp will open with the booking information and a request for QRIS payment instructions. The admin will send the official QRIS information and verify the payment after it is completed.",
  },
  {
    question: "How do I pay by credit or debit card?",
    answer: "If card payment is available for your transaction, select the applicable option on the secure iPaymu payment page and follow the instructions provided there.",
  },
  {
    question: "Should I send my card or banking details through WhatsApp?",
    answer: "No. Never send your PIN, OTP, CVV, banking password, complete card number, or other confidential financial credentials through WhatsApp, email, or a customer support form.",
  },
  {
    question: "How long is a seat held while payment is pending?",
    answer: "Seats are held only for a limited period while the booking is pending. Complete the payment promptly and follow the expiry information shown on the booking page. An expired or cancelled booking may release the seats automatically.",
  },
  {
    question: "How will I receive my confirmation or ticket?",
    answer: "After payment has been verified and the booking has been confirmed, Nusa Gili Boat will provide the booking confirmation and applicable ticket or travel instructions using the contact information supplied in the booking.",
  },
  {
    question: "Are port fees and other local charges included?",
    answer: "The website displays the ticket price and any included charges that are available in the booking details. Depending on the route or operator, port fees, local levies, tourism fees, transfers, excess baggage, or other services may be charged separately.",
  },
  {
    question: "What are the check-in and baggage requirements?",
    answer: "Check-in time, meeting point, baggage allowance, and special-item rules may differ by operator. Customers must follow the instructions provided with the confirmed booking and arrive early enough for check-in and boarding.",
  },
  {
    question: "Can a departure schedule change?",
    answer: "Yes. Fast boat schedules may change because of weather, sea conditions, port instructions, operational requirements, or operator decisions. We will communicate material information received from the operator when possible.",
  },
  {
    question: "Can I change passenger details or cancel a booking?",
    answer: "Contact customer support as soon as possible. Changes, cancellations, and refunds depend on the booking status, departure time, operator rules, and the Nusa Gili Boat Refund and Cancellation Policy.",
  },
  {
    question: "How can I contact Nusa Gili Boat?",
    answer: "Use the Contact Us page for the official email, WhatsApp number, operating hours, and business location. Include your booking code when requesting assistance for an existing booking.",
  },
]

export default function FrequentlyAskedQuestionsPage() {
  return (
    <PublicInfoPage
      locale="en"
      eyebrow="Customer Support"
      title="Frequently Asked Questions"
      description="Find answers about searching for trips, booking fast boat tickets, secure online payment through iPaymu, booking confirmation, schedules, tickets, cancellations, and customer support."
      lastUpdated="July 24, 2026"
    >
      <section className="space-y-4">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
          <h2 className="text-lg font-black text-cyan-950">
            Before you travel
          </h2>

          <p className="mt-2 leading-7 text-cyan-900">
            Review your route, travel date, passenger
            details, booking status, payment status, and
            operator instructions before departure.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-cyan-300 open:bg-cyan-50/40"
            >
              <summary className="cursor-pointer list-none pr-8 font-bold text-slate-950 marker:hidden">
                <span className="mr-2 text-cyan-700">
                  {index + 1}.
                </span>
                {item.question}
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-black text-slate-950">
          Need more assistance?
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Contact our customer support team and include
          your booking code when asking about an existing
          reservation.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Contact Us
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
        </div>
      </section>
    </PublicInfoPage>
  )
}
