"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react"

type BookingPassenger = {
  number: number
  name: string
}

type BookingTrip = {
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
  currency?: string
  checkInLocation: string
}

type BookingData = {
  bookingCode: string
  createdAt: string
  bookingStatus: string
  paymentStatus: string

  tripType: string
  departureDate: string
  returnDate?: string | null

  passengerCount: number
  totalPrice: number
  currency?: string

  customer: {
    fullName: string
    email: string
    whatsapp: string
    country: string
  }

  passengers: BookingPassenger[]
  notes: string

  trip: BookingTrip
  returnTrip?: BookingTrip | null
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

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Date not selected"
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (!match) {
    const parsedDate =
      new Date(value)

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return value
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(parsedDate)
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
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date)
}

function getStatusContent(
  status: string
) {
  const normalizedStatus =
    status.toLowerCase()

  if (
    normalizedStatus === "confirmed"
  ) {
    return {
      icon: "✓",
      eyebrow: "Booking confirmed",
      title: "Your trip is reserved!",
      description:
        "Your booking has been confirmed. Keep this confirmation for your journey.",
      badgeClass:
        "bg-emerald-100 text-emerald-700",
      iconClass:
        "bg-emerald-500 text-white",
    }
  }

  if (
    normalizedStatus === "completed"
  ) {
    return {
      icon: "✓",
      eyebrow: "Trip completed",
      title:
        "Thank you for travelling with us",
      description:
        "This booking has been marked as completed.",
      badgeClass:
        "bg-blue-100 text-blue-700",
      iconClass:
        "bg-blue-500 text-white",
    }
  }

  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    return {
      icon: "×",
      eyebrow: "Booking cancelled",
      title:
        "This booking is no longer active",
      description:
        "The reservation has been cancelled and its seats have been returned to inventory.",
      badgeClass:
        "bg-red-100 text-red-700",
      iconClass:
        "bg-red-500 text-white",
    }
  }

  return {
    icon: "⏳",
    eyebrow: "Booking received",
    title:
      "Your booking is being processed",
    description:
      "We have received your booking. Its status will remain pending until it is confirmed.",
    badgeClass:
      "bg-amber-100 text-amber-700",
    iconClass:
      "bg-amber-500 text-white",
  }
}

function getPaymentStatusClass(
  status: string
) {
  const normalizedStatus =
    status.toLowerCase()

  if (
    normalizedStatus === "paid" ||
    normalizedStatus === "confirmed"
  ) {
    return "bg-emerald-100 text-emerald-700"
  }

  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "refunded"
  ) {
    return "bg-red-100 text-red-700"
  }

  return "bg-amber-100 text-amber-700"
}

