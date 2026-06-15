import Link from "next/link"

import CheckoutForm from "./CheckoutForm"
import { trips } from "@/data/trips"

type CheckoutPageProps = {
  searchParams: Promise<{
    tripId?: string | string[]
    tripType?: string | string[]
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

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams

  const tripId = getString(params.tripId)
  const tripType = getString(params.tripType) || "one-way"
  const departureDate = getString(params.departureDate)
  const returnDate = getString(params.returnDate)

  const passengerCount = Math.min(
    10,
    Math.max(
      1,
      Number(getString(params.passengers)) || 1
    )
  )

  const trip = trips.find((item) => item.id === tripId)

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="text-5xl">🚤</div>

          <h1 className="mt-5 text-3xl font-black">
            Trip not found
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            The selected fast boat schedule is unavailable or the
            checkout link is incomplete.
          </p>

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
        <CheckoutForm
          trip={trip}
          departureDate={departureDate}
          returnDate={returnDate}
          tripType={tripType}
          passengerCount={passengerCount}
        />
      </section>
    </main>
  )
}