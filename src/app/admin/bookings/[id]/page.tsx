import Link from "next/link"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "../../LogoutButton"
import StatusEditor from "./StatusEditor"

export const dynamic = "force-dynamic"

type BookingPassenger = {
  number: number
  name: string
}

type BookingTrip = {
  id: string
  inventoryCode: string
  operator: string
  vesselName: string
  routeCode: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  duration: string
  price: number
  currency: string
  checkInLocation: string
}

type BookingRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  bookingCode: string
  bookingStatus: string
  paymentStatus: string

  tripType: string
  departureDate: string
  returnDate?: string | null

  passengerCount: number
  totalPrice: number
  currency?: string | null

  customerFullName: string
  customerEmail: string
  customerWhatsapp: string
  customerCountry: string

  passengersJson: string
  notes?: string | null

  tripId?: string | null
  tripInventoryId?: string | null
  inventoryCode?: string | null

  operatorName: string
  vesselName?: string | null
  routeCode?: string | null

  fromPort: string
  toPort: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset?: number | null
  duration: string

  pricePerPassenger: number
  checkInLocation: string

  returnTripInventoryId?: string | null
  returnTripJson?: string | null
}

type BookingDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim()
}

function toInteger(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue)
    ? parsedValue
    : null
}

function formatCurrency(
  value: number,
  currency = "IDR"
) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString(
      "id-ID"
    )}`
  }
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "-"
  }

  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (dateOnlyMatch) {
    const date = new Date(
      Date.UTC(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    )

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(date)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date)
}

function parsePassengers(
  value?: string | null
): BookingPassenger[] {
  if (!value) {
    return []
  }

  try {
    const parsedValue: unknown =
      JSON.parse(value)

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
          item as Record<
            string,
            unknown
          >

        const name = cleanText(
          passenger.name
        )

        if (!name) {
          return null
        }

        return {
          number:
            toInteger(
              passenger.number
            ) ??
            index + 1,

          name,
        }
      })
      .filter(
        (
          passenger
        ): passenger is BookingPassenger =>
          passenger !== null
      )
  } catch {
    return []
  }
}

function parseReturnTrip(
  value?: string | null
): BookingTrip | null {
  if (!value?.trim()) {
    return null
  }

  try {
    const parsedValue: unknown =
      JSON.parse(value)

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      return null
    }

    const trip =
      parsedValue as Record<
        string,
        unknown
      >

    const id = cleanText(trip.id)
    const operator = cleanText(
      trip.operator
    )
    const from = cleanText(trip.from)
    const to = cleanText(trip.to)

    const departureTime = cleanText(
      trip.departureTime
    )

    const arrivalTime = cleanText(
      trip.arrivalTime
    )

    const price =
      toInteger(trip.price)

    if (
      !id ||
      !operator ||
      !from ||
      !to ||
      !departureTime ||
      !arrivalTime ||
      price === null ||
      price < 0
    ) {
      return null
    }

    return {
      id,

      inventoryCode:
        cleanText(
          trip.inventoryCode
        ),

      operator,

      vesselName:
        cleanText(
          trip.vesselName
        ),

      routeCode:
        cleanText(
          trip.routeCode
        ),

      from,
      to,
      departureTime,
      arrivalTime,

      arrivalDayOffset:
        toInteger(
          trip.arrivalDayOffset
        ) ?? 0,

      duration:
        cleanText(
          trip.duration
        ) ||
        "Duration unavailable",

      price,

      currency:
        cleanText(
          trip.currency
        ).toUpperCase() ||
        "IDR",

      checkInLocation:
        cleanText(
          trip.checkInLocation
        ) ||
        "Check-in details will be provided after booking.",
    }
  } catch {
    return null
  }
}

function statusClass(status: string) {
  const normalized =
    status.toLowerCase()

  if (
    normalized === "confirmed" ||
    normalized === "paid" ||
    normalized === "completed"
  ) {
    return "bg-emerald-100 text-emerald-700"
  }

  if (
    normalized === "pending" ||
    normalized === "demo"
  ) {
    return "bg-amber-100 text-amber-700"
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "refunded"
  ) {
    return "bg-red-100 text-red-700"
  }

  return "bg-slate-100 text-slate-700"
}

function JourneyCard({
  label,
  trip,
  travelDate,
}: {
  label: string
  trip: BookingTrip
  travelDate: string
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            {label}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {trip.from}

            <span className="mx-2 text-cyan-600">
              →
            </span>

            {trip.to}
          </h2>

          <p className="mt-2 text-sm font-bold text-slate-500">
            {formatDate(travelDate)}
          </p>
        </div>

        <div className="w-fit rounded-full bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
          {trip.operator}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-3xl font-black">
            {trip.departureTime}
          </p>

          <p className="mt-2 text-lg font-black">
            {trip.from}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {trip.checkInLocation}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {trip.duration}
          </p>

          <div className="my-3 text-cyan-600">
            ─────➜
          </div>

          <p className="text-xs font-bold text-slate-500">
            Direct trip
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-3xl font-black">
            {trip.arrivalTime}

            {trip.arrivalDayOffset > 0 && (
              <span className="ml-2 text-sm text-cyan-600">
                +{trip.arrivalDayOffset}d
              </span>
            )}
          </p>

          <p className="mt-2 text-lg font-black">
            {trip.to}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Estimated arrival
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Vessel
          </p>

          <p className="mt-2 font-black">
            {trip.vesselName || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Inventory code
          </p>

          <p className="mt-2 break-all font-black">
            {trip.inventoryCode || "-"}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Price per passenger
          </p>

          <p className="mt-2 font-black text-cyan-700">
            {formatCurrency(
              trip.price,
              trip.currency
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const admin = await requireAdmin()

  const routeParams = await params
  const rowId = routeParams.id

  let booking: BookingRow | null = null
  let errorMessage = ""

  try {
    const result =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.bookingsTableId,

        rowId,
      })

    booking =
      result as unknown as BookingRow
  } catch (error) {
    console.error(
      "Booking detail error:",
      error
    )

    errorMessage =
      error instanceof Error
        ? error.message
        : "Booking could not be loaded."
  }

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🎫
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Booking not found
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            {errorMessage ||
              "The requested booking does not exist."}
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-black text-white transition hover:bg-cyan-700"
          >
            Return to Dashboard
          </Link>
        </section>
      </main>
    )
  }

  const passengers =
    parsePassengers(
      booking.passengersJson
    )

  const returnTrip =
    parseReturnTrip(
      booking.returnTripJson
    )

  const currency =
    cleanText(
      booking.currency
    ).toUpperCase() || "IDR"

  const passengerCount =
    Number(
      booking.passengerCount || 0
    )

  const outboundPrice =
    Number(
      booking.pricePerPassenger || 0
    )

  const outboundTrip: BookingTrip = {
    id:
      cleanText(
        booking.tripInventoryId
      ) ||
      cleanText(booking.tripId),

    inventoryCode:
      cleanText(
        booking.inventoryCode
      ),

    operator:
      cleanText(
        booking.operatorName
      ),

    vesselName:
      cleanText(
        booking.vesselName
      ),

    routeCode:
      cleanText(
        booking.routeCode
      ),

    from:
      cleanText(
        booking.fromPort
      ),

    to:
      cleanText(
        booking.toPort
      ),

    departureTime:
      cleanText(
        booking.departureTime
      ),

    arrivalTime:
      cleanText(
        booking.arrivalTime
      ),

    arrivalDayOffset:
      toInteger(
        booking.arrivalDayOffset
      ) ?? 0,

    duration:
      cleanText(
        booking.duration
      ) ||
      "Duration unavailable",

    price:
      outboundPrice,

    currency,

    checkInLocation:
      cleanText(
        booking.checkInLocation
      ) ||
      "Check-in details will be provided after booking.",
  }

  const isRoundTrip =
    booking.tripType
      .toLowerCase() ===
      "round-trip"

  const outboundTotal =
    outboundPrice *
    passengerCount

  const returnTotal =
    returnTrip
      ? returnTrip.price *
        passengerCount
      : 0

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-black"
            >
              Gili{" "}
              <span className="text-cyan-300">
                Go
              </span>
            </Link>

            <span className="hidden h-7 w-px bg-slate-700 sm:block" />

            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Booking details
              </p>

              <p className="text-sm text-slate-400">
                Administration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-sm text-slate-400 lg:block">
              {admin.email}
            </span>

            <Link
              href="/admin"
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
            >
              Back to Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            Booking record
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            {booking.bookingCode}
          </h1>

          <p className="mt-3 text-sm text-white/70">
            Created{" "}
            {formatDate(
              booking.$createdAt
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-black ${statusClass(
                booking.bookingStatus
              )}`}
            >
              {booking.bookingStatus}
            </span>

            <span
              className={`rounded-full px-4 py-2 text-sm font-black ${statusClass(
                booking.paymentStatus
              )}`}
            >
              Payment:{" "}
              {booking.paymentStatus}
            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">
              {isRoundTrip
                ? "Round Trip"
                : "One Way"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="space-y-7">
          <JourneyCard
            label="Outbound journey"
            trip={outboundTrip}
            travelDate={
              booking.departureDate
            }
          />

          {isRoundTrip &&
            returnTrip && (
              <JourneyCard
                label="Return journey"
                trip={returnTrip}
                travelDate={
                  booking.returnDate ||
                  ""
                }
              />
            )}

          {isRoundTrip &&
            !returnTrip && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
                <p className="font-black">
                  Return-trip data is missing
                </p>

                <p className="mt-2 text-sm leading-6">
                  This booking is marked as
                  round-trip, but its return-trip
                  snapshot could not be read.
                  Avoid changing its status until
                  the database record is checked.
                </p>
              </div>
            )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">
              Passenger details
            </h2>

            {passengers.length === 0 ? (
              <p className="mt-5 text-slate-500">
                Passenger information is
                unavailable.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {passengers.map(
                  (passenger) => (
                    <article
                      key={`${passenger.number}-${passenger.name}`}
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Passenger{" "}
                        {passenger.number}
                      </p>

                      <p className="mt-2 font-black">
                        {passenger.name}
                      </p>

                      <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                        Adult
                      </span>
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">
              Notes
            </h2>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
              {booking.notes ||
                "No additional notes were provided."}
            </p>
          </section>
        </div>

        <aside className="space-y-7">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Customer information
            </h2>

            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full name
                </dt>

                <dd className="mt-1 font-black">
                  {booking.customerFullName}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email
                </dt>

                <dd className="mt-1 break-all text-sm font-bold">
                  {booking.customerEmail}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  WhatsApp
                </dt>

                <dd className="mt-1 font-bold">
                  {booking.customerWhatsapp}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Country
                </dt>

                <dd className="mt-1 font-bold">
                  {booking.customerCountry}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Payment summary
            </h2>

            <div className="mt-5 space-y-4 border-b border-slate-100 pb-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Outbound
                </span>

                <span className="font-black">
                  {formatCurrency(
                    outboundTotal,
                    currency
                  )}
                </span>
              </div>

              {returnTrip && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Return
                  </span>

                  <span className="font-black">
                    {formatCurrency(
                      returnTotal,
                      returnTrip.currency
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Passengers
                </span>

                <span className="font-black">
                  {booking.passengerCount}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <span className="font-black">
                Stored total
              </span>

              <span className="text-xl font-black text-cyan-700">
                {formatCurrency(
                  booking.totalPrice,
                  currency
                )}
              </span>
            </div>
          </section>

          <StatusEditor
            rowId={booking.$id}
            initialBookingStatus={
              booking.bookingStatus
            }
            initialPaymentStatus={
              booking.paymentStatus
            }
          />
        </aside>
      </section>
    </main>
  )
}