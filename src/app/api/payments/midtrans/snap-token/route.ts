import { randomBytes } from "node:crypto"
import { Query } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  midtransEnvironment,
  midtransSnap,
} from "@/lib/midtrans-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SnapTokenRequest = {
  bookingCode?: unknown
  email?: unknown
}

type AppwriteBookingRow =
  Record<string, unknown> & {
    $id?: string
  }

class PaymentError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "PaymentError"
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

function normalizeEmail(
  value: unknown
): string {
  return cleanText(value).toLowerCase()
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
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

  return Number.isSafeInteger(
    parsedValue
  )
    ? parsedValue
    : null
}

function createMidtransOrderId(
  bookingRowId: string
): string {
  /*
   * Format maksimal:
   * NGB- + 36 karakter row ID
   * + "-" + 8 karakter random
   * = 49 karakter.
   */
  if (
    !/^[A-Za-z0-9._~-]{1,36}$/.test(
      bookingRowId
    )
  ) {
    throw new PaymentError(
      500,
      "The stored booking identifier is invalid."
    )
  }

  const randomSuffix =
    randomBytes(4)
      .toString("hex")
      .toUpperCase()

  return `NGB-${bookingRowId}-${randomSuffix}`
}

function getMidtransErrorMessage(
  error: unknown
): string {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return ""
  }

  const errorObject =
    error as Record<string, unknown>

  if (
    Array.isArray(
      errorObject.error_messages
    )
  ) {
    const messages =
      errorObject.error_messages
        .map(cleanText)
        .filter(Boolean)

    if (messages.length > 0) {
      return messages.join(" ")
    }
  }

  if (
    typeof errorObject.ApiResponse ===
      "object" &&
    errorObject.ApiResponse !== null
  ) {
    const apiResponse =
      errorObject.ApiResponse as
        Record<string, unknown>

    if (
      Array.isArray(
        apiResponse.error_messages
      )
    ) {
      const messages =
        apiResponse.error_messages
          .map(cleanText)
          .filter(Boolean)

      if (messages.length > 0) {
        return messages.join(" ")
      }
    }

    const statusMessage =
      cleanText(
        apiResponse.status_message
      )

    if (statusMessage) {
      return statusMessage
    }
  }

  return cleanText(
    errorObject.message
  )
}

export async function POST(
  request: Request
) {
  try {
    let body: SnapTokenRequest

    try {
      body =
        (await request.json()) as
          SnapTokenRequest
    } catch {
      throw new PaymentError(
        400,
        "The payment request must contain valid JSON."
      )
    }

    const bookingCode =
      cleanText(
        body.bookingCode
      ).toUpperCase()

    const email =
      normalizeEmail(body.email)

    if (!bookingCode || !email) {
      throw new PaymentError(
        400,
        "Booking code and email are required."
      )
    }

    if (
      bookingCode.length > 40 ||
      !/^[A-Z0-9-]+$/.test(
        bookingCode
      )
    ) {
      throw new PaymentError(
        400,
        "The booking code is invalid."
      )
    }

    if (
      email.length > 200 ||
      !isValidEmail(email)
    ) {
      throw new PaymentError(
        400,
        "The email address is invalid."
      )
    }

    const bookingResult =
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

        total: false,
      })

    const booking =
      bookingResult.rows[0] as
        | AppwriteBookingRow
        | undefined

    if (!booking) {
      throw new PaymentError(
        404,
        "The booking could not be found."
      )
    }

    const storedEmail =
      normalizeEmail(
        booking.customerEmail
      )

    if (
      !storedEmail ||
      storedEmail !== email
    ) {
      throw new PaymentError(
        404,
        "The booking could not be found."
      )
    }

    const bookingRowId =
      cleanText(booking.$id)

    if (!bookingRowId) {
      throw new PaymentError(
        500,
        "The stored booking identifier is missing."
      )
    }

    const bookingStatus =
      cleanText(
        booking.bookingStatus
      ).toLowerCase()

    if (
      [
        "cancelled",
        "canceled",
        "expired",
      ].includes(bookingStatus)
    ) {
      throw new PaymentError(
        409,
        "This booking is no longer eligible for payment."
      )
    }

    const paymentStatus =
      cleanText(
        booking.paymentStatus
      ).toLowerCase()

    if (
      [
        "paid",
        "settlement",
        "settled",
        "capture",
        "captured",
        "success",
        "completed",
        "refunded",
        "chargeback",
      ].includes(paymentStatus)
    ) {
      throw new PaymentError(
        409,
        "This booking has already been paid or finalized."
      )
    }

    const totalPrice =
      toInteger(
        booking.totalPrice
      )

    if (
      totalPrice === null ||
      totalPrice <= 0
    ) {
      throw new PaymentError(
        500,
        "The stored booking total is invalid."
      )
    }

    const currency =
      cleanText(
        booking.currency
      ).toUpperCase() || "IDR"

    if (currency !== "IDR") {
      throw new PaymentError(
        409,
        "Midtrans currently supports IDR payments only."
      )
    }

    const customerFullName =
      cleanText(
        booking.customerFullName
      )

    if (!customerFullName) {
      throw new PaymentError(
        500,
        "The stored customer name is missing."
      )
    }

    const customerWhatsapp =
      cleanText(
        booking.customerWhatsapp
      )

    const orderId =
      createMidtransOrderId(
        bookingRowId
      )

    const transaction =
      await midtransSnap
        .createTransaction({
          transaction_details: {
            order_id: orderId,
            gross_amount:
              totalPrice,
          },

          item_details: [
            {
              id:
                bookingCode.slice(
                  0,
                  50
                ),

              price:
                totalPrice,

              quantity: 1,

              name:
                `NusaGiliBoat ${bookingCode}`
                  .slice(0, 50),
            },
          ],

          customer_details: {
            first_name:
              customerFullName.slice(
                0,
                255
              ),

            email:
              storedEmail,

            phone:
              customerWhatsapp.slice(
                0,
                255
              ),
          },
        })

    const snapToken =
      cleanText(
        transaction.token
      )

    const redirectUrl =
      cleanText(
        transaction.redirect_url
      )

    if (
      !snapToken ||
      !redirectUrl
    ) {
      throw new PaymentError(
        502,
        "Midtrans returned incomplete transaction data."
      )
    }

    return noStoreJson({
      success: true,
      environment:
        midtransEnvironment,

      bookingCode,
      orderId,
      snapToken,
      redirectUrl,
    })
  } catch (error) {
    if (
      error instanceof PaymentError
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

    const midtransMessage =
      getMidtransErrorMessage(
        error
      )

    console.error(
      "Midtrans Snap token error:",
      {
        message:
          midtransMessage ||
          "Unknown Midtrans error",
      }
    )

    return noStoreJson(
      {
        success: false,

        error:
          midtransMessage ||
          "The payment service is temporarily unavailable.",
      },
      502
    )
  }
}
