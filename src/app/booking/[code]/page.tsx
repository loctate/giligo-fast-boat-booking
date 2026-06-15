"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

type BookingData = {
  bookingCode: string
  createdAt: string
  bookingStatus: string
  paymentStatus: string
  tripType: string
  departureDate: string
  returnDate: string
  passengerCount: number
  totalPrice: number

  customer: {
    fullName: string
    email: string
    whatsapp: string
    country: string
  }

  passengers: {
    number: number
    name: string
  }[]

  notes: string

  trip: {
    id: string
    operator: string
    from: string
    to: string
    departureTime: string
    arrivalTime: string
    duration: string
    price: number
    checkInLocation: string
  }
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
    return "Date not selected"
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function BookingConfirmationPage() {
  const params = useParams<{ code: string }>()
  const code = params.code

  const [booking, setBooking] =
    useState<BookingData | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedBooking = sessionStorage.getItem(
        `giligo_booking_${code}`
      )

      if (savedBooking) {
        setBooking(JSON.parse(savedBooking))
      }
    } catch {
      setBooking(null)
    } finally {
      setIsLoading(false)
    }
  }, [code])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="font-bold text-slate-500">
          Loading booking confirmation...
        </p>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="text-5xl">🔎</div>

          <h1 className="mt-5 text-3xl font-black">
            Booking not found
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            This demo booking is unavailable in the current browser
            session.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white"
          >
            Create New Booking
          </Link>
        </div>
      </main>
    )
  }

  const whatsappMessage = [
    "GiliGo Demo Booking",
    `Booking code: ${booking.bookingCode}`,
    `Passenger: ${booking.customer.fullName}`,
    `Route: ${booking.trip.from} to ${booking.trip.to}`,
    `Departure: ${formatDate(booking.departureDate)}`,
    `Time: ${booking.trip.departureTime}`,
    `Operator: ${booking.trip.operator}`,
    `Total: ${formatCurrency(booking.totalPrice)}`,
  ].join("\n")

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="text-3xl font-black">
            Gili<span className="text-cyan-300">Go</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold hover:bg-white hover:text-slate-950"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-emerald-600 to-cyan-700 py-14 text-white print:bg-white print:text-slate-900">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl text-emerald-600 shadow-lg">
            ✓
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100 print:text-slate-500">
            Booking confirmed
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Your trip is reserved!
          </h1>

          <p className="mt-4 text-white/80 print:text-slate-500">
            Demo confirmation for presentation purposes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
          <div className="space-y-7">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 bg-slate-950 p-6 text-white sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Booking code
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-wider">
                    {booking.bookingCode}
                  </p>
                </div>

                <span className="self-start rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-emerald-950">
                  {booking.bookingStatus}
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid gap-7 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p className="text-4xl font-black">
                      {booking.trip.departureTime}
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {booking.trip.from}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {booking.trip.checkInLocation}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400">
                      {booking.trip.duration}
                    </p>

                    <div className="my-2 text-2xl text-cyan-700">
                      ─────➜
                    </div>

                    <p className="text-xs font-bold text-emerald-600">
                      Direct trip
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-4xl font-black">
                      {booking.trip.arrivalTime}
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {booking.trip.to}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Estimated arrival
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Departure date
                    </p>

                    <p className="mt-2 font-black">
                      {formatDate(booking.departureDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fast boat operator
                    </p>

                    <p className="mt-2 font-black">
                      {booking.trip.operator}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black">
                Passenger details
              </h2>

              <div className="mt-6 divide-y divide-slate-100">
                {booking.passengers.map((passenger) => (
                  <div
                    key={passenger.number}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Passenger {passenger.number}
                      </p>

                      <p className="mt-1 font-black">
                        {passenger.name}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Adult
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Payment summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-slate-500">
                  <span>
                    {booking.passengerCount} passenger
                    {booking.passengerCount === 1 ? "" : "s"}
                  </span>

                  <span>
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                  <span className="font-black">
                    Total
                  </span>

                  <span className="text-xl font-black text-cyan-700">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Payment status
                </p>

                <p className="mt-1 font-black text-amber-900">
                  {booking.paymentStatus}
                </p>

                <p className="mt-2 text-xs leading-5 text-amber-700">
                  No actual payment was processed.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Booking contact
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">Name</p>
                  <p className="font-bold">
                    {booking.customer.fullName}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="break-all font-bold">
                    {booking.customer.email}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">WhatsApp</p>
                  <p className="font-bold">
                    {booking.customer.whatsapp}
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full rounded-xl bg-cyan-600 px-5 py-3.5 font-black text-white hover:bg-cyan-700"
              >
                Print / Save as PDF
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-xl border border-emerald-500 px-5 py-3.5 text-center font-black text-emerald-700 hover:bg-emerald-50"
              >
                Share via WhatsApp
              </a>

              <Link
                href="/"
                className="block w-full rounded-xl border border-slate-300 px-5 py-3.5 text-center font-black text-slate-700 hover:bg-slate-50"
              >
                Book Another Trip
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}