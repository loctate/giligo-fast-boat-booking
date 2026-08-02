import { Query } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PaymentRequest = {
  bookingCode?: unknown
  email?: unknown
}

type AppwriteRow = Record<
  string,
  unknown
> & {
  $id?: string
}

type BridgeResponse = {
  ok?: boolean
  code?: string
  message?: string
  payment?: {
    sessionId?: unknown
    referenceId?: unknown
    paymentUrl?: unknown
  }
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

const FINAL_PAYMENT_STATUSES =
  new Set([
    "paid",
    "settlement",
    "settled",
    "capture",
    "captured",
    "success",
    "completed",
    "refunded",
    "chargeback",
  ])

const BLOCKED_BOOKING_STATUSES =
  new Set([
    "cancelled",
    "canceled",
    "expired",
    "completed",
  ])

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

function normalizeStatus(
  value: unknown
): string {
  return cleanText(value).toLowerCase()
}

function toPositiveInteger(
  value: unknown
): number | null {
  const parsed = Number(value)

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return null
  }

  return parsed
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

function requireServerEnv(
  name: string
): string {
  const value =
    cleanText(process.env[name])

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    )
  }

  return value
}

function requireHttpsBaseUrl(
  value: string,
  name: string
): URL {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error(
      `${name} is not a valid URL.`
    )
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      `${name} must use HTTPS.`
    )
  }

  return parsed
}

function buildBookingUrl(
  publicBaseUrl: URL,
  bookingCode: string
): string {
  return new URL(
    `/booking/${encodeURIComponent(
      bookingCode
    )}`,
    publicBaseUrl
  ).toString()
}

function buildDescription(
  booking: AppwriteRow
): string {
  const fromPort =
    cleanText(booking.fromPort)

  const toPort =
    cleanText(booking.toPort)

  const departureDate =
    cleanText(booking.departureDate)

  const returnDate =
    cleanText(booking.returnDate)

  const tripType =
    normalizeStatus(booking.tripType)

  const outbound =
    fromPort && toPort
      ? `${fromPort} to ${toPort}`
      : "Fast boat journey"

  if (
    tripType === "round-trip" &&
    returnDate
  ) {
    return `${outbound}, departure ${departureDate}, return ${returnDate}`
  }

  return `${outbound}, departure ${departureDate}`
}

function bridgeErrorMessage(
  code: string
): string {
  switch (code) {
    case "IPAYMU_BRIDGE_DISABLED":
      return "The payment service is temporarily unavailable."

    case "IPAYMU_API_ERROR":
      return "iPaymu rejected the payment request."

    case "IPAYMU_TIMEOUT":
      return "The payment provider did not respond in time."

    case "IPAYMU_TRANSPORT_ERROR":
      return "The payment provider could not be reached."

    case "INVALID_REQUEST":
      return "The payment request data is invalid."

    case "UNAUTHORIZED":
      return "The payment service authentication failed."

    default:
      return "The payment session could not be created."
  }
}

