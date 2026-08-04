import Link from "next/link"
import { notFound } from "next/navigation"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import AdminShell from "../../../AdminShell"
import ManifestPrintButton from "./ManifestPrintButton"

export const dynamic = "force-dynamic"

type AppwriteRow =
  Record<string, unknown>

type ManifestPassenger = {
  number: number
  name: string
}

type ManifestBooking = {
  $id: string
  bookingCode: string
  bookingStatus: string
  paymentStatus: string
  passengerCount: number

  customerFullName: string
  customerEmail: string
  customerWhatsapp: string

  passengers: ManifestPassenger[]
  notes: string | null

  journeyLeg: "Outbound" | "Return"
}

type ManifestInventory = {
  $id: string
  inventoryCode: string
  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  salesStatus: string
  isActive: boolean

  scheduleCode: string
  operatorName: string
  vesselName: string
  routeCode: string
  fromPort: string
  toPort: string
}

type ManifestPageProps = {
  params: Promise<{
    inventoryId: string
  }>
}

function cleanText(
  value: unknown
): string {
  return String(value ?? "").trim()
}

function optionalText(
  value: unknown
): string | null {
  const normalized =
    cleanText(value)

  return normalized || null
}

function toInteger(
  value: unknown
): number {
  const parsedValue =
    Number(value)

  return Number.isInteger(
    parsedValue
  )
    ? parsedValue
    : 0
}

function parsePassengers(
  value: unknown
): ManifestPassenger[] {
  const rawValue =
    cleanText(value)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue: unknown =
      JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map((item, index) => {
        if (
          typeof item !== "object" ||
          item === null
        ) {
          return null
        }

        const passenger =
          item as AppwriteRow

        const name =
          cleanText(passenger.name)

        if (!name) {
          return null
        }

        return {
          number:
            toInteger(
              passenger.number
            ) || index + 1,

          name,
        }
      })
      .filter(
        (
          passenger
        ): passenger is ManifestPassenger =>
          passenger !== null
      )
  } catch {
    return []
  }
}

function formatTravelDate(
  value: string
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (!match) {
    return value
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  )

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date)
}

function statusClass(
  value: string
): string {
  const normalized =
    value.trim().toLowerCase()

  if (
    normalized === "confirmed" ||
    normalized === "completed" ||
    normalized === "paid" ||
    normalized === "demo"
  ) {
    return "bg-emerald-100 text-emerald-800"
  }

  if (normalized === "pending") {
    return "bg-amber-100 text-amber-800"
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "refunded"
  ) {
    return "bg-red-100 text-red-800"
  }

  return "bg-slate-100 text-slate-700"
}

async function getRowOrNull(
  tableId: string,
  rowId: string
): Promise<AppwriteRow | null> {
  try {
    const row =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId,
        rowId,
      })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      Number(
        (error as {
          code?: unknown
        }).code
      ) === 404
    ) {
      return null
    }

    throw error
  }
}

async function getInventory(
  inventoryId: string
): Promise<ManifestInventory | null> {
  const inventory =
    await getRowOrNull(
      appwriteConfig
        .tripInventoryTableId,
      inventoryId
    )

  if (!inventory) {
    return null
  }

  const [
    schedule,
    operator,
    vessel,
    route,
  ] = await Promise.all([
    getRowOrNull(
      appwriteConfig
        .tripSchedulesTableId,
      cleanText(
        inventory.scheduleId
      )
    ),

    getRowOrNull(
      appwriteConfig
        .operatorsTableId,
      cleanText(
        inventory.operatorId
      )
    ),

    getRowOrNull(
      appwriteConfig
        .vesselsTableId,
      cleanText(
        inventory.vesselId
      )
    ),

    getRowOrNull(
      appwriteConfig
        .routesTableId,
      cleanText(
        inventory.routeId
      )
    ),
  ])

  const seatCapacity =
    toInteger(
      inventory.seatCapacity
    )

  const bookedSeats =
    toInteger(
      inventory.bookedSeats
    )

  const heldSeats =
    toInteger(
      inventory.heldSeats
    )

  return {
    $id:
      cleanText(inventory.$id),

    inventoryCode:
      cleanText(
        inventory.inventoryCode
      ),

    travelDate:
      cleanText(
        inventory.travelDate
      ),

    departureTime:
      cleanText(
        inventory.departureTime
      ),

    arrivalTime:
      cleanText(
        inventory.arrivalTime
      ),

    arrivalDayOffset:
      toInteger(
        inventory.arrivalDayOffset
      ),

    seatCapacity,
    bookedSeats,
    heldSeats,

    availableSeats:
      Math.max(
        0,
        seatCapacity -
          bookedSeats -
          heldSeats
      ),

    salesStatus:
      cleanText(
        inventory.salesStatus
      ) || "CLOSED",

    isActive:
      inventory.isActive === true,

    scheduleCode:
      cleanText(
        schedule?.scheduleCode
      ),

    operatorName:
      cleanText(
        operator?.operatorName
      ) || "Operator unavailable",

    vesselName:
      cleanText(
        vessel?.vesselName
      ) || "Vessel unavailable",

    routeCode:
      cleanText(
        route?.routeCode
      ),

    fromPort:
      cleanText(
        route?.fromPort
      ) || "Departure unavailable",

    toPort:
      cleanText(
        route?.toPort
      ) || "Destination unavailable",
  }
}

