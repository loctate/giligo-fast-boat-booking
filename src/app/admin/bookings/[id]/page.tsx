import Link from "next/link"
import {
  notFound,
} from "next/navigation"

import {
  requireAdmin,
} from "@/lib/admin-auth"

import {
  getD1BookingById,
} from "@/lib/d1-booking-readers"

import AdminShell from "../../AdminShell"
import StatusEditor from "./StatusEditor"

export const dynamic =
  "force-dynamic"

type BookingPassenger = {
  number: number
  name: string
}

function parsePassengers(
  value: string
): BookingPassenger[] {
  try {
    const parsed =
      JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(
        (
          item,
          index
        ) => ({
          number:
            Number(
              item?.number
            ) ||
            index + 1,

          name:
            String(
              item?.name ?? ""
            ).trim(),
        })
      )
      .filter(
        (item) =>
          Boolean(item.name)
      )
  } catch {
    return []
  }
}

function money(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style:
          "currency",

        currency:
          currency || "IDR",

        maximumFractionDigits:
          0,
      }
    ).format(amount)
  } catch {
    return `${currency || "IDR"} ${amount}`
  }
}

type BookingDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const admin =
    await requireAdmin()

  const {
    id,
  } = await params

  const booking =
    await getD1BookingById(
      id
    )

  if (!booking) {
    notFound()
  }

  const passengers =
    parsePassengers(
      booking.passengersJson
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1300px] px-5 lg:px-8">
            <Link
              href="/admin"
              className="text-sm font-black text-cyan-200"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-black">
              {booking.bookingCode}
            </h1>

            <p className="mt-2 text-white/75">
              D1 booking detail
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1300px] gap-6 px-5 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Customer
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Name
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.customerFullName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.customerEmail}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    WhatsApp
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.customerWhatsapp}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Country
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.customerCountry}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Journey
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Route
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.fromPort}
                    {" → "}
                    {booking.toPort}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Departure
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.departureDate}
                    {" · "}
                    {booking.departureTime}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Operator
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.operatorName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Vessel
                  </p>
                  <p className="mt-1 font-bold">
                    {booking.vesselName}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Passengers
              </h2>

              <div className="mt-5 divide-y divide-slate-100">
                {passengers.map(
                  (passenger) => (
                    <div
                      key={`${passenger.number}-${passenger.name}`}
                      className="flex gap-4 py-3"
                    >
                      <span className="font-black text-cyan-700">
                        {passenger.number}.
                      </span>

                      <span className="font-bold">
                        {passenger.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-400">
                Booking status
              </p>

              <p className="mt-2 text-xl font-black">
                {booking.bookingStatus}
              </p>

              <p className="mt-5 text-xs font-black uppercase text-slate-400">
                Payment status
              </p>

              <p className="mt-2 text-xl font-black">
                {booking.paymentStatus}
              </p>

              <p className="mt-5 text-xs font-black uppercase text-slate-400">
                Total
              </p>

              <p className="mt-2 text-2xl font-black text-cyan-700">
                {money(
                  booking.totalPrice,
                  booking.currency
                )}
              </p>
            </section>

            <StatusEditor
              rowId={booking.id}
              initialBookingStatus={
                booking.bookingStatus
              }
              initialPaymentStatus={
                booking.paymentStatus
              }
              paymentReviewRequired={
                booking.paymentReviewRequired
              }
              paymentReviewReason={
                booking.paymentReviewReason
              }
              paymentReviewAt={
                booking.paymentReviewAt
              }
            />
          </aside>
        </section>
      </main>
    </AdminShell>
  )
}
