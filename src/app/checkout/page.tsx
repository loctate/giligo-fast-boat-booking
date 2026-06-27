import Link from "next/link"
import { headers } from "next/headers"

import CheckoutForm from "./CheckoutForm"

export const dynamic = "force-dynamic"

type TripType = "one-way" | "round-trip"

type CheckoutPageProps = {
  searchParams: Promise<{
    tripInventoryId?: string | string[]
    outboundTripInventoryId?: string | string[]
    returnTripInventoryId?: string | string[]

    tripType?: string | string[]

    departureDate?: string | string[]
    returnDate?: string | string[]

    passengers?: string | string[]
  }>
}

type PublicTripDetail = {
  tripInventoryId: string
  inventoryCode: string

  scheduleId: string
  scheduleCode: string

  operatorId: string
  operatorCode: string
  operatorName: string

  vesselId: string
  vesselCode: string
  vesselName: string

  routeId: string
  routeCode: string

  fromPort: string
  toPort: string

  fromIsland: string | null
  toIsland: string | null

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  durationMinutes: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number

  currency: string
}

type TripDetailApiResponse = {
  success: boolean

  minimumDate?: string
  passengers?: number

  trip?: PublicTripDetail
  availableSeats?: number

  error?: string
}

type RequestContext = {
  baseUrl: string
  cookie: string | null
}

function getString(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function formatCurrency(
  value: number,
  currency = "IDR"
): string {
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

function formatDate(value?: string | null): string {
  if (!value) {
    return "Date not selected"
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

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

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatDuration(
  durationMinutes: number
): string {
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return "Duration unavailable"
  }

  const hours = Math.floor(
    durationMinutes / 60
  )

  const minutes =
    durationMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

async function getRequestContext(): Promise<RequestContext> {
  const requestHeaders = await headers()

  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host")

  if (!host) {
    throw new Error(
      "The application host could not be determined."
    )
  }

  const forwardedProtocol =
    requestHeaders.get("x-forwarded-proto")

  const protocol =
    forwardedProtocol ??
    (host.includes("localhost") ||
    host.startsWith("127.0.0.1")
      ? "http"
      : "https")

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? `http://127.0.0.1:${
          process.env.PORT ?? "3000"
        }`
      : `${protocol}://${host}`

  return {
    baseUrl,
    cookie:
      requestHeaders.get("cookie"),
  }
}

async function getTripDetail(
  requestContext: RequestContext,
  tripInventoryId: string,
  passengers: number
): Promise<TripDetailApiResponse> {
  try {
    const url = new URL(
      `/api/trips/${encodeURIComponent(
        tripInventoryId
      )}`,
      requestContext.baseUrl
    )

    url.searchParams.set(
      "passengers",
      String(passengers)
    )

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",

        ...(requestContext.cookie
          ? {
              Cookie:
                requestContext.cookie,
            }
          : {}),
      },
    })

    const responseText =
      await response.text()

    let result: TripDetailApiResponse

    try {
      result = JSON.parse(
        responseText
      ) as TripDetailApiResponse
    } catch {
      console.error(
        "Trip detail API returned non-JSON:",
        {
          url: url.toString(),
          status: response.status,
          contentType:
            response.headers.get(
              "content-type"
            ),
          responsePreview:
            responseText.slice(0, 300),
        }
      )

      return {
        success: false,
        error:
          "The trip detail service returned an invalid response.",
      }
    }

    if (!response.ok) {
      return {
        ...result,
        success: false,

        error:
          result.error ||
          `Trip detail request failed with status ${response.status}.`,
      }
    }

    return result
  } catch (error) {
    console.error(
      "Checkout trip request error:",
      error
    )

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "The selected trip could not be loaded.",
    }
  }
}