export async function POST(
  request: Request
) {
  try {
    let body: PaymentRequest

    try {
      body =
        (await request.json()) as PaymentRequest
    } catch {
      throw new PaymentError(
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
      throw new PaymentError(
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
      throw new PaymentError(
        400,
        "The booking code format is invalid."
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

          Query.limit(2),
        ],
      })

    const rows =
      result.rows as unknown as AppwriteRow[]

    /*
     * bookingCode belum memiliki unique index.
     * Jangan membuat pembayaran jika terjadi
     * collision atau data ganda.
     */
    if (rows.length !== 1) {
      throw new PaymentError(
        404,
        "Booking could not be verified."
      )
    }

    const booking = rows[0]

    const storedEmail =
      cleanText(
        booking.customerEmail
      ).toLowerCase()

    if (
      !storedEmail ||
      storedEmail !== email
    ) {
      throw new PaymentError(
        404,
        "Booking could not be verified."
      )
    }

    const bookingStatus =
      normalizeStatus(
        booking.bookingStatus
      )

    const paymentStatus =
      normalizeStatus(
        booking.paymentStatus
      )

    if (
      BLOCKED_BOOKING_STATUSES.has(
        bookingStatus
      ) ||
      FINAL_PAYMENT_STATUSES.has(
        paymentStatus
      )
    ) {
      throw new PaymentError(
        409,
        "Payment is no longer available for this booking."
      )
    }

    const totalPrice =
      toPositiveInteger(
        booking.totalPrice
      )

    const passengerCount =
      toPositiveInteger(
        booking.passengerCount
      )

    const buyerName =
      cleanText(
        booking.customerFullName
      )

    const buyerPhone =
      cleanText(
        booking.customerWhatsapp
      )

    if (
      totalPrice === null ||
      passengerCount === null ||
      !buyerName ||
      !buyerPhone
    ) {
      throw new PaymentError(
        500,
        "The stored booking data is incomplete."
      )
    }

    const publicBaseUrl =
      requireHttpsBaseUrl(
        requireServerEnv(
          "NUSAGILIBOAT_PUBLIC_BASE_URL"
        ),
        "NUSAGILIBOAT_PUBLIC_BASE_URL"
      )

    const bridgeBaseUrl =
      requireHttpsBaseUrl(
        requireServerEnv(
          "IPAYMU_BRIDGE_URL"
        ),
        "IPAYMU_BRIDGE_URL"
      )

    const internalToken =
      requireServerEnv(
        "IPAYMU_BRIDGE_INTERNAL_TOKEN"
      )

    const bookingUrl =
      buildBookingUrl(
        publicBaseUrl,
        bookingCode
      )

    const transactionUrl =
      new URL(
        "transactions",
        bridgeBaseUrl.toString().endsWith("/")
          ? bridgeBaseUrl
          : `${bridgeBaseUrl.toString()}/`
      )

    const notifyUrl =
      new URL(
        "callback",
        bridgeBaseUrl.toString().endsWith("/")
          ? bridgeBaseUrl
          : `${bridgeBaseUrl.toString()}/`
      )

    const tripType =
      normalizeStatus(
        booking.tripType
      )

    const productName =
      tripType === "round-trip"
        ? "Nusa Gili Boat Round Trip"
        : "Nusa Gili Boat One Way"

    const controller =
      new AbortController()

    const timeout =
      setTimeout(
        () => controller.abort(),
        15000
      )

    let bridgeResponse: Response

    try {
      bridgeResponse =
        await fetch(
          transactionUrl,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${internalToken}`,

              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              product: [
                productName,
              ],

              qty: [1],

              price: [
                totalPrice,
              ],

              description: [
                buildDescription(
                  booking
                ),
              ],

              referenceId:
                bookingCode,

              buyerName,

              buyerEmail:
                storedEmail,

              buyerPhone,

              returnUrl:
                bookingUrl,

              cancelUrl:
                bookingUrl,

              notifyUrl:
                notifyUrl.toString(),
            }),

            signal:
              controller.signal,

            cache: "no-store",
          }
        )
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new PaymentError(
          504,
          "The payment service did not respond in time."
        )
      }

      throw new PaymentError(
        502,
        "The payment service could not be reached."
      )
    } finally {
      clearTimeout(timeout)
    }

    const responseText =
      await bridgeResponse.text()

    let bridgeResult: BridgeResponse

    try {
      bridgeResult =
        JSON.parse(
          responseText
        ) as BridgeResponse
    } catch {
      console.error(
        "iPaymu bridge returned non-JSON:",
        {
          status:
            bridgeResponse.status,

          contentType:
            bridgeResponse.headers.get(
              "content-type"
            ),
        }
      )

      throw new PaymentError(
        502,
        "The payment service returned an invalid response."
      )
    }

    if (
      !bridgeResponse.ok ||
      !bridgeResult.ok
    ) {
      const code =
        cleanText(
          bridgeResult.code
        )

      console.error(
        "iPaymu payment session rejected:",
        {
          status:
            bridgeResponse.status,

          code:
            code || "UNKNOWN",
        }
      )

      throw new PaymentError(
        bridgeResponse.status >= 400 &&
        bridgeResponse.status < 600
          ? bridgeResponse.status
          : 502,

        bridgeErrorMessage(code)
      )
    }

    const sessionId =
      cleanText(
        bridgeResult.payment
          ?.sessionId
      )

    const referenceId =
      cleanText(
        bridgeResult.payment
          ?.referenceId
      )

    const paymentUrl =
      cleanText(
        bridgeResult.payment
          ?.paymentUrl
      )

    let parsedPaymentUrl: URL

    try {
      parsedPaymentUrl =
        new URL(paymentUrl)
    } catch {
      throw new PaymentError(
        502,
        "The payment service returned an invalid payment URL."
      )
    }

    if (
      parsedPaymentUrl.protocol !==
      "https:"
    ) {
      throw new PaymentError(
        502,
        "The payment service returned an insecure payment URL."
      )
    }

    if (
      !sessionId ||
      referenceId !== bookingCode
    ) {
      throw new PaymentError(
        502,
        "The payment service returned incomplete session data."
      )
    }

    return noStoreJson(
      {
        success: true,

        payment: {
          sessionId,
          referenceId,
          paymentUrl:
            parsedPaymentUrl.toString(),
        },
      },
      201
    )
  } catch (error) {
    if (
      error instanceof PaymentError
    ) {
      return noStoreJson(
        {
          success: false,
          error: error.message,
        },
        error.status
      )
    }

    console.error(
      "iPaymu payment creation error:",
      error
    )

    return noStoreJson(
      {
        success: false,

        error:
          "The payment service is currently unavailable.",
      },
      500
    )
  }
}
