import Link from "next/link"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

type SearchPageProps = {
  searchParams: Promise<{
    tripType?: string | string[]
    from?: string | string[]
    to?: string | string[]
    departureDate?: string | string[]
    returnDate?: string | string[]
    passengers?: string | string[]
  }>
}

type PublicTrip = {
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

  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string
}

type SearchApiResponse = {
  success: boolean

  minimumDate?: string

  search?: {
    fromPort: string
    toPort: string
    travelDate: string
    passengers: number
  }

  total?: number
  trips?: PublicTrip[]
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

function formatDate(value: string): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return value || "Flexible date"
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  )

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time
    .split(":")
    .map(Number)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return 0
  }

  return hours * 60 + minutes
}


function formatDuration(
  departureTime: string,
  arrivalTime: string,
  arrivalDayOffset: number
): string {
  const departureMinutes =
    timeToMinutes(departureTime)

  const arrivalMinutes =
    timeToMinutes(arrivalTime) +
    arrivalDayOffset * 1440

  const durationMinutes =
    arrivalMinutes - departureMinutes

  if (durationMinutes <= 0) {
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

async function searchAvailableTrips({
  from,
  to,
  departureDate,
  passengers,
}: {
  from: string
  to: string
  departureDate: string
  passengers: number
}): Promise<SearchApiResponse> {
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
      "/api/trips/search",
      baseUrl
    )

    url.searchParams.set(
      "fromPort",
      from
    )

    url.searchParams.set(
      "toPort",
      to
    )

    url.searchParams.set(
      "travelDate",
      departureDate
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

    let result: SearchApiResponse

    try {
      result = JSON.parse(
        responseText
      ) as SearchApiResponse
    } catch {
      console.error(
        "Search API returned non-JSON:",
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
          "The trip search service returned an invalid response.",
      }
    }

    if (!response.ok) {
      return {
        ...result,
        success: false,
        error:
          result.error ||
          `Trip search failed with status ${response.status}.`,
      }
    }

    return result
  } catch (error) {
    console.error(
      "Search page request error:",
      error
    )

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Available trips could not be loaded.",
    }
  }
}


