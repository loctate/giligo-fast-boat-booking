import {
  createD1PublicBookingLookup,
  D1BookingLookupError,
} from "@/lib/d1-booking-lookup"

import {
  findD1BookingByCodeAndEmail,
} from "@/lib/d1-booking-readers"

import {
  isPaymentVerificationModeEnabled,
} from "@/lib/payment-verification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LookupRequest = {
  bookingCode?: unknown
  email?: unknown
}

class LookupError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "LookupError"
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

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

export async function POST(
  request: Request
) {
  try {
    let body:
      LookupRequest

    try {
      body =
        (await request.json()) as
          LookupRequest
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

    if (
      !bookingCode ||
      !email
    ) {
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

    const booking =
      await findD1BookingByCodeAndEmail(
        bookingCode,
        email
      )

    const verificationError =
      "Booking could not be verified. Check the booking code and email address."

    if (!booking) {
      throw new LookupError(
        404,
        verificationError
      )
    }

    const publicBooking =
      createD1PublicBookingLookup(
        booking,
        {
          paymentVerificationModeEnabled:
            isPaymentVerificationModeEnabled(),
        }
      )

    return noStoreJson({
      success: true,
      booking:
        publicBooking,
    })
  } catch (error) {
    if (
      error instanceof
      LookupError
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
      D1BookingLookupError
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
      "Public D1 booking lookup error:",
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
