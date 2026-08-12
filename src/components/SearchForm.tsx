"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

type TripType =
  | "one-way"
  | "round-trip"

type AvailabilityRoute = {
  fromPort: string
  toPort: string
  dates: string[]
}

type AvailabilityResponse = {
  success: boolean
  minimumDate?: string
  passengers?: number
  origins?: string[]
  routes?: AvailabilityRoute[]
  error?: string
}

function formatDisplayDate(
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
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date)
}

export default function SearchForm() {
  const [tripType, setTripType] =
    useState<TripType>("one-way")
  const [passengers, setPassengers] =
    useState("1")
  const [fromPort, setFromPort] =
    useState("")
  const [toPort, setToPort] =
    useState("")
  const [departureDate, setDepartureDate] =
    useState("")
  const [returnDate, setReturnDate] =
    useState("")
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null)
  const [isLoading, setIsLoading] =
    useState(true)
  const [loadError, setLoadError] =
    useState("")

  useEffect(() => {
    const controller = new AbortController()

    async function loadAvailability() {
      setIsLoading(true)
      setLoadError("")

      try {
        const response = await fetch(
          `/api/trips/availability?passengers=${encodeURIComponent(
            passengers
          )}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        )

        const data =
          (await response.json()) as AvailabilityResponse

        if (
          !response.ok ||
          data.success !== true
        ) {
          throw new Error(
            data.error ||
              "Available trips could not be loaded."
          )
        }

        setAvailability(data)
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return
        }

        setAvailability(null)
        setLoadError(
          error instanceof Error
            ? error.message
            : "Available trips could not be loaded."
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      controller.abort()
    }
  }, [passengers])

  const origins = useMemo(
    () => availability?.origins ?? [],
    [availability]
  )

  const routes = useMemo(
    () => availability?.routes ?? [],
    [availability]
  )

  const effectiveFromPort =
    origins.includes(fromPort) ? fromPort : ""

  const destinations = useMemo(
    () =>
      Array.from(
        new Set(
          routes
            .filter(
              (route) =>
                route.fromPort === effectiveFromPort
            )
            .map((route) => route.toPort)
        )
      ).sort((first, second) =>
        first.localeCompare(second, "en", {
          sensitivity: "base",
        })
      ),
    [routes, effectiveFromPort]
  )

  const effectiveToPort =
    destinations.includes(toPort) ? toPort : ""

  const outboundRoute = useMemo(
    () =>
      routes.find(
        (route) =>
          route.fromPort === effectiveFromPort &&
          route.toPort === effectiveToPort
      ) ?? null,
    [routes, effectiveFromPort, effectiveToPort]
  )

  const departureDates = useMemo(
    () => outboundRoute?.dates ?? [],
    [outboundRoute]
  )

  const effectiveDepartureDate =
    departureDates.includes(departureDate)
      ? departureDate
      : ""

  const returnRoute = useMemo(
    () =>
      routes.find(
        (route) =>
          route.fromPort === effectiveToPort &&
          route.toPort === effectiveFromPort
      ) ?? null,
    [routes, effectiveFromPort, effectiveToPort]
  )

  const returnDates = useMemo(
    () =>
      (returnRoute?.dates ?? []).filter(
        (date) =>
          !effectiveDepartureDate ||
          date > effectiveDepartureDate
      ),
    [returnRoute, effectiveDepartureDate]
  )

  const effectiveReturnDate =
    returnDates.includes(returnDate)
      ? returnDate
      : ""

  function handleFromChange(value: string) {
    setFromPort(value)
    setToPort("")
    setDepartureDate("")
    setReturnDate("")
  }

  function handleToChange(value: string) {
    setToPort(value)
    setDepartureDate("")
    setReturnDate("")
  }

  function handleDepartureChange(value: string) {
    setDepartureDate(value)
    setReturnDate("")
  }

  function handleTripTypeChange(value: TripType) {
    setTripType(value)

    if (value === "one-way") {
      setReturnDate("")
    }
  }

  const noInventory =
    !isLoading &&
    !loadError &&
    routes.length === 0

  const hasValidSelection = Boolean(
    effectiveFromPort &&
      effectiveToPort &&
      effectiveDepartureDate &&
      (tripType === "one-way" ||
        effectiveReturnDate)
  )

  return (
    <form action="/search" method="GET">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <label className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name="tripType"
            value="one-way"
            checked={tripType === "one-way"}
            onChange={() =>
              handleTripTypeChange("one-way")
            }
          />
          <span className="block rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-500 transition peer-checked:bg-white peer-checked:text-cyan-700 peer-checked:shadow-sm">
            One Way
          </span>
        </label>

        <label className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name="tripType"
            value="round-trip"
            checked={tripType === "round-trip"}
            onChange={() =>
              handleTripTypeChange("round-trip")
            }
          />
          <span className="block rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-500 transition peer-checked:bg-white peer-checked:text-cyan-700 peer-checked:shadow-sm">
            Round Trip
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            From
          </span>
          <select
            name="from"
            required
            disabled={
              isLoading ||
              Boolean(loadError) ||
              origins.length === 0
            }
            value={effectiveFromPort}
            onChange={(event) =>
              handleFromChange(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">
              {isLoading
                ? "Loading departures..."
                : "Select departure"}
            </option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            To
          </span>
          <select
            name="to"
            required
            disabled={
              !effectiveFromPort ||
              destinations.length === 0
            }
            value={effectiveToPort}
            onChange={(event) =>
              handleToChange(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">
              {effectiveFromPort
                ? "Select destination"
                : "Select departure first"}
            </option>
            {destinations.map((destination) => (
              <option
                key={destination}
                value={destination}
              >
                {destination}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Departure date
          </span>
          <select
            name="departureDate"
            required
            disabled={
              !outboundRoute ||
              departureDates.length === 0
            }
            value={effectiveDepartureDate}
            onChange={(event) =>
              handleDepartureChange(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">
              {effectiveToPort
                ? "Select available date"
                : "Select route first"}
            </option>
            {departureDates.map((date) => (
              <option key={date} value={date}>
                {formatDisplayDate(date)}
              </option>
            ))}
          </select>
        </label>

        {tripType === "round-trip" && (
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Return date
            </span>
            <select
              name="returnDate"
              required
              disabled={
                !effectiveDepartureDate ||
                returnDates.length === 0
              }
              value={effectiveReturnDate}
              onChange={(event) =>
                setReturnDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            >
              <option value="">
                {!effectiveDepartureDate
                  ? "Select departure date first"
                  : returnDates.length > 0
                    ? "Select return date"
                    : "No return dates available"}
              </option>
              {returnDates.map((date) => (
                <option key={date} value={date}>
                  {formatDisplayDate(date)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Passengers
          </span>
          <select
            name="passengers"
            value={passengers}
            onChange={(event) =>
              setPassengers(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="1">1 Adult</option>
            <option value="2">2 Adults</option>
            <option value="3">3 Adults</option>
            <option value="4">4 Adults</option>
            <option value="5">5 Adults</option>
            <option value="6">6 Adults</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
        <p className="text-center text-xs font-semibold leading-5 text-cyan-800">
          {isLoading
            ? "Loading currently available trips..."
            : loadError
              ? loadError
              : noInventory
                ? "No bookable fast boat inventory is currently available for the selected passenger count."
                : availability?.minimumDate
                  ? `Only routes and dates with available inventory from ${formatDisplayDate(
                      availability.minimumDate
                    )} onwards are shown.`
                  : "Only currently available routes and dates are shown."}
        </p>
      </div>

      <button
        type="submit"
        disabled={
          isLoading ||
          Boolean(loadError) ||
          !hasValidSelection
        }
        className="mt-5 w-full rounded-xl bg-cyan-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-cyan-600/25 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
      >
        Search Fast Boat
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Available payment options are shown after booking.
      </p>
    </form>
  )
}
