import {
  hasCurrentBookingPolicyAcceptance,
} from "@/lib/booking-policy"

import type {
  D1BookingRecord,
} from "@/lib/d1-booking-readers"

export interface D1BookingLookupInput {
  bookingCode: string
  email: string
}

export interface D1BookingLookupPassenger {
  number: number
  name: string
}

export interface D1BookingLookupTrip {
  id: string
  inventoryCode: string
  operator: string
  vesselName: string
  routeCode: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  duration: string
  price: number
  currency: string
  checkInLocation: string
}

export interface D1PublicBookingLookup {
  bookingCode: string
  createdAt: string

  bookingStatus: string
  paymentStatus: string

  paymentVerificationAllowed:
    boolean

  policyAcceptanceCurrent:
    boolean

  tripType: string

  departureDate: string
  returnDate: string

  passengerCount: number
  totalPrice: number
  currency: string

  customer: {
    fullName: string
    email: string
    whatsapp: string
    country: string
  }

  passengers:
    D1BookingLookupPassenger[]

  notes: string

  trip:
    D1BookingLookupTrip

  returnTrip:
    D1BookingLookupTrip | null
}

export interface D1BookingLookupAdapterOptions {
  paymentVerificationModeEnabled:
    boolean
}

export class D1BookingLookupError
  extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)

    this.name =
      "D1BookingLookupError"
  }
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

  const parsedValue =
    Number(value)

  return Number.isInteger(
    parsedValue
  )
    ? parsedValue
    : null
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

export function normalizeD1BookingLookupInput(
  bookingCodeValue: unknown,
  emailValue: unknown
): D1BookingLookupInput {
  const bookingCode =
    cleanText(
      bookingCodeValue
    ).toUpperCase()

  const email =
    cleanText(
      emailValue
    ).toLowerCase()

  if (
    !bookingCode ||
    !email
  ) {
    throw new D1BookingLookupError(
      400,
      "Booking code and email address are required."
    )
  }

  if (
    bookingCode.length > 40 ||
    !/^[A-Z0-9-]+$/.test(
      bookingCode
    )
  ) {
    throw new D1BookingLookupError(
      400,
      "The booking code format is invalid."
    )
  }

  if (
    email.length > 200 ||
    !isValidEmail(email)
  ) {
    throw new D1BookingLookupError(
      400,
      "Please enter a valid email address."
    )
  }

  return {
    bookingCode,
    email,
  }
}

export function parseD1BookingPassengers(
  value: string
): D1BookingLookupPassenger[] {
  try {
    const parsedValue: unknown =
      JSON.parse(value)

    if (
      !Array.isArray(
        parsedValue
      )
    ) {
      return []
    }

    return parsedValue
      .map(
        (
          item,
          index
        ) => {
          if (
            typeof item !== "object" ||
            item === null
          ) {
            return null
          }

          const passenger =
            item as Record<
              string,
              unknown
            >

          const name =
            cleanText(
              passenger.name
            )

          if (!name) {
            return null
          }

          const number =
            toInteger(
              passenger.number
            ) ??
            index + 1

          return {
            number,
            name,
          }
        }
      )
      .filter(
        (
          passenger
        ): passenger is
          D1BookingLookupPassenger =>
          passenger !== null
      )
  } catch {
    return []
  }
}

export function parseD1BookingReturnTrip(
  value: string | null
): D1BookingLookupTrip | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null
  }

  try {
    const parsedValue: unknown =
      JSON.parse(value)

    if (
      typeof parsedValue !==
        "object" ||
      parsedValue === null ||
      Array.isArray(
        parsedValue
      )
    ) {
      return null
    }

    const trip =
      parsedValue as Record<
        string,
        unknown
      >

    const id =
      cleanText(
        trip.id
      )

    const inventoryCode =
      cleanText(
        trip.inventoryCode
      )

    const operator =
      cleanText(
        trip.operator
      )

    const vesselName =
      cleanText(
        trip.vesselName
      )

    const routeCode =
      cleanText(
        trip.routeCode
      )

    const from =
      cleanText(
        trip.from
      )

    const to =
      cleanText(
        trip.to
      )

    const departureTime =
      cleanText(
        trip.departureTime
      )

    const arrivalTime =
      cleanText(
        trip.arrivalTime
      )

    const duration =
      cleanText(
        trip.duration
      )

    const currency =
      cleanText(
        trip.currency
      ).toUpperCase() ||
      "IDR"

    const checkInLocation =
      cleanText(
        trip.checkInLocation
      )

    const arrivalDayOffset =
      toInteger(
        trip.arrivalDayOffset
      ) ?? 0

    const price =
      toInteger(
        trip.price
      )

    if (
      !id ||
      !operator ||
      !from ||
      !to ||
      !departureTime ||
      !arrivalTime ||
      price === null ||
      price < 0 ||
      arrivalDayOffset < 0
    ) {
      return null
    }

    return {
      id,
      inventoryCode,
      operator,
      vesselName,
      routeCode,
      from,
      to,
      departureTime,
      arrivalTime,
      arrivalDayOffset,

      duration:
        duration ||
        "Duration unavailable",

      price,
      currency,

      checkInLocation:
        checkInLocation ||
        "Check-in details will be provided after booking.",
    }
  } catch {
    return null
  }
}

