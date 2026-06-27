import { Query } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LookupRequest = {
  bookingCode?: unknown
  email?: unknown
}

type Passenger = {
  number: number
  name: string
}

type BookingTrip = {
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

type AppwriteRow = Record<
  string,
  unknown
> & {
  $id?: string
  $createdAt?: string
}

class LookupError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "LookupError"
    this.status = status
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
  return String(value ?? "").trim()
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

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue)
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

function parsePassengers(
  value: unknown
): Passenger[] {
  if (typeof value !== "string") {
    return []
  }

  try {
    const parsedValue: unknown =
      JSON.parse(value)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map((item, index) => {
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

        const name = cleanText(
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
      })
      .filter(
        (
          passenger
        ): passenger is Passenger =>
          passenger !== null
      )
  } catch {
    return []
  }
}

function parseReturnTrip(
  value: unknown
): BookingTrip | null {
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
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      return null
    }

    const trip =
      parsedValue as Record<
        string,
        unknown
      >

    const id = cleanText(
      trip.id
    )

    const inventoryCode =
      cleanText(
        trip.inventoryCode
      )

    const operator = cleanText(
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

    const from = cleanText(
      trip.from
    )

    const to = cleanText(
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

    const duration = cleanText(
      trip.duration
    )

    const currency =
      cleanText(
        trip.currency
      ).toUpperCase() || "IDR"

    const checkInLocation =
      cleanText(
        trip.checkInLocation
      )

    const arrivalDayOffset =
      toInteger(
        trip.arrivalDayOffset
      ) ?? 0

    const price = toInteger(
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

export async function POST(
  request: Request
) {
  try {
    let body: LookupRequest

    try {
      body =
        (await request.json()) as LookupRequest
    } catch {
      throw new LookupError(
        400,
        "The request body is not valid JSON."
      )
    }

    const bookingCode =
      cleanText(
        body.bookingCode
      ).toUpperCase()

    const email =
      cleanText(
        body.email
      ).toLowerCase()

    if (!bookingCode || !email) {
      throw new LookupError(
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
      throw new LookupError(
        400,
        "The booking code format is invalid."
      )
    }

    if (
      email.length > 200 ||
      !isValidEmail(email)
    ) {
      throw new LookupError(
        400,
        "Please enter a valid email address."
      )
    }

    const result =
      await tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .bookingsTableId,

        queries: [
          Query.equal(
            "bookingCode",
            [bookingCode]
          ),

          Query.limit(1),
        ],
      })

    const rows =
      result.rows as unknown as AppwriteRow[]

    const booking =
      rows[0]

    const verificationError =
      "Booking could not be verified. Check the booking code and email address."

    if (!booking) {
      throw new LookupError(
        404,
        verificationError
      )
    }

    const storedEmail =
      cleanText(
        booking.customerEmail
      ).toLowerCase()

    /*
     * Gunakan pesan yang sama ketika booking
     * tidak ditemukan atau email tidak cocok.
     * Ini mengurangi risiko enumerasi booking.
     */
    if (
      !storedEmail ||
      storedEmail !== email
    ) {
      throw new LookupError(
        404,
        verificationError
      )
    }

    const passengerCount =
      toInteger(
        booking.passengerCount
      )

    const totalPrice =
      toInteger(
        booking.totalPrice
      )

    const pricePerPassenger =
      toInteger(
        booking.pricePerPassenger
      )

    const arrivalDayOffset =
      toInteger(
        booking.arrivalDayOffset
      ) ?? 0

    const passengers =
      parsePassengers(
        booking.passengersJson
      )

    const tripType =
      cleanText(
        booking.tripType
      ).toLowerCase()

    const returnTrip =
      parseReturnTrip(
        booking.returnTripJson
      )

    if (
      passengerCount === null ||
      passengerCount < 1 ||
      totalPrice === null ||
      totalPrice < 0 ||
      pricePerPassenger === null ||
      pricePerPassenger < 0 ||
      passengers.length === 0
    ) {
      throw new LookupError(
        500,
        "The stored booking data is incomplete."
      )
    }

    if (
      tripType === "round-trip" &&
      !returnTrip
    ) {
      throw new LookupError(
        500,
        "The stored return-trip data is incomplete."
      )
    }

    const currency =
      cleanText(
        booking.currency
      ).toUpperCase() || "IDR"

    const outboundTrip: BookingTrip = {
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

      arrivalDayOffset,

      duration:
        cleanText(
          booking.duration
        ) ||
        "Duration unavailable",

      price:
        pricePerPassenger,

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
      throw new LookupError(
        500,
        "The stored outbound-trip data is incomplete."
      )
    }

    return noStoreJson({
      success: true,

      booking: {
        bookingCode:
          cleanText(
            booking.bookingCode
          ),

        createdAt:
          cleanText(
            booking.$createdAt
          ),

        bookingStatus:
          cleanText(
            booking.bookingStatus
          ),

        paymentStatus:
          cleanText(
            booking.paymentStatus
          ),

        tripType,

        departureDate:
          cleanText(
            booking.departureDate
          ),

        returnDate:
          cleanText(
            booking.returnDate
          ),

        passengerCount,
        totalPrice,
        currency,

        customer: {
          fullName:
            cleanText(
              booking.customerFullName
            ),

          email:
            storedEmail,

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

        returnTrip:
          returnTrip,
      },
    })
  } catch (error) {
    if (
      error instanceof LookupError
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

    console.error(
      "Public booking lookup error:",
      error
    )

    return noStoreJson(
      {
        success: false,

        error:
          "The booking lookup service is currently unavailable.",
      },
      500
    )
  }
}