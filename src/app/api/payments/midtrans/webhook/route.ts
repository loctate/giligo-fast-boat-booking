import {
  createHash,
  timingSafeEqual,
} from "node:crypto"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  getMidtransServerKey,
  midtransSnap,
} from "@/lib/midtrans-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WebhookPayload =
  Record<string, unknown> & {
    order_id?: unknown
    status_code?: unknown
    gross_amount?: unknown
    signature_key?: unknown
    transaction_status?: unknown
  }

type BookingRow =
  Record<string, unknown> & {
    $id?: string
  }

type PaymentUpdate = {
  bookingStatus: string
  paymentStatus: string
  midtransOrderId: string
  midtransTransactionId?: string
  midtransTransactionStatus?: string
  midtransPaymentType?: string
  midtransFraudStatus?: string
}

class WebhookError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "WebhookError"
    this.status = status
  }
}

const REFUND_STATUSES =
  new Set([
    "refund",
    "partial_refund",
    "chargeback",
    "partial_chargeback",
  ])

const FINAL_LOCAL_PAYMENT_STATUSES =
  new Set([
    "paid",
    "refunded",
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

function parseGrossAmount(
  value: unknown
): number | null {
  const text = cleanText(value)

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      text
    )
  ) {
    return null
  }

  const amount = Number(text)

  return Number.isSafeInteger(amount)
    ? amount
    : null
}

function toStoredInteger(
  value: unknown
): number | null {
  const amount = Number(value)

  return Number.isSafeInteger(amount)
    ? amount
    : null
}

function createSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string
): string {
  return createHash("sha512")
    .update(
      orderId +
        statusCode +
        grossAmount +
        getMidtransServerKey(),
      "utf8"
    )
    .digest("hex")
}

function signaturesMatch(
  providedSignature: string,
  expectedSignature: string
): boolean {
  if (
    !/^[a-fA-F0-9]{128}$/.test(
      providedSignature
    ) ||
    !/^[a-fA-F0-9]{128}$/.test(
      expectedSignature
    )
  ) {
    return false
  }

  const providedBuffer =
    Buffer.from(
      providedSignature.toLowerCase(),
      "hex"
    )

  const expectedBuffer =
    Buffer.from(
      expectedSignature.toLowerCase(),
      "hex"
    )

  return timingSafeEqual(
    providedBuffer,
    expectedBuffer
  )
}

function verifySignature({
  orderId,
  statusCode,
  grossAmount,
  signature,
}: {
  orderId: string
  statusCode: string
  grossAmount: string
  signature: string
}): boolean {
  const expected =
    createSignature(
      orderId,
      statusCode,
      grossAmount
    )

  return signaturesMatch(
    signature,
    expected
  )
}

function extractBookingRowId(
  orderId: string
): string {
  const match =
    /^NGB-([A-Za-z0-9._~-]{1,36})-([A-Fa-f0-9]{8})$/.exec(
      orderId
    )

  if (!match) {
    throw new WebhookError(
      400,
      "The Midtrans order ID format is invalid."
    )
  }

  return match[1]
}

