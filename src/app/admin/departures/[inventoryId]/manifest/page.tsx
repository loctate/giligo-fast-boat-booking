import Link from "next/link"

import {
  notFound,
} from "next/navigation"

import {
  requireAdmin,
} from "@/lib/admin-auth"

import {
  getD1AdminDepartureById,
} from "@/lib/d1-admin-operations"

import {
  listD1BookingsByInventory,
} from "@/lib/d1-booking-readers"

import AdminShell from "../../../AdminShell"

export const dynamic =
  "force-dynamic"

type Passenger = {
  number: number
  name: string
}

function passengers(
  raw: string
): Passenger[] {
  try {
    const parsed =
      JSON.parse(raw)

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

type ManifestPageProps = {
  params: Promise<{
    inventoryId: string
  }>
}

export default async function ManifestPage({
  params,
}: ManifestPageProps) {
  const admin =
    await requireAdmin()

  const {
    inventoryId,
  } = await params

  const departure =
    await getD1AdminDepartureById(
      inventoryId
    )

  if (!departure) {
    notFound()
  }

  const linked =
    await listD1BookingsByInventory(
      inventoryId,
      {
        limit:
          500,
      }
    )

  /*
   * FINAL PROVIDER MANIFEST RULE:
   *
   * bookingStatus Confirmed OR Completed
   * AND paymentStatus Paid.
   */
  const manifestBookings =
    linked.filter(
      ({
        booking,
      }) =>
        (
          booking.bookingStatus ===
            "Confirmed" ||
          booking.bookingStatus ===
            "Completed"
        ) &&
        booking.paymentStatus ===
          "Paid"
    )

  const passengerTotal =
    manifestBookings.reduce(
      (
        total,
        item
      ) =>
        total +
        item.booking
          .passengerCount,
      0
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
            <Link
              href={`/admin/departures?date=${encodeURIComponent(
                departure.travelDate
              )}`}
              className="text-sm font-black text-cyan-200"
            >
              ← Departures
            </Link>

            <h1 className="mt-4 text-3xl font-black">
              Passenger Manifest
            </h1>

            <p className="mt-2 text-white/75">
              {departure.operatorName}
              {" · "}
              {departure.fromPort}
              {" → "}
              {departure.toPort}
              {" · "}
              {departure.travelDate}
              {" "}
              {departure.departureTime}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase text-slate-400">
                Paid bookings
              </p>
              <p className="mt-2 text-3xl font-black">
                {manifestBookings.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase text-slate-400">
                Passengers
              </p>
              <p className="mt-2 text-3xl font-black">
                {passengerTotal}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase text-slate-400">
                Vessel
              </p>
              <p className="mt-2 text-xl font-black">
                {departure.vesselName}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">
                Provider-ready manifest
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Only Confirmed/Completed
                bookings with Paid status.
              </p>
            </div>

            {manifestBookings.length ===
            0 ? (
              <div className="p-12 text-center text-slate-500">
                No paid bookings ready
                for provider manifest.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {manifestBookings.map(
                  ({
                    booking,
                    journeyLeg,
                  }) => (
                    <article
                      key={`${booking.id}-${journeyLeg}`}
                      className="p-6"
                    >
                      <div className="flex flex-wrap justify-between gap-4">
                        <div>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-black text-cyan-700"
                          >
                            {booking.bookingCode}
                          </Link>

                          <p className="mt-1 font-bold">
                            {booking.customerFullName}
                          </p>

                          <p className="text-sm text-slate-500">
                            {booking.customerWhatsapp}
                            {" · "}
                            {journeyLeg}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black">
                            {booking.passengerCount}
                            {" passenger"}
                            {booking.passengerCount ===
                            1
                              ? ""
                              : "s"}
                          </p>

                          <p className="text-sm font-bold text-emerald-700">
                            {booking.bookingStatus}
                            {" · "}
                            {booking.paymentStatus}
                          </p>
                        </div>
                      </div>

                      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                        {passengers(
                          booking.passengersJson
                        ).map(
                          (passenger) => (
                            <li
                              key={`${booking.id}-${passenger.number}`}
                              className="rounded-xl bg-slate-50 px-4 py-3"
                            >
                              <span className="mr-2 font-black text-cyan-700">
                                {passenger.number}.
                              </span>

                              {passenger.name}
                            </li>
                          )
                        )}
                      </ol>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </AdminShell>
  )
}
