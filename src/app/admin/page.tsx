import Link from "next/link"

import {
  requireAdmin,
} from "@/lib/admin-auth"

import {
  listD1BookingsForDashboard,
} from "@/lib/d1-booking-readers"

import AdminShell from "./AdminShell"

export const dynamic =
  "force-dynamic"

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

export default async function AdminPage() {
  const admin =
    await requireAdmin()

  let bookings =
    await listD1BookingsForDashboard({
      limit:
        200,
    })

  const totalBookings =
    bookings.length

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.bookingStatus ===
        "Pending"
    ).length

  const paidBookings =
    bookings.filter(
      (booking) =>
        booking.paymentStatus ===
        "Paid"
    ).length

  const reviewBookings =
    bookings.filter(
      (booking) =>
        booking.paymentReviewRequired
    ).length

  bookings =
    bookings.slice(
      0,
      50
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Emergency Cloudflare operations
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Operations Dashboard
            </h1>

            <p className="mt-3 text-sm text-white/75">
              Booking data below is loaded
              directly from Cloudflare D1.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Bookings",
                totalBookings,
              ],
              [
                "Pending",
                pendingBookings,
              ],
              [
                "Paid",
                paidBookings,
              ],
              [
                "Payment review",
                reviewBookings,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {label}
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {value}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/trip-inventory"
              className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white"
            >
              Trip Inventory
            </Link>

            <Link
              href="/admin/departures"
              className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white"
            >
              Departures
            </Link>

            <Link
              href="/admin/manifests"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black"
            >
              Manifests
            </Link>
          </div>

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">
                Recent Bookings
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Booking
                    </th>
                    <th className="px-5 py-4">
                      Customer
                    </th>
                    <th className="px-5 py-4">
                      Travel
                    </th>
                    <th className="px-5 py-4">
                      Booking
                    </th>
                    <th className="px-5 py-4">
                      Payment
                    </th>
                    <th className="px-5 py-4">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {bookings.map(
                    (booking) => (
                      <tr
                        key={booking.id}
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-black text-cyan-700"
                          >
                            {booking.bookingCode}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {booking.customerFullName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {booking.customerEmail}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>
                            {booking.departureDate}
                          </p>

                          <p className="text-xs text-slate-500">
                            {booking.fromPort}
                            {" → "}
                            {booking.toPort}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {booking.bookingStatus}
                        </td>

                        <td className="px-5 py-4 font-bold">
                          {booking.paymentStatus}
                        </td>

                        <td className="px-5 py-4 font-black">
                          {money(
                            booking.totalPrice,
                            booking.currency
                          )}
                        </td>
                      </tr>
                    )
                  )}

                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No bookings in D1.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </AdminShell>
  )
}
