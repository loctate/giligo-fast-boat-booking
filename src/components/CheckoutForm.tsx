"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

type CheckoutTrip = {
  id: string
  operator: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  availableSeats: number
  checkInLocation: string
  facilities: string[]
}

type CheckoutFormProps = {
  trip: CheckoutTrip
  departureDate: string
  returnDate: string
  tripType: string
  passengerCount: number
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
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function CheckoutForm({
  trip,
  departureDate,
  returnDate,
  tripType,
  passengerCount,
}: CheckoutFormProps) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const totalPrice = trip.price * passengerCount

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage("")

    const formData = new FormData(event.currentTarget)

    const passengers = Array.from(
      { length: passengerCount },
      (_, index) => ({
        number: index + 1,
        name: String(
          formData.get(`passengerName${index + 1}`) ?? ""
        ).trim(),
      })
    )

    const datePart = new Date()
      .toISOString()
      .slice(2, 10)
      .replaceAll("-", "")

    const randomPart = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()

    const bookingCode = `GG-${datePart}-${randomPart}`

    const bookingData = {
      bookingCode,
      createdAt: new Date().toISOString(),
      bookingStatus: "Confirmed",
      paymentStatus: "Demo",
      tripType,
      departureDate,
      returnDate,
      passengerCount,
      totalPrice,

      customer: {
        fullName: String(formData.get("fullName") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        whatsapp: String(formData.get("whatsapp") ?? "").trim(),
        country: String(formData.get("country") ?? "").trim(),
      },

      passengers,

      notes: String(formData.get("notes") ?? "").trim(),

      trip: {
        id: trip.id,
        operator: trip.operator,
        from: trip.from,
        to: trip.to,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        duration: trip.duration,
        price: trip.price,
        checkInLocation: trip.checkInLocation,
      },
    }

    try {
      sessionStorage.setItem(
        `giligo_booking_${bookingCode}`,
        JSON.stringify(bookingData)
      )

      router.push(`/booking/${bookingCode}`)
    } catch {
      setErrorMessage(
        "The demo booking could not be saved. Please try again."
      )

      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      {/* Customer and passenger details */}
      <div className="space-y-7">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Contact details
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Booking contact
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The booking confirmation will be issued using these details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Full name
              </span>

              <input
                type="text"
                name="fullName"
                required
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </span>

              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                WhatsApp number
              </span>

              <input
                type="tel"
                name="whatsapp"
                required
                placeholder="+62 812 3456 7890"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Country
              </span>

              <select
                name="country"
                defaultValue="Indonesia"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Australia">Australia</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Passenger information
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Passenger details
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter each passenger&apos;s name as shown on their
              identification document.
            </p>
          </div>

          <div className="space-y-5">
            {Array.from(
              { length: passengerCount },
              (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-black">
                      Passenger {index + 1}
                    </h3>

                    {index === 0 && (
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                        Lead passenger
                      </span>
                    )}
                  </div>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Passenger full name
                    </span>

                    <input
                      type="text"
                      name={`passengerName${index + 1}`}
                      required
                      placeholder={`Passenger ${index + 1} full name`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </label>
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black">
            Additional information
          </h2>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Notes or special requests
            </span>

            <textarea
              name="notes"
              rows={4}
              placeholder="Hotel pickup location, luggage information, or other requests..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        </section>
      </div>

      {/* Booking summary */}
      <aside>
        <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-slate-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Booking summary
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {trip.from}
              <span className="mx-2 text-cyan-300">→</span>
              {trip.to}
            </h2>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operator
              </p>

              <p className="mt-1 font-black">
                {trip.operator}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Departure
              </p>

              <p className="mt-1 font-black">
                {formatDate(departureDate)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {trip.departureTime} – {trip.arrivalTime}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Check-in location
              </p>

              <p className="mt-1 font-semibold">
                {trip.checkInLocation}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Passengers
              </p>

              <p className="mt-1 font-semibold">
                {passengerCount} adult
                {passengerCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex justify-between gap-4 text-sm text-slate-500">
                <span>
                  {passengerCount} × {formatCurrency(trip.price)}
                </span>

                <span>{formatCurrency(totalPrice)}</span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black text-cyan-700">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-cyan-600"
              />

              <span className="text-xs leading-5 text-slate-600">
                I confirm that the passenger information is correct
                and agree to the demo booking terms.
              </span>
            </label>

            {errorMessage && (
              <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Creating Booking..."
                : "Complete Demo Booking"}
            </button>

            <p className="text-center text-xs leading-5 text-slate-400">
              This is a demonstration. No real payment will be
              processed.
            </p>
          </div>
        </div>
      </aside>
    </form>
  )
}