function CheckoutUnavailable({
  title = "Trip unavailable",
  message,
  minimumDate,
}: {
  title?: string
  message: string
  minimumDate?: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10 text-slate-900">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          !
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-red-600">
          Checkout unavailable
        </p>

        <h1 className="mt-3 text-3xl font-black">
          {title}
        </h1>

        <p className="mt-4 leading-7 text-slate-500">
          {message}
        </p>

        {minimumDate && (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Earliest booking date:{" "}
            {formatDate(minimumDate)}
          </div>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-cyan-600 px-6 py-3 font-black text-white transition hover:bg-cyan-700"
          >
            Start New Search
          </Link>

        </div>
      </section>
    </main>
  )
}

function SelectedTripCard({
  label,
  trip,
}: {
  label: string
  trip: PublicTripDetail
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
          {label}
        </p>

        <h2 className="mt-1 text-xl font-black">
          {trip.fromPort}

          <span className="mx-2 text-cyan-300">
            →
          </span>

          {trip.toPort}
        </h2>
      </div>

      <div className="p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-sm font-bold text-slate-400">
              Operator
            </p>

            <p className="mt-1 text-lg font-black">
              {trip.operatorName}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {trip.vesselName}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-sm font-bold text-slate-400">
              Travel date
            </p>

            <p className="mt-1 font-black">
              {formatDate(trip.travelDate)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl bg-slate-50 p-5">
          <div>
            <p className="text-2xl font-black">
              {trip.departureTime}
            </p>

            <p className="mt-1 text-sm font-bold">
              {trip.fromPort}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-slate-400">
              {formatDuration(
                trip.durationMinutes
              )}
            </p>

            <p className="mt-1 text-cyan-600">
              ───➜
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black">
              {trip.arrivalTime}

              {trip.arrivalDayOffset > 0 && (
                <span className="ml-1 text-xs text-cyan-600">
                  +{trip.arrivalDayOffset}d
                </span>
              )}
            </p>

            <p className="mt-1 text-sm font-bold">
              {trip.toPort}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Seats available
            </p>

            <p className="mt-1 font-black text-emerald-700">
              {trip.availableSeats}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Adult price
            </p>

            <p className="mt-1 text-xl font-black text-cyan-700">
              {formatCurrency(
                trip.adultPrice,
                trip.currency
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams

  const requestedTripType =
    getString(params.tripType)
      .trim()
      .toLowerCase()

  const tripType: TripType =
    requestedTripType === "round-trip"
      ? "round-trip"
      : "one-way"

  /*
   * tripInventoryId dipertahankan sebagai
   * fallback untuk kompatibilitas flow one-way
   * dan URL lama.
   */
  const legacyTripInventoryId =
    getString(
      params.tripInventoryId
    ).trim()

  const outboundTripInventoryId =
    getString(
      params.outboundTripInventoryId
    ).trim() ||
    legacyTripInventoryId

  const returnTripInventoryId =
    getString(
      params.returnTripInventoryId
    ).trim()

  const requestedDepartureDate =
    getString(
      params.departureDate
    ).trim()

  const requestedReturnDate =
    getString(
      params.returnDate
    ).trim()

  const requestedPassengerCount =
    Number(
      getString(params.passengers)
    )

  const passengerCount =
    Number.isInteger(
      requestedPassengerCount
    ) &&
    requestedPassengerCount >= 1 &&
    requestedPassengerCount <= 20
      ? requestedPassengerCount
      : 1

  if (!outboundTripInventoryId) {
    return (
      <CheckoutUnavailable
        message="The selected outbound trip is missing. Please choose your trip again."
      />
    )
  }

  if (
    tripType === "round-trip" &&
    !returnTripInventoryId
  ) {
    return (
      <CheckoutUnavailable
        title="Return trip is missing"
        message="A round-trip booking requires both an outbound trip and a return trip."
      />
    )
  }

  if (
    tripType === "round-trip" &&
    outboundTripInventoryId ===
      returnTripInventoryId
  ) {
    return (
      <CheckoutUnavailable
        title="Invalid round trip"
        message="The outbound trip and return trip cannot use the same inventory record."
      />
    )
  }

  let requestContext: RequestContext

  try {
    requestContext =
      await getRequestContext()
  } catch (error) {
    return (
      <CheckoutUnavailable
        message={
          error instanceof Error
            ? error.message
            : "The application request context could not be created."
        }
      />
    )
  }

  const outboundRequest =
    getTripDetail(
      requestContext,
      outboundTripInventoryId,
      passengerCount
    )

  const returnRequest:
    Promise<TripDetailApiResponse | null> =
    tripType === "round-trip"
      ? getTripDetail(
          requestContext,
          returnTripInventoryId,
          passengerCount
        )
      : Promise.resolve(null)

  const [
    outboundResult,
    returnResult,
  ] = await Promise.all([
    outboundRequest,
    returnRequest,
  ])

  if (
    !outboundResult.success ||
    !outboundResult.trip
  ) {
    return (
      <CheckoutUnavailable
        title="Outbound trip unavailable"
        message={
          outboundResult.error ||
          "The selected outbound trip could not be loaded."
        }
        minimumDate={
          outboundResult.minimumDate
        }
      />
    )
  }

  if (
    tripType === "round-trip" &&
    (!returnResult?.success ||
      !returnResult.trip)
  ) {
    return (
      <CheckoutUnavailable
        title="Return trip unavailable"
        message={
          returnResult?.error ||
          "The selected return trip could not be loaded."
        }
        minimumDate={
          returnResult?.minimumDate
        }
      />
    )
  }

  const outboundTrip =
    outboundResult.trip

  const returnTrip =
    returnResult?.trip ?? null

  if (
    requestedDepartureDate &&
    requestedDepartureDate !==
      outboundTrip.travelDate
  ) {
    return (
      <CheckoutUnavailable
        title="Outbound date mismatch"
        message="The outbound inventory date does not match the date selected in the search."
      />
    )
  }

  if (
    tripType === "round-trip" &&
    returnTrip &&
    requestedReturnDate &&
    requestedReturnDate !==
      returnTrip.travelDate
  ) {
    return (
      <CheckoutUnavailable
        title="Return date mismatch"
        message="The return inventory date does not match the return date selected in the search."
      />
    )
  }

  if (
    tripType === "round-trip" &&
    returnTrip
  ) {
    const routeIsReversed =
      normalizeText(
        outboundTrip.fromPort
      ) ===
        normalizeText(
          returnTrip.toPort
        ) &&
      normalizeText(
        outboundTrip.toPort
      ) ===
        normalizeText(
          returnTrip.fromPort
        )

    if (!routeIsReversed) {
      return (
        <CheckoutUnavailable
          title="Invalid return route"
          message="The selected return trip must travel back from the outbound destination to the original departure port."
        />
      )
    }

    if (
      returnTrip.travelDate <=
      outboundTrip.travelDate
    ) {
      return (
        <CheckoutUnavailable
          title="Invalid return date"
          message="The return trip must depart after the outbound trip date."
        />
      )
    }

    if (
      returnTrip.currency !==
      outboundTrip.currency
    ) {
      return (
        <CheckoutUnavailable
          title="Currency mismatch"
          message="The outbound and return trips must use the same transaction currency."
        />
      )
    }
  }

  const oneWayCheckoutTrip = {
  id: outboundTrip.tripInventoryId,

  operator:
    outboundTrip.operatorName,

  from:
    outboundTrip.fromPort,

  to:
    outboundTrip.toPort,

  departureTime:
    outboundTrip.departureTime,

  arrivalTime:
    outboundTrip.arrivalTime,

  duration:
    formatDuration(
      outboundTrip.durationMinutes
    ),

  price:
    outboundTrip.adultPrice,

  currency:
    outboundTrip.currency,

  availableSeats:
    outboundTrip.availableSeats,

  checkInLocation:
    "Check-in details will be provided after booking.",

  facilities: [
    "Fast boat",
    "Life jacket",
    "Baggage included",
    "Live availability",
  ],
}

const returnCheckoutTrip =
  returnTrip
    ? {
        id:
          returnTrip.tripInventoryId,

        operator:
          returnTrip.operatorName,

        from:
          returnTrip.fromPort,

        to:
          returnTrip.toPort,

        departureTime:
          returnTrip.departureTime,

        arrivalTime:
          returnTrip.arrivalTime,

        duration:
          formatDuration(
            returnTrip.durationMinutes
          ),

        price:
          returnTrip.adultPrice,

        currency:
          returnTrip.currency,

        availableSeats:
          returnTrip.availableSeats,

        checkInLocation:
          "Check-in details will be provided after booking.",

        facilities: [
          "Fast boat",
          "Life jacket",
          "Baggage included",
          "Live availability",
        ],
      }
    : null

  const outboundTotal =
    outboundTrip.adultPrice *
    passengerCount

  const returnTotal =
    returnTrip
      ? returnTrip.adultPrice *
        passengerCount
      : 0

  const roundTripTotal =
    outboundTotal + returnTotal

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/"
            className="text-3xl font-black"
          >
            Gili{" "}
            <span className="text-cyan-300">
              Go
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
          >
            Cancel Booking
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            Passenger information
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Complete your booking
          </h1>

          <div className="mt-8 flex max-w-3xl items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 font-black text-slate-950">
              ✓
            </div>

            <span className="font-bold">
              Select trip
            </span>

            <div className="h-px flex-1 bg-white/25" />

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-black text-blue-900">
              2
            </div>

            <span className="font-bold">
              Passenger details
            </span>

            <div className="h-px flex-1 bg-white/25" />

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-black">
              3
            </div>

            <span className="text-white/70">
              Confirmation
            </span>
          </div>
        </div>
      </section>

{tripType === "round-trip" &&
    returnTrip && (
      <section className="mx-auto max-w-7xl px-5 pt-10 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
            Selected journeys
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Review your round trip
          </h2>

          <p className="mt-2 text-slate-500">
            Both trip inventories have been
            validated using live availability.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SelectedTripCard
            label="Outbound journey"
            trip={outboundTrip}
          />

          <SelectedTripCard
            label="Return journey"
            trip={returnTrip}
          />
        </div>

        <div className="mt-7 rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-cyan-700">
                Estimated booking total
              </p>

              <p className="mt-2 text-sm text-cyan-900">
                {passengerCount} passenger
                {passengerCount === 1
                  ? ""
                  : "s"}
                {" · "}
                Outbound{" "}
                {formatCurrency(
                  outboundTotal,
                  outboundTrip.currency
                )}
                {" + "}
                Return{" "}
                {formatCurrency(
                  returnTotal,
                  returnTrip.currency
                )}
              </p>
            </div>

            <p className="text-3xl font-black text-cyan-800">
              {formatCurrency(
                roundTripTotal,
                outboundTrip.currency
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={{
              pathname:
                "/search/return",

              query: {
                outboundTripInventoryId:
                  outboundTrip.tripInventoryId,

                from:
                  outboundTrip.fromPort,

                to:
                  outboundTrip.toPort,

                departureDate:
                  outboundTrip.travelDate,

                returnDate:
                  returnTrip.travelDate,

                passengers:
                  passengerCount.toString(),
              },
            }}
            className="rounded-xl border border-cyan-200 bg-white px-5 py-3 text-center font-black text-cyan-700 transition hover:bg-cyan-50"
          >
            Change Return Trip
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center font-black text-slate-700 transition hover:bg-slate-50"
          >
            Start New Search
          </Link>
        </div>
      </section>
    )}

  <CheckoutForm
    trip={oneWayCheckoutTrip}
    returnTrip={
      returnCheckoutTrip
    }
    departureDate={
      outboundTrip.travelDate
    }
    returnDate={
      returnTrip?.travelDate ?? ""
    }
    tripType={tripType}
    passengerCount={
      passengerCount
    }
    roundTripSubmissionEnabled={
      true
    }
  />

    </main>
  )
}