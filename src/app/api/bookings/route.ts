import {
  randomBytes,
  randomUUID,
} from "node:crypto"

import {
  getCurrentBaliDate,
  isValidDateOnly,
} from "@/lib/bali-date"

import {
  createD1PendingBookingWithSeatHold,
  D1BookingDalError,
} from "@/lib/d1-bookings"

import {
  getPublicTripDetailD1,
  type PublicTripDetailD1,
} from "@/lib/d1-public-trip-detail"

import {
  createSeatHoldExpiresAt,
} from "@/lib/seat-hold"

import {
  isPaymentVerificationAllowed,
} from "@/lib/payment-verification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BookingRequest = {
  verificationCode?: unknown

  tripInventoryId?: unknown
  outboundTripInventoryId?: unknown
  returnTripInventoryId?: unknown

  tripType?: unknown
  returnDate?: unknown
  passengerCount?: unknown

  customer?: {
    fullName?: unknown
    email?: unknown
    whatsapp?: unknown
    country?: unknown
  }

  passengers?: Array<{
    number?: unknown
    name?: unknown
  }>

  notes?: unknown
}

type LoadedTrip = {
  inventoryId: string
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

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  duration: string

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string

  salesStatus: "OPEN"

  checkInLocation: string
}

class BookingError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "BookingError"
  }
}

function noStoreJson(
  body: unknown,
  status = 200
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  })
}

function cleanText(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim()
}

