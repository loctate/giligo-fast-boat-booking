"use client"

import { useRouter } from "next/navigation"
import {
  useState,
  type FormEvent,
} from "react"

type CheckoutTrip = {
  id: string
  operator: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  currency?: string
  availableSeats: number
  checkInLocation: string
  facilities: string[]
}

type CheckoutFormProps = {
  trip: CheckoutTrip
  returnTrip?: CheckoutTrip | null

  departureDate: string
  returnDate: string

  tripType: "one-way" | "round-trip"
  passengerCount: number

  /*
   * Tetap false sampai API /api/bookings
   * mendukung transaksi dua inventory.
   */
  roundTripSubmissionEnabled?: boolean
}

type BookingTripConfirmation = {
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

type BookingConfirmationData = {
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

  trip: BookingTripConfirmation

  returnTrip?: BookingTripConfirmation | null
}

type BookingApiResponse = {
  success?: boolean
  rowId?: string
  bookingCode?: string
  booking?: BookingConfirmationData
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
  if (!value) {
    return "Date not selected"
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

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

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function JourneySummary({
  label,
  trip,
  travelDate,
}: {
  label: string
  trip: CheckoutTrip
  travelDate: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
        {label}
      </p>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-black">
            {trip.from}
            <span className="mx-2 text-cyan-600">
              →
            </span>
            {trip.to}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatDate(travelDate)}
          </p>
        </div>

        <p className="text-right text-sm font-black">
          {trip.departureTime}
          <span className="mx-1 text-slate-400">
            –
          </span>
          {trip.arrivalTime}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Operator
          </p>

          <p className="mt-1 text-sm font-black">
            {trip.operator}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Price per adult
          </p>

          <p className="mt-1 font-black text-cyan-700">
            {formatCurrency(
              trip.price,
              trip.currency
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

export default function CheckoutForm({
  trip,
  returnTrip = null,
  departureDate,
  returnDate,
  tripType,
  passengerCount,
  roundTripSubmissionEnabled = false,
}: CheckoutFormProps) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const isRoundTrip =
    tripType === "round-trip"

  const outboundTotal =
    trip.price * passengerCount

  const returnTotal =
    isRoundTrip && returnTrip
      ? returnTrip.price * passengerCount
      : 0

  const totalPrice =
    outboundTotal + returnTotal

  const currency =
    trip.currency ||
    returnTrip?.currency ||
    "IDR"

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setErrorMessage("")

    if (isRoundTrip && !returnTrip) {
      setErrorMessage(
        "The selected return trip is missing. Please choose the return trip again."
      )
      return
    }

    /*
     * Jangan kirim round-trip ke API lama.
     * API saat ini hanya mengurangi kursi
     * dari satu trip inventory.
     */
    if (
      isRoundTrip &&
      !roundTripSubmissionEnabled
    ) {
      setErrorMessage(
        "Round-trip booking submission is temporarily unavailable while secure two-trip inventory processing is being completed."
      )
      return
    }

    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    const passengers = Array.from(
      {
        length: passengerCount,
      },
      (_, index) => {
        const passengerNumber =
          index + 1

        return {
          number: passengerNumber,

          name: String(
            formData.get(
              `passengerName${passengerNumber}`
            ) ?? ""
          ).trim(),
        }
      }
    )

    const hasEmptyPassengerName =
      passengers.some(
        (passenger) =>
          passenger.name.length === 0
      )

    if (hasEmptyPassengerName) {
      setErrorMessage(
        "Please enter the full name of every passenger."
      )

      setIsSubmitting(false)
      return
    }

    const fullName = String(
      formData.get("fullName") ?? ""
    ).trim()

    const email = String(
      formData.get("email") ?? ""
    ).trim()

    const whatsapp = String(
      formData.get("whatsapp") ?? ""
    ).trim()

    const country = String(
      formData.get("country") ?? ""
    ).trim()

    const notes = String(
      formData.get("notes") ?? ""
    ).trim()

    if (
      !fullName ||
      !email ||
      !whatsapp ||
      !country
    ) {
      setErrorMessage(
        "Please complete all required contact details."
      )

      setIsSubmitting(false)
      return
    }

    const bookingRequest = {
      /*
       * tripInventoryId tetap dikirim untuk
       * kompatibilitas one-way dan API lama.
       */
      tripInventoryId: trip.id,

      /*
       * Field baru untuk round-trip.
       * API berikutnya akan membaca keduanya.
       */
      outboundTripInventoryId:
        trip.id,

      returnTripInventoryId:
        returnTrip?.id ?? "",

      tripType,
      returnDate:
        isRoundTrip ? returnDate : "",

      passengerCount,

      customer: {
        fullName,
        email,
        whatsapp,
        country,
      },

      passengers,
      notes,
    }

    try {
      const response = await fetch(
        "/api/bookings",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            bookingRequest
          ),
        }
      )

      const responseText =
        await response.text()

      let result: BookingApiResponse

      try {
        result = JSON.parse(
          responseText
        ) as BookingApiResponse
      } catch {
        console.error(
          "Booking API returned non-JSON:",
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
          "The booking service returned an invalid response."
        )
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "The booking could not be created."
        )
      }

      if (
        !result.booking ||
        !result.bookingCode
      ) {
        throw new Error(
          "The booking service returned incomplete confirmation data."
        )
      }

      const confirmationData = {
        ...result.booking,

        appwriteRowId:
          result.rowId ?? "",
      }

      sessionStorage.setItem(
        `giligo_booking_${result.bookingCode}`,

        JSON.stringify(
          confirmationData
        )
      )

      router.push(
        `/booking/${encodeURIComponent(
          result.bookingCode
        )}`
      )
    } catch (error) {
      console.error(
        "Booking submission error:",
        error
      )

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The booking could not be saved. Please try again."
      )

      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_390px]"
      >
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
              Contact details
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Booking contact
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The booking confirmation will be
              issued using these details.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-black text-slate-700">
                Full name

                <input
                  type="text"
                  name="fullName"
                  required
                  maxLength={150}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="text-sm font-black text-slate-700">
                Email address

                <input
                  type="email"
                  name="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="text-sm font-black text-slate-700">
                WhatsApp number

                <input
                  type="tel"
                  name="whatsapp"
                  required
                  maxLength={50}
                  autoComplete="tel"
                  placeholder="+62..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="text-sm font-black text-slate-700">
                Country

                <select
                  name="country"
                  required
                  defaultValue="Indonesia"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="Indonesia">
                    Indonesia
                  </option>

                  <option value="Australia">
                    Australia
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="Singapore">
                    Singapore
                  </option>

                  <option value="Malaysia">
                    Malaysia
                  </option>

                  <option value="Germany">
                    Germany
                  </option>

                  <option value="France">
                    France
                  </option>

                  <option value="Netherlands">
                    Netherlands
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
              Passenger information
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Passenger details
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter each passenger&apos;s name as
              shown on their identification
              document.
            </p>

            <div className="mt-7 space-y-5">
              {Array.from(
                {
                  length:
                    passengerCount,
                },
                (_, index) => {
                  const passengerNumber =
                    index + 1

                  return (
                    <article
                      key={
                        passengerNumber
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-black">
                          Passenger{" "}
                          {
                            passengerNumber
                          }
                        </h3>

                        {index === 0 && (
                          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">
                            Lead passenger
                          </span>
                        )}
                      </div>

                      <label className="mt-4 block text-sm font-black text-slate-700">
                        Passenger full name

                        <input
                          type="text"
                          name={`passengerName${passengerNumber}`}
                          required
                          maxLength={
                            150
                          }
                          autoComplete="off"
                          placeholder="Name as shown on identification"
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </label>
                    </article>
                  )
                }
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">
              Additional information
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Notes or special requests
            </h2>

            <label className="mt-5 block">
              <span className="sr-only">
                Notes or special requests
              </span>

              <textarea
                name="notes"
                maxLength={2000}
                rows={5}
                placeholder="Optional notes, luggage information, accessibility requests, or other important details."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3.5 font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </section>
        </div>

        <aside>
          <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Booking summary
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {isRoundTrip
                  ? "Round Trip"
                  : `${trip.from} → ${trip.to}`}
              </h2>

              {isRoundTrip && (
                <p className="mt-2 text-sm text-white/65">
                  Outbound and return journey
                </p>
              )}
            </div>

            <div className="space-y-5 p-6">
              <JourneySummary
                label="Outbound journey"
                trip={trip}
                travelDate={
                  departureDate
                }
              />

              {isRoundTrip &&
                returnTrip && (
                  <JourneySummary
                    label="Return journey"
                    trip={returnTrip}
                    travelDate={
                      returnDate
                    }
                  />
                )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Passengers
                </p>

                <p className="mt-1 font-semibold">
                  {passengerCount} adult
                  {passengerCount === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between gap-4 text-sm text-slate-500">
                  <span>
                    Outbound
                  </span>

                  <span>
                    {formatCurrency(
                      outboundTotal,
                      currency
                    )}
                  </span>
                </div>

                {isRoundTrip &&
                  returnTrip && (
                    <div className="mt-3 flex justify-between gap-4 text-sm text-slate-500">
                      <span>
                        Return
                      </span>

                      <span>
                        {formatCurrency(
                          returnTotal,
                          currency
                        )}
                      </span>
                    </div>
                  )}

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                  <span className="font-bold">
                    Total
                  </span>

                  <span className="text-2xl font-black text-cyan-700">
                    {formatCurrency(
                      totalPrice,
                      currency
                    )}
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
                  I confirm that the passenger
                  information is correct and agree
                  to the booking terms.
                </span>
              </label>

              {isRoundTrip &&
                !roundTripSubmissionEnabled && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-black">
                      Round-trip submission is
                      being finalized
                    </p>

                    <p className="mt-1 leading-6">
                      Both journeys can be reviewed,
                      but the booking cannot yet be
                      submitted until secure
                      two-inventory processing is
                      enabled.
                    </p>
                  </div>
                )}

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (isRoundTrip &&
                    !roundTripSubmissionEnabled)
                }
                className="w-full rounded-xl bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting
                  ? "Saving Booking..."
                  : isRoundTrip &&
                      !roundTripSubmissionEnabled
                    ? "Round Trip Coming Next"
                    : "Complete Booking"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                Payment is not processed at this
                stage. Your booking will remain
                pending until payment is confirmed.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  )
}