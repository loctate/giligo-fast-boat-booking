import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"

const allowedBookingStatuses = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
]

const allowedPaymentStatuses = [
  "Demo",
  "Pending",
  "Paid",
  "Refunded",
]

type UpdateBookingRequest = {
  bookingStatus?: string
  paymentStatus?: string
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized. Please sign in as admin.",
        },
        {
          status: 401,
        }
      )
    }

    const { id } = await context.params

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Booking ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    const body =
      (await request.json()) as UpdateBookingRequest

    const bookingStatus = String(
      body.bookingStatus || ""
    ).trim()

    const paymentStatus = String(
      body.paymentStatus || ""
    ).trim()

    if (
      !allowedBookingStatuses.includes(
        bookingStatus
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid booking status.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !allowedPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid payment status.",
        },
        {
          status: 400,
        }
      )
    }

    const updatedBooking =
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.bookingsTableId,

        rowId: id,

        data: {
          bookingStatus,
          paymentStatus,
        },
      })

    return Response.json({
      success: true,
      booking: updatedBooking,
    })
  } catch (error) {
    console.error(
      "Booking status update error:",
      error
    )

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Booking status could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}