function createPaymentUpdate({
  booking,
  orderId,
  transactionStatus,
  statusCode,
  fraudStatus,
  transactionId,
  paymentType,
}: {
  booking: BookingRow
  orderId: string
  transactionStatus: string
  statusCode: string
  fraudStatus: string
  transactionId: string
  paymentType: string
}): PaymentUpdate {
  const currentBookingStatus =
    cleanText(
      booking.bookingStatus
    ) || "Pending"

  const currentPaymentStatus =
    cleanText(
      booking.paymentStatus
    ) || "Pending"

  const normalizedBookingStatus =
    currentBookingStatus
      .toLowerCase()

  const normalizedPaymentStatus =
    currentPaymentStatus
      .toLowerCase()

  const fraudIsAccepted =
    !fraudStatus ||
    fraudStatus === "accept"

  const paymentSucceeded =
    statusCode === "200" &&
    (
      transactionStatus ===
        "capture" ||
      transactionStatus ===
        "settlement"
    ) &&
    fraudIsAccepted

  const paymentWasRefunded =
    REFUND_STATUSES.has(
      transactionStatus
    )

  let nextBookingStatus =
    currentBookingStatus

  let nextPaymentStatus =
    currentPaymentStatus

  if (paymentSucceeded) {
    nextPaymentStatus = "Paid"

    /*
     * Booking yang telah dibatalkan atau
     * selesai tidak diubah otomatis.
     * Kondisi tersebut perlu review admin.
     */
    if (
      normalizedBookingStatus !==
        "cancelled" &&
      normalizedBookingStatus !==
        "completed"
    ) {
      nextBookingStatus =
        "Confirmed"
    }
  } else if (paymentWasRefunded) {
    nextPaymentStatus =
      "Refunded"
  } else if (
    !FINAL_LOCAL_PAYMENT_STATUSES.has(
      normalizedPaymentStatus
    )
  ) {
    /*
     * Pending, deny, cancel, expire,
     * failure, authorize, atau fraud
     * challenge tetap belum dibayar.
     */
    nextPaymentStatus =
      "Pending"
  }

  const update: PaymentUpdate = {
    bookingStatus:
      nextBookingStatus,

    paymentStatus:
      nextPaymentStatus,

    midtransOrderId:
      orderId,
  }

  if (transactionId) {
    update.midtransTransactionId =
      transactionId.slice(0, 64)
  }

  if (transactionStatus) {
    update.midtransTransactionStatus =
      transactionStatus.slice(0, 32)
  }

  if (paymentType) {
    update.midtransPaymentType =
      paymentType.slice(0, 32)
  }

  if (fraudStatus) {
    update.midtransFraudStatus =
      fraudStatus.slice(0, 16)
  }

  return update
}

function updateContainsChanges(
  booking: BookingRow,
  update: PaymentUpdate
): boolean {
  return Object.entries(update).some(
    ([key, value]) =>
      cleanText(
        booking[key]
      ) !== cleanText(value)
  )
}

