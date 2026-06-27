import Link from "next/link"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

type ReturnSearchPageProps = {
  searchParams: Promise<{
    outboundTripInventoryId?: string | string[]
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
    return value || "Date not selected"
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

async function searchAvailableTrips({
  from,
  to,
  travelDate,
  passengers,
}: {
  from: string
  to: string
  travelDate: string
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
      travelDate
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
        "Return search API returned non-JSON:",
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
          "The return-trip search service returned an invalid response.",
      }
    }

    if (!response.ok) {
      return {
        ...result,
        success: false,
        error:
          result.error ||
          `Return-trip search failed with status ${response.status}.`,
      }
    }

    return result
  } catch (error) {
    console.error(
      "Return search page request error:",
      error
    )

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Available return trips could not be loaded.",
    }
  }
}

export default async function ReturnSearchPage({
  searchParams,
}: ReturnSearchPageProps) {
  const params = await searchParams

  const outboundTripInventoryId =
    getString(
      params.outboundTripInventoryId
    ).trim()

  const outboundFrom =
    getString(params.from).trim()

  const outboundTo =
    getString(params.to).trim()

  const departureDate =
    getString(
      params.departureDate
    ).trim()

  const returnDate =
    getString(params.returnDate).trim()

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

  // Rute perjalanan pulang adalah
  // kebalikan dari rute perjalanan pergi.
  const returnFrom = outboundTo
  const returnTo = outboundFrom

  let searchResult: SearchApiResponse

  if (!outboundTripInventoryId) {
    searchResult = {
      success: false,
      error:
        "The selected outbound trip is missing. Please select the outbound trip again.",
    }
  } else if (
    !outboundFrom ||
    !outboundTo ||
    !departureDate ||
    !returnDate
  ) {
    searchResult = {
      success: false,
      error:
        "The round-trip search information is incomplete.",
    }
  } else if (
    returnDate <= departureDate
  ) {
    searchResult = {
      success: false,
      error:
        "The return date must be after the departure date.",
    }
  } else {
    searchResult =
      await searchAvailableTrips({
        from: returnFrom,
        to: returnTo,
        travelDate: returnDate,
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
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
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
            href={{
              pathname: "/search",
              query: {
                tripType: "round-trip",
                from: outboundFrom,
                to: outboundTo,
                departureDate,
                returnDate,
                passengers:
                  passengerCount.toString(),
              },
            }}
            className="inline-flex w-fit rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
          >
            Change Outbound Trip
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            Step 2 of 2
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Choose your return trip
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-white/75">
            Select an available fast boat from{" "}
            <span className="font-black text-white">
              {returnFrom || "Destination"}
            </span>{" "}
            back to{" "}
            <span className="font-black text-white">
              {returnTo || "Departure"}
            </span>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Outbound route
            </p>

            <p className="mt-2 font-black">
              {outboundFrom || "-"}{" "}
              <span className="text-cyan-600">
                →
              </span>{" "}
              {outboundTo || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Outbound date
            </p>

            <p className="mt-2 font-black">
              {formatDate(departureDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Return route
            </p>

            <p className="mt-2 font-black">
              {returnFrom || "-"}{" "}
              <span className="text-cyan-600">
                →
              </span>{" "}
              {returnTo || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Return date
            </p>

            <p className="mt-2 font-black">
              {formatDate(returnDate)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {passengerCount} passenger
              {passengerCount === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {!searchResult.success && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-black">
              Return-trip search could not be completed
            </p>

            <p className="mt-2 text-sm leading-6">
              {searchResult.error ||
                "Available return trips could not be loaded."}
            </p>

            {searchResult.minimumDate && (
              <p className="mt-3 text-sm font-bold">
                Earliest booking date:{" "}
                {formatDate(
                  searchResult.minimumDate
                )}
              </p>
            )}

            <Link
              href={{
                pathname: "/search",
                query: {
                  tripType: "round-trip",
                  from: outboundFrom,
                  to: outboundTo,
                  departureDate,
                  returnDate,
                  passengers:
                    passengerCount.toString(),
                },
              }}
              className="mt-5 inline-flex rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-700"
            >
              Return to Outbound Search
            </Link>
          </div>
        )}

        {searchResult.success && (
          <>
            <div className="mt-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
                  Available return boats
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {results.length} trip
                  {results.length === 1
                    ? ""
                    : "s"}{" "}
                  found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Live schedules, prices and seat
                  availability for the return journey.
                </p>
              </div>

              <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">
                {formatDate(returnDate)}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="text-5xl">
                  🚤
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  No return boats found
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
                  There are currently no available
                  return boats for this route, date,
                  and number of passengers.
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-black text-white transition hover:bg-cyan-700"
                >
                  Start a New Search
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
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
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="grid lg:grid-cols-[1fr_270px]">
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                                Return fast boat
                              </p>

                              <h3 className="mt-2 text-2xl font-black">
                                {trip.operatorName}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {trip.vesselName}
                              </p>
                            </div>

                            <div className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
                              {trip.availableSeats}{" "}
                              seats available
                            </div>
                          </div>

                          <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                            <div>
                              <p className="text-3xl font-black">
                                {trip.departureTime}
                              </p>

                              <p className="mt-2 text-lg font-black">
                                {trip.fromPort}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {trip.fromIsland ||
                                  "Departure port"}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {duration}
                              </p>

                              <div className="my-3 text-xl text-cyan-600">
                                ─────➜
                              </div>

                              <p className="text-xs font-bold text-slate-500">
                                Direct trip
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-3xl font-black">
                                {trip.arrivalTime}

                                {trip.arrivalDayOffset >
                                  0 && (
                                  <span className="ml-2 text-sm text-cyan-600">
                                    +
                                    {
                                      trip.arrivalDayOffset
                                    }
                                    d
                                  </span>
                                )}
                              </p>

                              <p className="mt-2 text-lg font-black">
                                {trip.toPort}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {trip.toIsland ||
                                  "Arrival port"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-7 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                            {[
                              "Fast boat",
                              "Life jacket",
                              "Baggage included",
                              "Live availability",
                            ].map((facility) => (
                              <span
                                key={facility}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
                              >
                                ✓ {facility}
                              </span>
                            ))}
                          </div>
                        </div>

                        <aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Adult price
                          </p>

                          <p className="mt-2 text-2xl font-black">
                            {formatCurrency(
                              trip.adultPrice,
                              trip.currency
                            )}
                          </p>

                          <p className="mt-5 text-xs leading-5 text-slate-500">
                            Estimated return total for{" "}
                            {passengerCount} passenger
                            {passengerCount === 1
                              ? ""
                              : "s"}
                          </p>

                          <p className="mt-1 text-xl font-black text-cyan-700">
                            {formatCurrency(
                              totalPrice,
                              trip.currency
                            )}
                          </p>

                          <Link
                            href={{
                              pathname: "/checkout",
                              query: {
                                // Legacy parameter is kept
                                // temporarily until checkout
                                // supports both trip legs.
                                tripInventoryId:
                                  outboundTripInventoryId,

                                outboundTripInventoryId,
                                returnTripInventoryId:
                                  trip.tripInventoryId,

                                tripType:
                                  "round-trip",
                                departureDate,
                                returnDate,
                                passengers:
                                  passengerCount.toString(),
                              },
                            }}
                            className="mt-6 block w-full rounded-xl bg-cyan-600 px-5 py-3.5 text-center font-black text-white transition hover:bg-cyan-700"
                          >
                            Select Return Trip
                          </Link>
                        </aside>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}