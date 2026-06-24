import Link from "next/link"
import { headers } from "next/headers"

import CheckoutForm from "./CheckoutForm"

export const dynamic = "force-dynamic"

type CheckoutPageProps = {
  searchParams: Promise<{
    tripInventoryId?: string | string[]
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

function getString(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
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

  const minutes = durationMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

async function getTripDetail(
  tripInventoryId: string,
  passengers: number
): Promise<TripDetailApiResponse> {
  try {
    const requestHeaders = await headers()

    const host =
      requestHeaders.get("x-forwarded-host") ??
      requestHeaders.get("host")

    if (!host) {
      return {
        success: false,
        error:
          "The application host could not be determined.",
      }
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

    const url = new URL(
      `/api/trips/${encodeURIComponent(
        tripInventoryId
      )}`,
      baseUrl
    )

    url.searchParams.set(
      "passengers",
      String(passengers)
    )

    const cookie =
      requestHeaders.get("cookie")

    const response = await fetch(url, {
      cache: "no-store",

      headers: {
        Accept: "application/json",

        ...(cookie
          ? {
              Cookie: cookie,
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
  message,
  minimumDate,
}: {
  message: string
  minimumDate?: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="text-5xl">
          🚤
        </div>

        <h1 className="mt-5 text-3xl font-black">
          Trip unavailable
        </h1>

        <p className="mt-3 leading-7 text-slate-500">
          {message}
        </p>

        {minimumDate && (
          <p className="mt-3 text-sm font-bold text-amber-700">
            Earliest booking date:{" "}
            {minimumDate}
          </p>
        )}

        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
        >
          Return to Search
        </Link>
      </div>
    </main>
  )
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams

  const tripInventoryId = getString(
    params.tripInventoryId
  ).trim()

  const tripType =
    getString(params.tripType) || "one-way"

  const returnDate = getString(
    params.returnDate
  ).trim()

  const requestedPassengerCount = Number(
    getString(params.passengers)
  )

  const passengerCount =
    Number.isInteger(requestedPassengerCount) &&
    requestedPassengerCount >= 1 &&
    requestedPassengerCount <= 20
      ? requestedPassengerCount
      : 1

  if (!tripInventoryId) {
    return (
      <CheckoutUnavailable
        message="The checkout link does not contain a valid trip inventory ID."
      />
    )
  }

  const tripResult = await getTripDetail(
    tripInventoryId,
    passengerCount
  )

  if (
    !tripResult.success ||
    !tripResult.trip
  ) {
    return (
      <CheckoutUnavailable
        message={
          tripResult.error ||
          "The selected trip is no longer available."
        }
        minimumDate={
          tripResult.minimumDate
        }
      />
    )
  }

  const tripDetail = tripResult.trip

  const trip = {
    id: tripDetail.tripInventoryId,

    operator:
      tripDetail.operatorName,

    from:
      tripDetail.fromPort,

    to:
      tripDetail.toPort,

    departureTime:
      tripDetail.departureTime,

    arrivalTime:
      tripDetail.arrivalTime,

    duration: formatDuration(
      tripDetail.durationMinutes
    ),

    price:
      tripDetail.adultPrice,

    availableSeats:
      tripDetail.availableSeats,

    checkInLocation:
      "Check-in details will be provided after booking.",

    facilities: [
      "Fast boat",
      "Life jacket",
      "Baggage included",
      "Live availability",
    ],
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/"
            className="text-3xl font-black"
          >
            Gili
            <span className="text-cyan-300">
              Go
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
          >
            Cancel Booking
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Passenger information
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Complete your booking
          </h1>

          <div className="mt-7 flex max-w-2xl items-center text-xs font-bold sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-cyan-800">
                ✓
              </span>

              Select trip
            </div>

            <div className="mx-3 h-px flex-1 bg-white/30" />

            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                2
              </span>

              Passenger details
            </div>

            <div className="mx-3 h-px flex-1 bg-white/30" />

            <div className="flex items-center gap-2 text-white/60">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40">
                3
              </span>

              Confirmation
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {tripType === "round-trip" && (
          <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="font-black">
              Outbound trip only
            </p>

            <p className="mt-1 text-sm">
              The current checkout contains the
              selected outbound trip. Return-trip
              selection will be connected in a
              later stage.
            </p>
          </div>
        )}

        <CheckoutForm
          trip={trip}
          departureDate={
            tripDetail.travelDate
          }
          returnDate={returnDate}
          tripType={tripType}
          passengerCount={
            passengerCount
          }
        />
      </section>
    </main>
  )
}
