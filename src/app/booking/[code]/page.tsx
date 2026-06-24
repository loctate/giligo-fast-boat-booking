"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react"

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
  currency?: string

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
    inventoryCode?: string
    operator: string
    vesselName?: string
    routeCode?: string
    from: string
    to: string
    departureTime: string
    arrivalTime: string
    arrivalDayOffset?: number
    duration: string
    price: number
    checkInLocation: string
  }
}

type LookupApiResponse = {
  success?: boolean
  booking?: BookingData
  error?: string
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

function formatDate(value: string) {
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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function getStatusContent(
  status: string
) {
  if (status === "Confirmed") {
    return {
      icon: "✓",
      eyebrow: "Booking confirmed",
      title: "Your trip is reserved!",
      description:
        "Your booking has been confirmed. Keep this confirmation for your journey.",
    }
  }

  if (status === "Completed") {
    return {
      icon: "✓",
      eyebrow: "Trip completed",
      title: "Thank you for travelling with us",
      description:
        "This booking has been marked as completed.",
    }
  }

  if (status === "Cancelled") {
    return {
      icon: "×",
      eyebrow: "Booking cancelled",
      title: "This booking is no longer active",
      description:
        "The reservation has been cancelled and its seats have been returned to inventory.",
    }
  }

  return {
    icon: "⏳",
    eyebrow: "Booking received",
    title: "Your booking is being processed",
    description:
      "We have received your booking. Its status will remain pending until it is confirmed.",
  }
}

export default function BookingConfirmationPage() {
  const params = useParams<{
    code: string
  }>()

  const bookingCode = String(
    params.code ?? ""
  )
    .trim()
    .toUpperCase()

  const [booking, setBooking] =
    useState<BookingData | null>(null)

  const [email, setEmail] =
    useState("")

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const verifyBooking = useCallback(
    async (
      emailAddress: string,
      silent = false
    ) => {
      const normalizedEmail =
        emailAddress.trim().toLowerCase()

      if (
        !bookingCode ||
        !normalizedEmail
      ) {
        if (!silent) {
          setErrorMessage(
            "Please enter the email address used for this booking."
          )
        }

        setIsLoading(false)
        setIsSubmitting(false)
        return
      }

      if (!silent) {
        setIsSubmitting(true)
        setErrorMessage("")
      }

      try {
        const response = await fetch(
          "/api/bookings/lookup",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              bookingCode,
              email: normalizedEmail,
            }),
          }
        )

        const responseText =
          await response.text()

        let result: LookupApiResponse

        try {
          result = JSON.parse(
            responseText
          ) as LookupApiResponse
        } catch {
          console.error(
            "Booking lookup returned non-JSON:",
            {
              status: response.status,

              contentType:
                response.headers.get(
                  "content-type"
                ),

              responsePreview:
                responseText.slice(
                  0,
                  300
                ),
            }
          )

          throw new Error(
            "The booking verification service returned an invalid response."
          )
        }

        if (
          !response.ok ||
          !result.success ||
          !result.booking
        ) {
          throw new Error(
            result.error ||
              "The booking could not be verified."
          )
        }

        setBooking(result.booking)
        setEmail(
          result.booking.customer.email
        )

        sessionStorage.setItem(
          `giligo_booking_${bookingCode}`,

          JSON.stringify(
            result.booking
          )
        )
      } catch (error) {
        setBooking(null)

        if (!silent) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "The booking could not be verified."
          )
        }
      } finally {
        setIsLoading(false)
        setIsSubmitting(false)
      }
    },
    [bookingCode]
  )

  useEffect(() => {
    try {
      const savedBooking =
        sessionStorage.getItem(
          `giligo_booking_${bookingCode}`
        )

      if (!savedBooking) {
        setIsLoading(false)
        return
      }

      const parsedBooking =
        JSON.parse(
          savedBooking
        ) as BookingData

      const savedEmail =
        String(
          parsedBooking.customer?.email ??
            ""
        ).trim()

      if (!savedEmail) {
        setIsLoading(false)
        return
      }

      setEmail(savedEmail)

      void verifyBooking(
        savedEmail,
        true
      )
    } catch {
      setIsLoading(false)
    }
  }, [
    bookingCode,
    verifyBooking,
  ])

  function handleVerification(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    void verifyBooking(email)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="text-center">
          <div className="text-4xl">
            🚤
          </div>

          <p className="mt-4 font-bold text-slate-500">
            Loading booking information...
          </p>
        </div>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <header className="bg-slate-950 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
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
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold hover:bg-white hover:text-slate-950"
            >
              Back to Home
            </Link>
          </div>
        </header>

        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-14 text-white">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
              Booking verification
            </p>

            <h1 className="mt-2 text-4xl font-black">
              View your booking
            </h1>

            <p className="mt-4 text-white/80">
              Enter the email address used
              when this booking was created.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-xl px-5 py-12">
          <form
            onSubmit={
              handleVerification
            }
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9"
          >
            <div>
              <p className="text-sm font-bold text-slate-500">
                Booking code
              </p>

              <p className="mt-2 break-all text-2xl font-black tracking-wide text-cyan-700">
                {bookingCode ||
                  "Invalid booking code"}
              </p>
            </div>

            <label className="mt-7 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Booking email
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !bookingCode
              }
              className="mt-6 w-full rounded-xl bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Verifying Booking..."
                : "View Booking"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              The booking code and booking
              email must match our records.
            </p>
          </form>
        </section>
      </main>
    )
  }

  const currency =
    booking.currency || "IDR"

  const statusContent =
    getStatusContent(
      booking.bookingStatus
    )

  const whatsappMessage = [
    "Nusa Gili Boat Booking",
    `Booking code: ${booking.bookingCode}`,
    `Status: ${booking.bookingStatus}`,
    `Passenger: ${booking.customer.fullName}`,
    `Route: ${booking.trip.from} to ${booking.trip.to}`,
    `Departure: ${formatDate(
      booking.departureDate
    )}`,
    `Time: ${booking.trip.departureTime}`,
    `Operator: ${booking.trip.operator}`,
    `Total: ${formatCurrency(
      booking.totalPrice,
      currency
    )}`,
  ].join("\n")

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
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
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold hover:bg-white hover:text-slate-950"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-14 text-white print:bg-white print:text-slate-900">
        <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl font-black text-cyan-700 shadow-lg">
            {statusContent.icon}
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-cyan-100 print:text-slate-500">
            {statusContent.eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            {statusContent.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-white/80 print:text-slate-500">
            {statusContent.description}
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

                <span className="self-start rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">
                  {booking.bookingStatus}
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid gap-7 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p className="text-4xl font-black">
                      {
                        booking.trip
                          .departureTime
                      }
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {booking.trip.from}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        booking.trip
                          .checkInLocation
                      }
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400">
                      {
                        booking.trip
                          .duration
                      }
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
                      {
                        booking.trip
                          .arrivalTime
                      }

                      {(booking.trip
                        .arrivalDayOffset ??
                        0) > 0 && (
                        <span className="ml-1 text-sm text-slate-500">
                          +
                          {
                            booking.trip
                              .arrivalDayOffset
                          }
                          d
                        </span>
                      )}
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
                      {formatDate(
                        booking.departureDate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fast boat operator
                    </p>

                    <p className="mt-2 font-black">
                      {
                        booking.trip
                          .operator
                      }
                    </p>

                    {booking.trip
                      .vesselName && (
                      <p className="mt-1 text-sm text-slate-500">
                        {
                          booking.trip
                            .vesselName
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black">
                Passenger details
              </h2>

              <div className="mt-6 divide-y divide-slate-100">
                {booking.passengers.map(
                  (passenger) => (
                    <div
                      key={
                        passenger.number
                      }
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Passenger{" "}
                          {
                            passenger.number
                          }
                        </p>

                        <p className="mt-1 font-black">
                          {passenger.name}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Adult
                      </span>
                    </div>
                  )
                )}
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
                    {
                      booking.passengerCount
                    }{" "}
                    passenger
                    {booking.passengerCount ===
                    1
                      ? ""
                      : "s"}
                  </span>

                  <span>
                    {formatCurrency(
                      booking.totalPrice,
                      currency
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                  <span className="font-black">
                    Total
                  </span>

                  <span className="text-xl font-black text-cyan-700">
                    {formatCurrency(
                      booking.totalPrice,
                      currency
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Payment status
                </p>

                <p className="mt-1 font-black text-amber-900">
                  {
                    booking.paymentStatus
                  }
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Booking contact
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">
                    Name
                  </p>

                  <p className="font-bold">
                    {
                      booking.customer
                        .fullName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">
                    Email
                  </p>

                  <p className="break-all font-bold">
                    {
                      booking.customer
                        .email
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">
                    WhatsApp
                  </p>

                  <p className="font-bold">
                    {
                      booking.customer
                        .whatsapp
                    }
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-3 print:hidden">
              <button
                type="button"
                onClick={() =>
                  window.print()
                }
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