function toManifestBooking(
  row: AppwriteRow,
  inventoryId: string
): ManifestBooking {
  const outboundMatch =
    cleanText(
      row.tripInventoryId
    ) === inventoryId

  return {
    $id:
      cleanText(row.$id),

    bookingCode:
      cleanText(
        row.bookingCode
      ),

    bookingStatus:
      cleanText(
        row.bookingStatus
      ),

    paymentStatus:
      cleanText(
        row.paymentStatus
      ),

    passengerCount:
      toInteger(
        row.passengerCount
      ),

    customerFullName:
      cleanText(
        row.customerFullName
      ),

    customerEmail:
      cleanText(
        row.customerEmail
      ),

    customerWhatsapp:
      cleanText(
        row.customerWhatsapp
      ),

    passengers:
      parsePassengers(
        row.passengersJson
      ),

    notes:
      optionalText(row.notes),

    journeyLeg:
      outboundMatch
        ? "Outbound"
        : "Return",
  }
}

async function getManifestBookings(
  inventoryId: string
): Promise<ManifestBooking[]> {
  const [
    outboundResponse,
    returnResponse,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.bookingsTableId,

      queries: [
        Query.equal(
          "tripInventoryId",
          inventoryId
        ),
        Query.orderAsc(
          "bookingCode"
        ),
        Query.limit(200),
      ],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.bookingsTableId,

      queries: [
        Query.equal(
          "returnTripInventoryId",
          inventoryId
        ),
        Query.orderAsc(
          "bookingCode"
        ),
        Query.limit(200),
      ],
    }),
  ])

  const uniqueRows =
    new Map<string, AppwriteRow>()

  for (
    const row of [
      ...outboundResponse.rows,
      ...returnResponse.rows,
    ]
  ) {
    const booking =
      row as unknown as AppwriteRow

    uniqueRows.set(
      cleanText(booking.$id),
      booking
    )
  }

  return [...uniqueRows.values()]
    .map((booking) =>
      toManifestBooking(
        booking,
        inventoryId
      )
    )
    .sort((first, second) =>
      first.bookingCode.localeCompare(
        second.bookingCode
      )
    )
}

function BookingCard({
  booking,
  pending = false,
}: {
  booking: ManifestBooking
  pending?: boolean
}) {
  return (
    <article
      className={`manifest-booking-card rounded-3xl border bg-white p-6 shadow-sm ${
        pending
          ? "border-amber-200"
          : "border-slate-200"
      }`}
    >
      <div className="manifest-booking-header flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
        <div>
          <Link
            href={`/admin/bookings/${booking.$id}`}
            className="text-lg font-black text-cyan-700 hover:text-cyan-900 hover:underline"
          >
            {booking.bookingCode}
          </Link>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {booking.customerFullName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {booking.customerEmail}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {booking.customerWhatsapp}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
              booking.bookingStatus
            )}`}
          >
            {booking.bookingStatus}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
              booking.paymentStatus
            )}`}
          >
            Payment:{" "}
            {booking.paymentStatus}
          </span>

          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
            {booking.journeyLeg}
          </span>
        </div>
      </div>

      <div className="manifest-passenger-grid mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Passengers
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {booking.passengerCount}
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Passenger names
          </p>

          {booking.passengers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Passenger names are unavailable.
            </p>
          ) : (
            <ol className="manifest-passenger-list mt-3 grid gap-2 sm:grid-cols-2">
              {booking.passengers.map(
                (passenger) => (
                  <li
                    key={`${booking.$id}-${passenger.number}-${passenger.name}`}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"
                  >
                    {passenger.number}.{" "}
                    {passenger.name}
                  </li>
                )
              )}
            </ol>
          )}
        </div>
      </div>

      {booking.notes && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Booking notes
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {booking.notes}
          </p>
        </div>
      )}
    </article>
  )
}


