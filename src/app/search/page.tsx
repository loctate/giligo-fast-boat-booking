import Link from "next/link"

import CheckoutForm from "@/components/CheckoutForm"
import { trips } from "@/data/trips"

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

function getString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  if (!value) {
    return "Flexible date"
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams

  const tripType = getString(params.tripType) || "one-way"
  const from = getString(params.from)
  const to = getString(params.to)
  const departureDate = getString(params.departureDate)
  const returnDate = getString(params.returnDate)
  const passengerCount = Math.max(
    1,
    Number(getString(params.passengers)) || 1
  )

  const results = trips.filter((trip) => {
    const matchesDeparture = !from || trip.from === from
    const matchesDestination = !to || trip.to === to

    return matchesDeparture && matchesDestination
  })

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="text-3xl font-black">
            Gili<span className="text-cyan-300">Go</span>
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
            {from || "All departures"}
            <span className="mx-3 text-cyan-300">→</span>
            {to || "All destinations"}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
            <p>
              <span className="font-bold text-white">Departure:</span>{" "}
              {formatDate(departureDate)}
            </p>

            {tripType === "round-trip" && returnDate && (
              <p>
                <span className="font-bold text-white">Return:</span>{" "}
                {formatDate(returnDate)}
              </p>
            )}

            <p>
              <span className="font-bold text-white">Passengers:</span>{" "}
              {passengerCount}
            </p>

            <p>
              <span className="font-bold text-white">Trip:</span>{" "}
              {tripType === "round-trip" ? "Round Trip" : "One Way"}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black">
              {results.length} trip{results.length === 1 ? "" : "s"} found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Demo schedules and prices for presentation purposes.
            </p>
          </div>

          <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none">
            <option>Recommended</option>
            <option>Lowest price</option>
            <option>Earliest departure</option>
          </select>
        </div>

        {results.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">🚤</div>

            <h2 className="mt-5 text-2xl font-black">
              No fast boats found
            </h2>

            <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">
              There are currently no demo schedules available for this route.
              Return to the homepage and try another departure or destination.
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
              const totalPrice = trip.price * passengerCount

              return (
                <article
                  key={trip.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
                >
                  <div className="grid lg:grid-cols-[220px_1fr_230px]">
                    <div className="flex min-h-48 flex-col justify-between bg-slate-900 p-6 text-white">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                          Fast boat operator
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {trip.operator}
                        </h3>
                      </div>

                      <p className="mt-6 text-xs text-white/50">
                        Demo operator · Trip {trip.id}
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
                        <div>
                          <p className="text-3xl font-black">
                            {trip.departureTime}
                          </p>
                          <p className="mt-1 font-bold">{trip.from}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {trip.checkInLocation}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-400">
                            {trip.duration}
                          </p>

                          <div className="my-2 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-cyan-600" />
                            <span className="h-px w-24 bg-slate-300" />
                            <span className="text-cyan-700">➜</span>
                          </div>

                          <p className="text-xs font-bold text-emerald-600">
                            Direct trip
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-3xl font-black">
                            {trip.arrivalTime}
                          </p>
                          <p className="mt-1 font-bold">{trip.to}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Estimated arrival
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                        {trip.facilities.map((facility) => (
                          <span
                            key={facility}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            ✓ {facility}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
                      <div>
                        <p className="text-sm text-slate-500">
                          Price per passenger
                        </p>

                        <p className="mt-1 text-2xl font-black text-cyan-700">
                          {formatCurrency(trip.price)}
                        </p>

                        <p className="mt-4 text-sm text-slate-500">
                          Total for {passengerCount} passenger
                          {passengerCount === 1 ? "" : "s"}
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {formatCurrency(totalPrice)}
                        </p>

                        <p className="mt-4 text-sm font-bold text-emerald-600">
                          {trip.availableSeats} seats available
                        </p>
                      </div>

                      <Link
                              href={{
                                pathname: "/checkout",
                                query: {
                                  tripId: trip.id,
                                  departureDate,
                                  returnDate,
                                  tripType,
                                  passengers: passengerCount.toString(),
                                },
                              }}
                          className="mt-6 block w-full rounded-xl bg-cyan-600 px-5 py-3.5 text-center font-black text-white transition hover:bg-cyan-700"
                            >
                          Select Trip
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