export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams

  const tripType =
    getString(params.tripType) || "one-way"

  const from = getString(params.from).trim()
  const to = getString(params.to).trim()

  const departureDate = getString(
    params.departureDate
  ).trim()

  const returnDate = getString(
    params.returnDate
  ).trim()

  const requestedPassengerCount = Number(
    getString(params.passengers)
  )

  const passengerCount =
    Number.isInteger(requestedPassengerCount) &&
    requestedPassengerCount >= 1
      ? requestedPassengerCount
      : 1

  let searchResult: SearchApiResponse

  if (!from || !to || !departureDate) {
    searchResult = {
      success: false,
      error:
        "Please select a departure port, destination port, and travel date.",
    }
  } else {
    searchResult = await searchAvailableTrips({
      from,
      to,
      departureDate,
      passengers: passengerCount,
    })
  }

  const results =
    searchResult.success &&
    Array.isArray(searchResult.trips)
      ? searchResult.trips
      : []

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
            New Search
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Available fast boats
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {from || "Departure"}
            <span className="mx-3 text-cyan-300">
              →
            </span>
            {to || "Destination"}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <p>
              <span className="font-bold text-white">
                Departure:
              </span>{" "}
              {formatDate(departureDate)}
            </p>

            {tripType === "round-trip" &&
              returnDate && (
                <p>
                  <span className="font-bold text-white">
                    Return:
                  </span>{" "}
                  {formatDate(returnDate)}
                </p>
              )}

            <p>
              <span className="font-bold text-white">
                Passengers:
              </span>{" "}
              {passengerCount}
            </p>

            <p>
              <span className="font-bold text-white">
                Trip:
              </span>{" "}
              {tripType === "round-trip"
                ? "Round Trip"
                : "One Way"}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        {!searchResult.success && (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Search could not be completed
            </p>

            <p className="mt-1 text-sm">
              {searchResult.error ||
                "Available trips could not be loaded."}
            </p>

            {searchResult.minimumDate && (
              <p className="mt-2 text-sm font-bold">
                Earliest booking date:{" "}
                {formatDate(
                  searchResult.minimumDate
                )}
              </p>
            )}
          </div>
        )}

        {tripType === "round-trip" &&
          searchResult.success && (
            <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              <p className="font-black">
                Outbound trip selection
              </p>

              <p className="mt-1 text-sm">
               Choose your outbound trip first. After that, you will
  select an available return trip from {to} to {from} on{" "}
  {formatDate(returnDate)}.
              </p>
            </div>
          )}

        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black">
              {results.length} trip
              {results.length === 1 ? "" : "s"}{" "}
              found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live schedules, prices, and seat
              availability from the operational
              inventory.
            </p>
          </div>

          <select
            aria-label="Sort trips"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
          >
            <option>Recommended</option>
            <option>Lowest price</option>
            <option>
              Earliest departure
            </option>
          </select>
        </div>

        {results.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">
              🚤
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No fast boats found
            </h2>

            <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">
              There are currently no available
              fast boats for this route, date,
              and number of passengers. Try
              another travel date or route.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
            >
              Change Search
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {results.map((trip) => {
              const totalPrice =
                trip.adultPrice *
                passengerCount

              const duration =
                formatDuration(
                  trip.departureTime,
                  trip.arrivalTime,
                  trip.arrivalDayOffset
                )

              return (
                <article
                  key={trip.tripInventoryId}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-[220px_1fr_230px]">
                    <div className="flex min-h-48 flex-col justify-between bg-slate-900 p-6 text-white">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                          Fast boat operator
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {trip.operatorName}
                        </h3>

                        <p className="mt-2 text-sm text-white/70">
                          {trip.vesselName}
                        </p>
                      </div>

                      <p className="mt-6 text-xs text-white/50">
                        {trip.operatorCode}
                        {" · "}
                        {trip.scheduleCode}
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
                        <div>
                          <p className="text-3xl font-black">
                            {
                              trip.departureTime
                            }
                          </p>

                          <p className="mt-1 font-bold">
                            {trip.fromPort}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {trip.fromIsland ||
                              "Check-in details after booking"}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-400">
                            {duration}
                          </p>

                          <div className="my-2 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-cyan-600" />
                            <span className="h-px w-24 bg-slate-300" />
                            <span className="text-cyan-700">
                              ➜
                            </span>
                          </div>

                          <p className="text-xs font-bold text-emerald-600">
                            Direct trip
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-3xl font-black">
                            {trip.arrivalTime}

                            {trip.arrivalDayOffset >
                              0 && (
                              <span className="ml-1 text-sm text-slate-500">
                                +{
                                  trip.arrivalDayOffset
                                }d
                              </span>
                            )}
                          </p>

                          <p className="mt-1 font-bold">
                            {trip.toPort}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {trip.toIsland ||
                              "Estimated arrival"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          ✓ Fast boat
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          ✓ Life jacket
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          ✓ Baggage included
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                          ✓ Live availability
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
                      <div>
                        <p className="text-sm text-slate-500">
                          Adult price
                        </p>

                        <p className="mt-1 text-2xl font-black text-cyan-700">
                          {formatCurrency(
                            trip.adultPrice,
                            trip.currency
                          )}
                        </p>

                        <p className="mt-4 text-sm text-slate-500">
                          Estimated total for{" "}
                          {passengerCount} passenger
                          {passengerCount === 1
                            ? ""
                            : "s"}
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {formatCurrency(
                            totalPrice,
                            trip.currency
                          )}
                        </p>

                        <p className="mt-4 text-sm font-bold text-emerald-600">
                          {trip.availableSeats} seats
                          available
                        </p>
                      </div>

                      <Link
  href={
    tripType === "round-trip"
      ? {
          pathname: "/search/return",
          query: {
            outboundTripInventoryId:
              trip.tripInventoryId,
            from,
            to,
            departureDate:
              trip.travelDate,
            returnDate,
            passengers:
              passengerCount.toString(),
          },
        }
      : {
          pathname: "/checkout",
          query: {
            tripInventoryId:
              trip.tripInventoryId,
            departureDate:
              trip.travelDate,
            tripType: "one-way",
            passengers:
              passengerCount.toString(),
          },
        }
  }
  className="mt-6 block w-full rounded-xl bg-cyan-600 px-5 py-3.5 text-center font-black text-white transition hover:bg-cyan-700"
>
  {tripType === "round-trip"
    ? "Choose Outbound Trip"
    : "Select Trip"}
</Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}