function JourneyCard({
  label,
  trip,
  travelDate,
}: {
  label: string
  trip: BookingTrip
  travelDate: string
}) {
  return (
    <section className="rounded-3xl border border-slate-200 p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            {label}
          </p>

          <h2 className="mt-2 text-xl font-black">
            {trip.from}

            <span className="mx-2 text-cyan-600">
              →
            </span>

            {trip.to}
          </h2>

          <p className="mt-2 text-sm font-bold text-slate-500">
            {formatDate(travelDate)}
          </p>
        </div>

        <div className="w-fit rounded-full bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
          {trip.operator}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-3xl font-black">
            {trip.departureTime}
          </p>

          <p className="mt-2 text-xl font-black">
            {trip.from}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {trip.checkInLocation}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {trip.duration}
          </p>

          <div className="my-3 text-cyan-600">
            ─────➜
          </div>

          <p className="text-xs font-bold text-slate-500">
            Direct trip
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-3xl font-black">
            {trip.arrivalTime}

            {(trip.arrivalDayOffset ??
              0) > 0 && (
              <span className="ml-2 text-sm text-cyan-600">
                +
                {
                  trip.arrivalDayOffset
                }
                d
              </span>
            )}
          </p>

          <p className="mt-2 text-xl font-black">
            {trip.to}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Estimated arrival
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Fast boat operator
          </p>

          <p className="mt-2 font-black">
            {trip.operator}
          </p>

          {trip.vesselName && (
            <p className="mt-1 text-sm text-slate-500">
              {trip.vesselName}
            </p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Price per passenger
          </p>

          <p className="mt-2 font-black text-cyan-700">
            {formatCurrency(
              trip.price,
              trip.currency || "IDR"
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export default function BookingConfirmationPage() {
  const params =
    useParams<{ code: string }>()

  const bookingCode = String(
    params.code ?? ""
  )
    .trim()
    .toUpperCase()

  const [booking, setBooking] =
    useState<BookingData | null>(
      null
    )

  const [email, setEmail] =
    useState("")

  const [isLoading, setIsLoading] =
    useState(true)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")

  const verifyBooking =
    useCallback(
      async (
        emailAddress: string,
        silent = false
      ) => {
        const normalizedEmail =
          emailAddress
            .trim()
            .toLowerCase()

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
          const response =
            await fetch(
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
                  email:
                    normalizedEmail,
                }),
              }
            )

          const responseText =
            await response.text()

          let result:
            LookupApiResponse

          try {
            result = JSON.parse(
              responseText
            ) as LookupApiResponse
          } catch {
            console.error(
              "Booking lookup returned non-JSON:",
              {
                status:
                  response.status,

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

          setBooking(
            result.booking
          )

          setEmail(
            result.booking.customer
              .email
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
    const restoreTimer =
      window.setTimeout(() => {
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
              parsedBooking.customer
                ?.email ?? ""
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
      }, 0)

    return () => {
      window.clearTimeout(
        restoreTimer
      )
    }
  }, [
    bookingCode,
    verifyBooking,
  ])

  function handleVerification(
    event:
      FormEvent<HTMLFormElement>
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
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />

          <p className="mt-5 font-bold text-slate-700">
            Loading booking
            information...
          </p>
        </div>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
        <section className="mx-auto max-w-xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="text-3xl font-black text-slate-950"
            >
              Gili{" "}
              <span className="text-cyan-600">
                Go
              </span>
            </Link>

            <Link
              href="/"
              className="text-sm font-bold text-cyan-700 hover:text-cyan-900"
            >
              Back to Home
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
              Booking verification
            </p>

            <h1 className="mt-3 text-3xl font-black">
              View your booking
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              Enter the email address
              used when this booking was
              created.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Booking code
              </p>

              <p className="mt-2 text-xl font-black text-slate-950">
                {bookingCode ||
                  "Invalid booking code"}
              </p>
            </div>

            <form
              onSubmit={
                handleVerification
              }
              className="mt-6"
            >
              <label
                htmlFor="booking-email"
                className="text-sm font-black text-slate-700"
              >
                Booking email
              </label>

              <input
                id="booking-email"
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
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !email.trim() ||
                  !bookingCode
                }
                className="mt-5 w-full rounded-xl bg-cyan-600 px-5 py-3.5 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting
                  ? "Verifying Booking..."
                  : "View Booking"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              The booking code and
              booking email must match
              our records.
            </p>
          </div>
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

  const isRoundTrip =
    booking.tripType ===
      "round-trip" &&
    Boolean(booking.returnTrip)

  const outboundTotal =
    booking.trip.price *
    booking.passengerCount

  const returnTotal =
    isRoundTrip &&
    booking.returnTrip
      ? booking.returnTrip.price *
        booking.passengerCount
      : 0

  const whatsappLines = [
    "GiliGo Fast Boat Booking",
    `Booking code: ${booking.bookingCode}`,
    `Status: ${booking.bookingStatus}`,
    `Passenger: ${booking.customer.fullName}`,
    `Outbound: ${booking.trip.from} to ${booking.trip.to}`,
    `Departure: ${formatDate(
      booking.departureDate
    )}`,
    `Time: ${booking.trip.departureTime}`,
    `Operator: ${booking.trip.operator}`,
  ]

  if (
    isRoundTrip &&
    booking.returnTrip
  ) {
    whatsappLines.push(
      `Return: ${booking.returnTrip.from} to ${booking.returnTrip.to}`,
      `Return date: ${formatDate(
        booking.returnDate
      )}`,
      `Return time: ${booking.returnTrip.departureTime}`,
      `Return operator: ${booking.returnTrip.operator}`
    )
  }

  whatsappLines.push(
    `Total: ${formatCurrency(
      booking.totalPrice,
      currency
    )}`
  )

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      whatsappLines.join("\n")
    )}`

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-3xl font-black text-slate-950"
          >
            Gili{" "}
            <span className="text-cyan-600">
              Go
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-cyan-700 hover:text-cyan-900"
          >
            Back to Home
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-cyan-700 to-blue-900 px-6 py-10 text-white sm:px-10">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${statusContent.iconClass}`}
            >
              {statusContent.icon}
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              {statusContent.eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {statusContent.title}
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/75">
              {statusContent.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Booking code
                </p>

                <p className="mt-1 text-xl font-black">
                  {booking.bookingCode}
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-black ${statusContent.badgeClass}`}
              >
                {booking.bookingStatus}
              </span>

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                {isRoundTrip
                  ? "Round Trip"
                  : "One Way"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="space-y-6">
              <JourneyCard
                label="Outbound journey"
                trip={booking.trip}
                travelDate={
                  booking.departureDate
                }
              />

              {isRoundTrip &&
                booking.returnTrip && (
                  <JourneyCard
                    label="Return journey"
                    trip={
                      booking.returnTrip
                    }
                    travelDate={
                      booking.returnDate ||
                      ""
                    }
                  />
                )}

              <section className="rounded-3xl border border-slate-200 p-6">
                <h2 className="text-xl font-black">
                  Passenger details
                </h2>

                <div className="mt-5 space-y-3">
                  {booking.passengers.map(
                    (passenger) => (
                      <div
                        key={`${passenger.number}-${passenger.name}`}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
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

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                          Adult
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>

              {booking.notes && (
                <section className="rounded-3xl border border-slate-200 p-6">
                  <h2 className="text-xl font-black">
                    Booking notes
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
                    {booking.notes}
                  </p>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 p-6">
                <h2 className="text-xl font-black">
                  Payment summary
                </h2>

                <div className="mt-5 space-y-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      Outbound
                    </span>

                    <span className="font-black">
                      {formatCurrency(
                        outboundTotal,
                        currency
                      )}
                    </span>
                  </div>

                  {isRoundTrip &&
                    booking.returnTrip && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500">
                          Return
                        </span>

                        <span className="font-black">
                          {formatCurrency(
                            returnTotal,
                            currency
                          )}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">
                      Passengers
                    </span>

                    <span className="font-black">
                      {
                        booking.passengerCount
                      }{" "}
                      adult
                      {booking.passengerCount ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
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

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Payment status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${getPaymentStatusClass(
                      booking.paymentStatus
                    )}`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-6">
                <h2 className="text-xl font-black">
                  Booking contact
                </h2>

                <dl className="mt-5 space-y-4">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Name
                    </dt>

                    <dd className="mt-1 font-black">
                      {
                        booking.customer
                          .fullName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </dt>

                    <dd className="mt-1 break-all text-sm font-bold text-slate-700">
                      {
                        booking.customer
                          .email
                      }
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      WhatsApp
                    </dt>

                    <dd className="mt-1 font-bold">
                      {
                        booking.customer
                          .whatsapp
                      }
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Country
                    </dt>

                    <dd className="mt-1 font-bold">
                      {
                        booking.customer
                          .country
                      }
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  className="w-full rounded-xl bg-cyan-600 px-5 py-3.5 font-black text-white transition hover:bg-cyan-700"
                >
                  Print / Save as PDF
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-center font-black text-white transition hover:bg-emerald-700"
                >
                  Share via WhatsApp
                </a>

                <Link
                  href="/"
                  className="block w-full rounded-xl border border-slate-200 px-5 py-3.5 text-center font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Book Another Trip
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}