function ManifestPrintDocument({
  inventory,
  manifestBookings,
}: {
  inventory: ManifestInventory
  manifestBookings: ManifestBooking[]
}) {
  const printableBookings =
    manifestBookings

  const totalPassengers =
    printableBookings.reduce(
      (total, booking) =>
        total + booking.passengerCount,
      0
    )

  const printedAt =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone:
          "Asia/Makassar",
      }
    ).format(new Date())

  return (
    <section className="manifest-print-document hidden print:block">
      <header className="manifest-print-header">
        <div>
          <p className="manifest-print-brand">
            Nusa Gili Boat
          </p>

          <h1>
            Passenger Manifest
          </h1>

          <p className="manifest-print-subtitle">
            Paid booking and passenger summary
          </p>
        </div>

        <div className="manifest-print-meta">
          <p>
            Printed
          </p>

          <strong>
            {printedAt} WITA
          </strong>
        </div>
      </header>

      <section className="manifest-print-trip">
        <div className="manifest-print-route">
          <p>
            {inventory.operatorName}
          </p>

          <h2>
            {inventory.fromPort}
            {" → "}
            {inventory.toPort}
          </h2>

          <span>
            {inventory.vesselName}
          </span>
        </div>

        <dl className="manifest-print-trip-grid">
          <div>
            <dt>Travel date</dt>
            <dd>
              {formatTravelDate(
                inventory.travelDate
              )}
            </dd>
          </div>

          <div>
            <dt>Departure</dt>
            <dd>
              {inventory.departureTime}
            </dd>
          </div>

          <div>
            <dt>Arrival</dt>
            <dd>
              {inventory.arrivalTime}
              {inventory.arrivalDayOffset > 0
                ? ` +${inventory.arrivalDayOffset}d`
                : ""}
            </dd>
          </div>

          <div>
            <dt>Inventory</dt>
            <dd>
              {inventory.inventoryCode}
            </dd>
          </div>
        </dl>

        <dl className="manifest-print-seat-grid">
          <div>
            <dt>Capacity</dt>
            <dd>{inventory.seatCapacity}</dd>
          </div>

          <div>
            <dt>Booked</dt>
            <dd>{inventory.bookedSeats}</dd>
          </div>

          <div>
            <dt>Held</dt>
            <dd>{inventory.heldSeats}</dd>
          </div>

          <div>
            <dt>Available</dt>
            <dd>{inventory.availableSeats}</dd>
          </div>
        </dl>
      </section>

      <section className="manifest-print-bookings">
        <div className="manifest-print-section-title">
          <div>
            <h2>
              Booking and passenger details
            </h2>

            <p>
              Confirmed or completed bookings with verified paid status
            </p>
          </div>

          <strong>
            {printableBookings.length} bookings
            {" · "}
            {totalPassengers} passengers
          </strong>
        </div>

        {printableBookings.length === 0 ? (
          <div className="manifest-print-empty">
            No booking is recorded for this departure.
          </div>
        ) : (
          <table className="manifest-print-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Booking and customer</th>
                <th>Passenger names</th>
                <th>Pax</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {printableBookings.map(
                (booking, index) => (
                  <tr key={booking.$id}>
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <strong>
                        {booking.bookingCode}
                      </strong>

                      <span>
                        {booking.customerFullName}
                      </span>

                      <small>
                        {booking.customerEmail}
                      </small>

                      <small>
                        {booking.customerWhatsapp}
                      </small>

                      {booking.notes && (
                        <small className="manifest-print-note">
                          Note: {booking.notes}
                        </small>
                      )}
                    </td>

                    <td>
                      {booking.passengers.length === 0 ? (
                        <span>
                          Passenger names unavailable
                        </span>
                      ) : (
                        <ol>
                          {booking.passengers.map(
                            (passenger) => (
                              <li
                                key={`${booking.$id}-${passenger.number}-${passenger.name}`}
                              >
                                {passenger.number}.{" "}
                                {passenger.name}
                              </li>
                            )
                          )}
                        </ol>
                      )}
                    </td>

                    <td className="manifest-print-center">
                      {booking.passengerCount}
                    </td>

                    <td>
                      <strong>
                        {booking.bookingStatus}
                      </strong>

                      <span>
                        Payment:{" "}
                        {booking.paymentStatus}
                      </span>

                      <small>
                        {booking.journeyLeg}
                      </small>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>

      <footer className="manifest-print-footer">
        <p>
          Prepared by Nusa Gili Boat for agency
          coordination. Passenger check-in and
          boarding remain the responsibility of
          the fast boat provider.
        </p>
      </footer>
    </section>
  )
}

export default async function ManifestPage({
  params,
}: ManifestPageProps) {
  const admin = await requireAdmin()

  const {
    inventoryId,
  } = await params

  const [
    inventory,
    bookings,
  ] = await Promise.all([
    getInventory(inventoryId),
    getManifestBookings(
      inventoryId
    ),
  ])

  if (!inventory) {
    notFound()
  }

  const manifestBookings =
    bookings.filter(
      (booking) =>
        (
          booking.bookingStatus ===
            "Confirmed" ||
          booking.bookingStatus ===
            "Completed"
        ) &&
        booking.paymentStatus ===
          "Paid"
    )

  const manifestPassengers =
    manifestBookings.reduce(
      (total, booking) =>
        total +
        booking.passengerCount,
      0
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white print:hidden">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Agent departure summary
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Passenger Manifest
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
              Read-only booking and passenger
              details for this fast boat departure.
            </p>
          </div>
        </section>

        <section className="manifest-print-area mx-auto max-w-[1500px] px-5 py-10 print:max-w-none print:px-0 print:py-0 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-3 print:hidden">
            <Link
              href={`/admin/departures?date=${encodeURIComponent(
                inventory.travelDate
              )}`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              ← Back to Departures
            </Link>

            <Link
              href="/admin/trip-inventory"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
            >
              Review Inventory
            </Link>

            <ManifestPrintButton />
          </div>

          <ManifestPrintDocument
            inventory={inventory}
            manifestBookings={manifestBookings}
          />


          <section className="manifest-trip-card print:hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    {inventory.operatorName}
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {inventory.fromPort}

                    <span className="mx-3 text-cyan-600">
                      →
                    </span>

                    {inventory.toPort}
                  </h2>

                  <p className="mt-3 text-sm font-bold text-slate-500">
                    {inventory.vesselName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                    {inventory.salesStatus}
                  </span>

                  {!inventory.isActive && (
                    <span className="rounded-full bg-red-100 px-4 py-2 text-xs font-black text-red-700">
                      INACTIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Travel date
                  </p>

                  <p className="mt-2 font-black">
                    {formatTravelDate(
                      inventory.travelDate
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Departure
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {inventory.departureTime}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Arrival
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {inventory.arrivalTime}

                    {inventory.arrivalDayOffset > 0 && (
                      <span className="ml-1 text-xs text-cyan-700">
                        +{inventory.arrivalDayOffset}d
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Schedule
                  </p>

                  <p className="mt-2 break-all text-sm font-black">
                    {inventory.scheduleCode || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Inventory
                  </p>

                  <p className="mt-2 break-all text-sm font-black">
                    {inventory.inventoryCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
              <div className="rounded-2xl bg-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Capacity
                </p>

                <p className="mt-2 text-3xl font-black">
                  {inventory.seatCapacity}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Booked seats
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-800">
                  {inventory.bookedSeats}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Held seats
                </p>

                <p className="mt-2 text-3xl font-black text-amber-800">
                  {inventory.heldSeats}
                </p>
              </div>

              <div className="rounded-2xl bg-cyan-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-700">
                  Available
                </p>

                <p className="mt-2 text-3xl font-black text-cyan-800">
                  {inventory.availableSeats}
                </p>
              </div>
            </div>
          </section>

          <section className="manifest-confirmed-section print:hidden mt-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Paid sales manifest
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Paid bookings ready for provider
                </h2>
              </div>

              <p className="text-sm font-bold text-slate-500">
                {manifestBookings.length} booking
                {manifestBookings.length === 1 ? "" : "s"}
                {" · "}
                {manifestPassengers} passenger
                {manifestPassengers === 1 ? "" : "s"}
              </p>
            </div>

            {manifestBookings.length === 0 ? (
              <div className="manifest-empty-state mt-5 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-lg font-black">
                  No paid bookings ready for provider
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  This departure does not yet have a
                  Confirmed or Completed booking with Paid status.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {manifestBookings.map(
                  (booking) => (
                    <BookingCard
                      key={booking.$id}
                      booking={booking}
                    />
                  )
                )}
              </div>
            )}
          </section>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm print:hidden">
            <p className="font-black text-slate-900">
              Agent manifest scope
            </p>

            <p className="mt-1">
              This page provides booking and
              passenger details for agency
              coordination only. Check-in,
              boarding, seat assignment and
              passenger attendance remain the
              responsibility of the fast boat
              provider.
            </p>
          </div>
        </section>
      </main>
    </AdminShell>
  )
}
