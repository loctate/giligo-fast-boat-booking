import { ID } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"

type BookingRequest = {
  bookingCode: string
  createdAt: string
  bookingStatus: string
  paymentStatus: string
  tripType: string
  departureDate: string
  returnDate?: string
  passengerCount: number
  totalPrice: number

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

  notes?: string

  trip: {
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
}

function isValidBooking(
  booking: BookingRequest
): boolean {
  return Boolean(
    booking.bookingCode &&
      booking.bookingStatus &&
      booking.paymentStatus &&
      booking.tripType &&
      booking.departureDate &&
      booking.passengerCount > 0 &&
      booking.totalPrice >= 0 &&
      booking.customer?.fullName &&
      booking.customer?.email &&
      booking.customer?.whatsapp &&
      booking.customer?.country &&
      Array.isArray(booking.passengers) &&
      booking.passengers.length > 0 &&
      booking.trip?.id &&
      booking.trip?.operator &&
      booking.trip?.from &&
      booking.trip?.to
  )
}

export async function POST(request: Request) {
  try {
    const booking =
      (await request.json()) as BookingRequest

    if (!isValidBooking(booking)) {
      return Response.json(
        {
          success: false,
          error: "Data booking belum lengkap.",
        },
        {
          status: 400,
        }
      )
    }

    const rowData: Record<string, string | number> = {
      bookingCode: booking.bookingCode,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      tripType: booking.tripType,
      departureDate: booking.departureDate,
      passengerCount: booking.passengerCount,
      totalPrice: booking.totalPrice,

      customerFullName: booking.customer.fullName,
      customerEmail: booking.customer.email,
      customerWhatsapp: booking.customer.whatsapp,
      customerCountry: booking.customer.country,

      passengersJson: JSON.stringify(
        booking.passengers
      ),

      tripId: booking.trip.id,
      operatorName: booking.trip.operator,
      fromPort: booking.trip.from,
      toPort: booking.trip.to,
      departureTime: booking.trip.departureTime,
      arrivalTime: booking.trip.arrivalTime,
      duration: booking.trip.duration,
      pricePerPassenger: booking.trip.price,
      checkInLocation: booking.trip.checkInLocation,
    }

    if (booking.returnDate?.trim()) {
      rowData.returnDate =
        booking.returnDate.trim()
    }

    if (booking.notes?.trim()) {
      rowData.notes = booking.notes.trim()
    }

    const row = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.bookingsTableId,
      rowId: ID.unique(),
      data: rowData,
    })

    return Response.json(
      {
        success: true,
        rowId: row.$id,
        bookingCode: booking.bookingCode,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      "Appwrite booking error:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan pada server."

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    )
  }
}