export async function POST(
  request: Request
) {
  try {
    let notification:
      WebhookPayload

    try {
      notification =
        (await request.json()) as
          WebhookPayload
    } catch {
      throw new WebhookError(
        400,
        "The webhook body must contain valid JSON."
      )
    }

    const orderId =
      cleanText(
        notification.order_id
      )

    const statusCode =
      cleanText(
        notification.status_code
      )

    const grossAmount =
      cleanText(
        notification.gross_amount
      )

    const signature =
      cleanText(
        notification.signature_key
      )

    if (
      !orderId ||
      !statusCode ||
      !grossAmount ||
      !signature
    ) {
      throw new WebhookError(
        400,
        "Required Midtrans webhook fields are missing."
      )
    }

    if (
      !verifySignature({
        orderId,
        statusCode,
        grossAmount,
        signature,
      })
    ) {
      throw new WebhookError(
        401,
        "The Midtrans webhook signature is invalid."
      )
    }

    const bookingRowId =
      extractBookingRowId(
        orderId
      )

    let booking: BookingRow

    try {
      booking =
        await tablesDB.getRow({
          databaseId:
            appwriteConfig.databaseId,

          tableId:
            appwriteConfig
              .bookingsTableId,

          rowId:
            bookingRowId,
        }) as BookingRow
    } catch (error) {
      console.error(
        "Midtrans webhook booking lookup failed:",
        {
          bookingRowId,
          orderId,
          error,
        }
      )

      throw new WebhookError(
        404,
        "The linked booking could not be found."
      )
    }

    const activeOrderId =
      cleanText(
        booking.midtransOrderId
      )

    /*
     * Booking tanpa active order ID tidak
     * menerima perubahan dari Midtrans.
     */
    if (!activeOrderId) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The booking has no active Midtrans order.",
      })
    }

    const orderIsActive =
      activeOrderId === orderId

    const notificationTransactionStatus =
      normalizeStatus(
        notification
          .transaction_status
      )

    const notificationMayRepresentMoneyMovement =
      notificationTransactionStatus ===
        "capture" ||
      notificationTransactionStatus ===
        "settlement" ||
      REFUND_STATUSES.has(
        notificationTransactionStatus
      )

    /*
     * Order lama yang belum berhasil,
     * ditolak, dibatalkan, atau expired
     * dapat langsung diabaikan.
     *
     * Order lama yang mengaku sukses atau
     * refund tetap diverifikasi melalui
     * Get Status agar pembayaran valid
     * tidak hilang dari pencatatan.
     */
    if (
      !orderIsActive &&
      !notificationMayRepresentMoneyMovement
    ) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The inactive Midtrans order has no final money movement.",
      })
    }

    let authoritativeStatus:
      Record<string, unknown>

    try {
      authoritativeStatus =
        await midtransSnap
          .transaction
          .status(orderId)
    } catch (error) {
      console.error(
        "Midtrans Get Status failed:",
        {
          orderId,
          error,
        }
      )

      throw new WebhookError(
        503,
        "Midtrans transaction status is temporarily unavailable."
      )
    }

    const verifiedOrderId =
      cleanText(
        authoritativeStatus.order_id
      )

    const verifiedStatusCode =
      cleanText(
        authoritativeStatus.status_code
      )

    const verifiedGrossAmount =
      cleanText(
        authoritativeStatus.gross_amount
      )

    const verifiedSignature =
      cleanText(
        authoritativeStatus.signature_key
      )

    if (
      verifiedOrderId !==
      orderId
    ) {
      throw new WebhookError(
        502,
        "Midtrans returned a mismatched order ID."
      )
    }

    /*
     * Get Status merupakan komunikasi
     * backend-to-backend. Bila signature
     * tersedia, lakukan validasi tambahan.
     */
    if (
      verifiedSignature &&
      !verifySignature({
        orderId:
          verifiedOrderId,

        statusCode:
          verifiedStatusCode,

        grossAmount:
          verifiedGrossAmount,

        signature:
          verifiedSignature,
      })
    ) {
      throw new WebhookError(
        502,
        "Midtrans returned an invalid status signature."
      )
    }

    const storedTotal =
      toStoredInteger(
        booking.totalPrice
      )

    const verifiedTotal =
      parseGrossAmount(
        verifiedGrossAmount
      )

    if (
      storedTotal === null ||
      storedTotal <= 0 ||
      verifiedTotal === null ||
      verifiedTotal !==
        storedTotal
    ) {
      throw new WebhookError(
        409,
        "The Midtrans transaction amount does not match the booking."
      )
    }

    const currency =
      cleanText(
        authoritativeStatus.currency
      ).toUpperCase() || "IDR"

    if (currency !== "IDR") {
      throw new WebhookError(
        409,
        "The Midtrans transaction currency is invalid."
      )
    }

    const transactionStatus =
      normalizeStatus(
        authoritativeStatus
          .transaction_status
      )

    if (!transactionStatus) {
      throw new WebhookError(
        502,
        "Midtrans returned no transaction status."
      )
    }

    const authoritativeHasMoneyMovement =
      transactionStatus ===
        "capture" ||
      transactionStatus ===
        "settlement" ||
      REFUND_STATUSES.has(
        transactionStatus
      )

    /*
     * Payload awal hanya digunakan untuk
     * menentukan apakah order lama perlu
     * diperiksa. Keputusan akhir tetap
     * berasal dari Get Status Midtrans.
     */
    if (
      !orderIsActive &&
      !authoritativeHasMoneyMovement
    ) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The inactive Midtrans order is not successful or refunded.",
        orderId,
        transactionStatus,
      })
    }

    const fraudStatus =
      normalizeStatus(
        authoritativeStatus
          .fraud_status
      )

    const transactionId =
      cleanText(
        authoritativeStatus
          .transaction_id
      )

    const paymentType =
      normalizeStatus(
        authoritativeStatus
          .payment_type
      )

    const update =
      createPaymentUpdate({
        booking,
        orderId,

        transactionStatus,

        statusCode:
          verifiedStatusCode,

        fraudStatus,
        transactionId,
        paymentType,
      })

    if (
      !updateContainsChanges(
        booking,
        update
      )
    ) {
      return noStoreJson({
        success: true,
        idempotent: true,
        orderId,
        transactionStatus,
        bookingStatus:
          update.bookingStatus,
        paymentStatus:
          update.paymentStatus,
      })
    }

    try {
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .bookingsTableId,

        rowId:
          bookingRowId,

        data:
          update,
      })
    } catch (error) {
      console.error(
        "Midtrans webhook Appwrite update failed:",
        {
          bookingRowId,
          orderId,
          transactionStatus,
          error,
        }
      )

      throw new WebhookError(
        503,
        "The booking payment status could not be updated."
      )
    }

    return noStoreJson({
      success: true,
      orderId,
      transactionStatus,
      bookingStatus:
        update.bookingStatus,
      paymentStatus:
        update.paymentStatus,
    })
  } catch (error) {
    if (
      error instanceof
      WebhookError
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
      "Unexpected Midtrans webhook error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          "The Midtrans webhook could not be processed.",
      },
      500
    )
  }
}