function toInteger(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const parsed =
    Number(value)

  return Number.isInteger(parsed)
    ? parsed
    : null
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

function normalizeRouteValue(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function formatDuration(
  durationMinutes: number
): string {
  if (
    !Number.isInteger(
      durationMinutes
    ) ||
    durationMinutes <= 0
  ) {
    return "Duration unavailable"
  }

  const hours =
    Math.floor(
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

function createBookingCode(): string {
  const compactDate =
    getCurrentBaliDate()
      .slice(2)
      .replaceAll("-", "")

  const randomPart =
    randomBytes(4)
      .toString("hex")
      .toUpperCase()

  return `GG-${compactDate}-${randomPart}`
}

function toLoadedTrip(
  trip: PublicTripDetailD1
): LoadedTrip {
  return {
    inventoryId:
      trip.tripInventoryId,

    inventoryCode:
      trip.inventoryCode,

    scheduleId:
      trip.scheduleId,

    scheduleCode:
      trip.scheduleCode,

    operatorId:
      trip.operatorId,

    operatorCode:
      trip.operatorCode,

    operatorName:
      trip.operatorName,

    vesselId:
      trip.vesselId,

    vesselCode:
      trip.vesselCode,

    vesselName:
      trip.vesselName,

    routeId:
      trip.routeId,

    routeCode:
      trip.routeCode,

    fromPort:
      trip.fromPort,

    toPort:
      trip.toPort,

    travelDate:
      trip.travelDate,

    departureTime:
      trip.departureTime,

    arrivalTime:
      trip.arrivalTime,

    arrivalDayOffset:
      trip.arrivalDayOffset,

    duration:
      formatDuration(
        trip.durationMinutes
      ),

    seatCapacity:
      trip.seatCapacity,

    bookedSeats:
      trip.bookedSeats,

    heldSeats:
      trip.heldSeats,

    availableSeats:
      trip.availableSeats,

    adultPrice:
      trip.adultPrice,

    childPrice:
      trip.childPrice,

    infantPrice:
      trip.infantPrice,

    currency:
      trip.currency,

    salesStatus:
      "OPEN",

    checkInLocation:
      "Check-in details will be provided after booking.",
  }
}

function createTripConfirmation(
  trip: LoadedTrip
) {
  return {
    id:
      trip.inventoryId,

    inventoryCode:
      trip.inventoryCode,

    operator:
      trip.operatorName,

    vesselName:
      trip.vesselName,

    routeCode:
      trip.routeCode,

    from:
      trip.fromPort,

    to:
      trip.toPort,

    departureTime:
      trip.departureTime,

    arrivalTime:
      trip.arrivalTime,

    arrivalDayOffset:
      trip.arrivalDayOffset,

    duration:
      trip.duration,

    price:
      trip.adultPrice,

    currency:
      trip.currency,

    checkInLocation:
      trip.checkInLocation,
  }
}

async function loadTripForBooking({
  inventoryId,
  passengerCount,
  journeyLabel,
}: {
  inventoryId: string
  passengerCount: number
  journeyLabel:
    | "outbound"
    | "return"
}): Promise<LoadedTrip> {
  const result =
    await getPublicTripDetailD1({
      tripInventoryId:
        inventoryId,

      passengers:
        passengerCount,
    })

  if (result.status !== 200) {
    const errorBody =
      result.body as {
        error?: string
        availableSeats?: number
      }

    const availableSeats =
      Number(
        errorBody.availableSeats
      )

    if (result.status === 404) {
      throw new BookingError(
        404,
        `The selected ${journeyLabel} trip could not be found.`
      )
    }

    if (
      result.status === 409 &&
      Number.isInteger(
        availableSeats
      )
    ) {
      throw new BookingError(
        409,

        availableSeats <= 0
          ? `The selected ${journeyLabel} trip is sold out.`
          : `Only ${availableSeats} seats remain for the selected ${journeyLabel} trip.`
      )
    }

    if (result.status === 410) {
      const message =
        cleanText(
          errorBody.error
        )

      if (
        message &&
        message !==
          "The selected trip is no longer available for booking."
      ) {
        throw new BookingError(
          410,
          message
        )
      }

      throw new BookingError(
        410,
        `The selected ${journeyLabel} trip is no longer open for booking.`
      )
    }

    throw new BookingError(
      500,
      `The selected ${journeyLabel} trip could not be loaded.`
    )
  }

  const successBody =
    result.body as {
      trip:
        PublicTripDetailD1
    }

  return toLoadedTrip(
    successBody.trip
  )
}

export async function POST(
  request: Request
) {
  try {
    let body:
      BookingRequest

    try {
      body =
        (await request.json()) as
          BookingRequest
    } catch {
      throw new BookingError(
        400,
        "The request body is not valid JSON."
      )
    }

    const tripType =
      cleanText(
        body.tripType
      ).toLowerCase()

    if (
      tripType !== "one-way" &&
      tripType !== "round-trip"
    ) {
      throw new BookingError(
        400,
        "Invalid trip type."
      )
    }

    const outboundTripInventoryId =
      cleanText(
        body.outboundTripInventoryId
      ) ||
      cleanText(
        body.tripInventoryId
      )

    const returnTripInventoryId =
      cleanText(
        body.returnTripInventoryId
      )

    if (!outboundTripInventoryId) {
      throw new BookingError(
        400,
        "Outbound trip inventory ID is required."
      )
    }

    if (
      tripType === "round-trip" &&
      !returnTripInventoryId
    ) {
      throw new BookingError(
        400,
        "Return trip inventory ID is required for a round trip."
      )
    }

    if (
      tripType === "round-trip" &&
      outboundTripInventoryId ===
        returnTripInventoryId
    ) {
      throw new BookingError(
        400,
        "Outbound and return trips cannot use the same inventory."
      )
    }

    const requestedReturnDate =
      cleanText(
        body.returnDate
      )

    if (
      tripType === "round-trip" &&
      !requestedReturnDate
    ) {
      throw new BookingError(
        400,
        "Return date is required for a round trip."
      )
    }

    if (
      requestedReturnDate &&
      !isValidDateOnly(
        requestedReturnDate
      )
    ) {
      throw new BookingError(
        400,
        "Return date must use YYYY-MM-DD format."
      )
    }

    const passengerCount =
      toInteger(
        body.passengerCount
      )

    if (
      passengerCount === null ||
      passengerCount < 1 ||
      passengerCount > 20
    ) {
      throw new BookingError(
        400,
        "Passenger count must be between 1 and 20."
      )
    }

    const fullName =
      cleanText(
        body.customer?.fullName
      )

    const email =
      cleanText(
        body.customer?.email
      ).toLowerCase()

    const whatsapp =
      cleanText(
        body.customer?.whatsapp
      )

    const country =
      cleanText(
        body.customer?.country
      )

    if (
      !fullName ||
      !email ||
      !whatsapp ||
      !country
    ) {
      throw new BookingError(
        400,
        "Please complete all required contact details."
      )
    }

    if (
      fullName.length > 150
    ) {
      throw new BookingError(
        400,
        "Customer name is too long."
      )
    }

    if (
      email.length > 200 ||
      !isValidEmail(email)
    ) {
      throw new BookingError(
        400,
        "Please enter a valid email address."
      )
    }

    if (
      whatsapp.length > 50
    ) {
      throw new BookingError(
        400,
        "WhatsApp number is too long."
      )
    }

    if (
      country.length > 100
    ) {
      throw new BookingError(
        400,
        "Country name is too long."
      )
    }

    const rawPassengers =
      Array.isArray(
        body.passengers
      )
        ? body.passengers
        : []

    if (
      rawPassengers.length !==
      passengerCount
    ) {
      throw new BookingError(
        400,
        "Passenger details do not match the passenger count."
      )
    }

    const passengers =
      rawPassengers.map(
        (
          passenger,
          index
        ) => ({
          number:
            index + 1,

          name:
            cleanText(
              passenger?.name
            ),
        })
      )

    if (
      passengers.some(
        (passenger) =>
          !passenger.name ||
          passenger.name.length > 150
      )
    ) {
      throw new BookingError(
        400,
        "Every passenger must have a valid full name."
      )
    }

    const notes =
      cleanText(
        body.notes
      )

    if (
      notes.length > 2000
    ) {
      throw new BookingError(
        400,
        "Notes are too long."
      )
    }

    const paymentVerificationAllowed =
      isPaymentVerificationAllowed(
        body.verificationCode
      )

    const outboundTrip =
      await loadTripForBooking({
        inventoryId:
          outboundTripInventoryId,

        passengerCount,

        journeyLabel:
          "outbound",
      })

    const returnTrip =
      tripType === "round-trip"
        ? await loadTripForBooking({
            inventoryId:
              returnTripInventoryId,

            passengerCount,

            journeyLabel:
              "return",
          })
        : null

    if (returnTrip) {
      const routeIsReversed =
        normalizeRouteValue(
          outboundTrip.fromPort
        ) ===
          normalizeRouteValue(
            returnTrip.toPort
          ) &&
        normalizeRouteValue(
          outboundTrip.toPort
        ) ===
          normalizeRouteValue(
            returnTrip.fromPort
          )

      if (!routeIsReversed) {
        throw new BookingError(
          400,
          "The selected return trip must travel back to the original departure port."
        )
      }

      if (
        returnTrip.travelDate <=
        outboundTrip.travelDate
      ) {
        throw new BookingError(
          400,
          "The return trip must depart after the outbound trip date."
        )
      }

      if (
        requestedReturnDate !==
        returnTrip.travelDate
      ) {
        throw new BookingError(
          400,
          "The selected return inventory does not match the requested return date."
        )
      }

      if (
        outboundTrip.currency !==
        returnTrip.currency
      ) {
        throw new BookingError(
          400,
          "Outbound and return trips must use the same currency."
        )
      }
    }

    const outboundTotal =
      outboundTrip.adultPrice *
      passengerCount

    const returnTotal =
      returnTrip
        ? returnTrip.adultPrice *
          passengerCount
        : 0

    const totalPrice =
      outboundTotal +
      returnTotal

    if (
      !Number.isSafeInteger(
        outboundTotal
      ) ||
      !Number.isSafeInteger(
        returnTotal
      ) ||
      !Number.isSafeInteger(
        totalPrice
      )
    ) {
      throw new BookingError(
        500,
        "The calculated booking total is invalid."
      )
    }

    const bookingCode =
      createBookingCode()

    const bookingRowId =
      randomUUID()

    const bookingStatus =
      "Pending" as const

    const paymentStatus =
      "Pending" as const

    const seatHoldExpiresAt =
      createSeatHoldExpiresAt()

    const returnTripJson =
      returnTrip
        ? JSON.stringify(
            createTripConfirmation(
              returnTrip
            )
          )
        : null

    if (
      returnTripJson &&
      returnTripJson.length > 5000
    ) {
      throw new BookingError(
        500,
        "The return trip snapshot is too large to store."
      )
    }

    await createD1PendingBookingWithSeatHold({
      id:
        bookingRowId,

      bookingCode,
      seatHoldExpiresAt,
      paymentVerificationAllowed,

      tripType,

      departureDate:
        outboundTrip.travelDate,

      returnDate:
        returnTrip
          ?.travelDate ??
        null,

      passengerCount,
      totalPrice,

      customerFullName:
        fullName,

      customerEmail:
        email,

      customerWhatsapp:
        whatsapp,

      customerCountry:
        country,

      passengersJson:
        JSON.stringify(
          passengers
        ),

      tripId:
        outboundTrip.inventoryId,

      tripInventoryId:
        outboundTrip.inventoryId,

      returnTripInventoryId:
        returnTrip
          ?.inventoryId ??
        null,

      inventoryCode:
        outboundTrip.inventoryCode,

      scheduleId:
        outboundTrip.scheduleId,

      operatorId:
        outboundTrip.operatorId,

      vesselId:
        outboundTrip.vesselId,

      routeId:
        outboundTrip.routeId,

      operatorName:
        outboundTrip.operatorName,

      vesselName:
        outboundTrip.vesselName,

      routeCode:
        outboundTrip.routeCode,

      fromPort:
        outboundTrip.fromPort,

      toPort:
        outboundTrip.toPort,

      departureTime:
        outboundTrip.departureTime,

      arrivalTime:
        outboundTrip.arrivalTime,

      arrivalDayOffset:
        outboundTrip.arrivalDayOffset,

      duration:
        outboundTrip.duration,

      pricePerPassenger:
        outboundTrip.adultPrice,

      currency:
        outboundTrip.currency,

      checkInLocation:
        outboundTrip.checkInLocation,

      returnTripJson,

      notes:
        notes || null,
    })

    const createdAt =
      new Date()
        .toISOString()

    return noStoreJson(
      {
        success: true,

        rowId:
          bookingRowId,

        bookingCode,

        booking: {
          bookingCode,
          createdAt,

          bookingStatus,
          paymentStatus,
          seatHoldExpiresAt,
          paymentVerificationAllowed,

          tripType,

          departureDate:
            outboundTrip
              .travelDate,

          returnDate:
            returnTrip
              ?.travelDate ??
            "",

          passengerCount,
          totalPrice,

          currency:
            outboundTrip.currency,

          customer: {
            fullName,
            email,
            whatsapp,
            country,
          },

          passengers,
          notes,

          trip:
            createTripConfirmation(
              outboundTrip
            ),

          returnTrip:
            returnTrip
              ? createTripConfirmation(
                  returnTrip
                )
              : null,
        },
      },
      201
    )
  } catch (error) {
    if (
      error instanceof
      BookingError
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            error.message,
        },
        error.status
      )
    }

    if (
      error instanceof
      D1BookingDalError
    ) {
      if (
        error.kind ===
          "BUSINESS_ASSERTION" ||
        error.kind ===
          "SEAT_CONSTRAINT"
      ) {
        return noStoreJson(
          {
            success: false,
            error:
              "The remaining seats changed while the booking was being processed. Please search again.",
          },
          409
        )
      }

      if (
        error.kind ===
          "BUSINESS_RULE"
      ) {
        return noStoreJson(
          {
            success: false,
            error:
              error.message,
          },
          409
        )
      }

      if (
        error.kind ===
          "UNIQUE_CONSTRAINT"
      ) {
        return noStoreJson(
          {
            success: false,
            error:
              "The booking reference could not be reserved. Please try again.",
          },
          409
        )
      }
    }

    console.error(
      "Secure D1 booking creation error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          "The booking could not be created.",
      },
      500
    )
  }
}