export function createD1PublicBookingLookup(
  booking:
    D1BookingRecord,

  options:
    D1BookingLookupAdapterOptions
): D1PublicBookingLookup {
  const passengers =
    parseD1BookingPassengers(
      booking.passengersJson
    )

  const returnTrip =
    parseD1BookingReturnTrip(
      booking.returnTripJson
    )

  if (
    booking.passengerCount < 1 ||
    booking.totalPrice < 0 ||
    booking.pricePerPassenger < 0 ||
    passengers.length === 0
  ) {
    throw new D1BookingLookupError(
      500,
      "The stored booking data is incomplete."
    )
  }

  if (
    booking.tripType ===
      "round-trip" &&
    !returnTrip
  ) {
    throw new D1BookingLookupError(
      500,
      "The stored return-trip data is incomplete."
    )
  }

  const currency =
    cleanText(
      booking.currency
    ).toUpperCase() ||
    "IDR"

  const paymentVerificationAllowed =
    !options
      .paymentVerificationModeEnabled ||
    booking
      .paymentVerificationAllowed

  const outboundTrip:
    D1BookingLookupTrip = {
    id:
      cleanText(
        booking.tripInventoryId
      ) ||
      cleanText(
        booking.tripId
      ),

    inventoryCode:
      cleanText(
        booking.inventoryCode
      ),

    operator:
      cleanText(
        booking.operatorName
      ),

    vesselName:
      cleanText(
        booking.vesselName
      ),

    routeCode:
      cleanText(
        booking.routeCode
      ),

    from:
      cleanText(
        booking.fromPort
      ),

    to:
      cleanText(
        booking.toPort
      ),

    departureTime:
      cleanText(
        booking.departureTime
      ),

    arrivalTime:
      cleanText(
        booking.arrivalTime
      ),

    arrivalDayOffset:
      booking.arrivalDayOffset,

    duration:
      cleanText(
        booking.duration
      ) ||
      "Duration unavailable",

    price:
      booking.pricePerPassenger,

    currency,

    checkInLocation:
      cleanText(
        booking.checkInLocation
      ) ||
      "Check-in details will be provided after booking.",
  }

  if (
    !outboundTrip.id ||
    !outboundTrip.operator ||
    !outboundTrip.from ||
    !outboundTrip.to ||
    !outboundTrip.departureTime ||
    !outboundTrip.arrivalTime
  ) {
    throw new D1BookingLookupError(
      500,
      "The stored outbound-trip data is incomplete."
    )
  }

  const policyAcceptanceCurrent =
    hasCurrentBookingPolicyAcceptance(
      {
        termsAcceptedAt:
          booking.termsAcceptedAt,

        refundPolicyAcceptedAt:
          booking
            .refundPolicyAcceptedAt,

        termsVersion:
          booking.termsVersion,

        refundPolicyVersion:
          booking
            .refundPolicyVersion,
      }
    )

  return {
    bookingCode:
      cleanText(
        booking.bookingCode
      ),

    createdAt:
      cleanText(
        booking.createdAt
      ),

    bookingStatus:
      cleanText(
        booking.bookingStatus
      ),

    paymentStatus:
      cleanText(
        booking.paymentStatus
      ),

    paymentVerificationAllowed,
    policyAcceptanceCurrent,

    tripType:
      cleanText(
        booking.tripType
      ).toLowerCase(),

    departureDate:
      cleanText(
        booking.departureDate
      ),

    returnDate:
      cleanText(
        booking.returnDate
      ),

    passengerCount:
      booking.passengerCount,

    totalPrice:
      booking.totalPrice,

    currency,

    customer: {
      fullName:
        cleanText(
          booking.customerFullName
        ),

      email:
        cleanText(
          booking.customerEmail
        ).toLowerCase(),

      whatsapp:
        cleanText(
          booking.customerWhatsapp
        ),

      country:
        cleanText(
          booking.customerCountry
        ),
    },

    passengers,

    notes:
      cleanText(
        booking.notes
      ),

    trip:
      outboundTrip,

    returnTrip,
  }
}
