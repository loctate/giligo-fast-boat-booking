import { randomBytes } from "node:crypto"

import { ID } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  getCurrentBaliDate,
  validateCustomerTravelDate,
} from "@/lib/bali-date"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BookingRequest = {
  tripInventoryId?: unknown
  tripType?: unknown
  returnDate?: unknown
  passengerCount?: unknown

  customer?: {
    fullName?: unknown
    email?: unknown
    whatsapp?: unknown
    country?: unknown
  }

  passengers?: {
    number?: unknown
    name?: unknown
  }[]

  notes?: unknown
}

type AppwriteRow = Record<string, unknown> & {
  $id?: string
}

class BookingError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "BookingError"
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

function cleanText(value: unknown): string {
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

function getErrorCode(
  error: unknown
): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = Number(
      (error as { code?: unknown }).code
    )

    return Number.isFinite(code)
      ? code
      : null
  }

  return null
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

function isValidDateOnly(
  value: string
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  )
}

function timeToMinutes(
  time: string
): number | null {
  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return null
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function formatDuration(
  departureTime: string,
  arrivalTime: string,
  arrivalDayOffset: number
): string {
  const departureMinutes =
    timeToMinutes(departureTime)

  const arrivalMinutes =
    timeToMinutes(arrivalTime)

  if (
    departureMinutes === null ||
    arrivalMinutes === null
  ) {
    return "Duration unavailable"
  }

  const durationMinutes =
    arrivalMinutes +
    arrivalDayOffset * 1440 -
    departureMinutes

  if (durationMinutes <= 0) {
    return "Duration unavailable"
  }

  const hours = Math.floor(
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
  const baliDate = getCurrentBaliDate()

  const compactDate = baliDate
    .slice(2)
    .replaceAll("-", "")

  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase()

  return `GG-${compactDate}-${randomPart}`
}

async function rollbackTransaction(
  transactionId: string
) {
  try {
    await tablesDB.updateTransaction({
      transactionId,
      rollback: true,
    })
  } catch (rollbackError) {
    console.error(
      "Booking transaction rollback error:",
      rollbackError
    )
  }
}

async function getTransactionRow(
  tableId: string,
  rowId: string,
  transactionId: string
): Promise<AppwriteRow> {
  try {
    const row = await tablesDB.getRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId,
      rowId,
      transactionId,
    })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      throw new BookingError(
        404,
        "The selected trip could not be found."
      )
    }

    throw error
  }
}

export async function POST(
  request: Request
) {
  let transactionId: string | null = null

  try {
    const body =
      (await request.json()) as BookingRequest

    const tripInventoryId = cleanText(
      body.tripInventoryId
    )

    const tripType = cleanText(
      body.tripType
    )

    const returnDate = cleanText(
      body.returnDate
    )

    const passengerCount = toInteger(
      body.passengerCount
    )

    if (!tripInventoryId) {
      throw new BookingError(
        400,
        "Trip inventory ID is required."
      )
    }

    if (
      tripType !== "one-way" &&
      tripType !== "round-trip"
    ) {
      throw new BookingError(
        400,
        "Invalid trip type."
      )
    }

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

    if (
      tripType === "round-trip" &&
      !returnDate
    ) {
      throw new BookingError(
        400,
        "Return date is required for a round trip."
      )
    }

    if (
      returnDate &&
      !isValidDateOnly(returnDate)
    ) {
      throw new BookingError(
        400,
        "Return date must use YYYY-MM-DD format."
      )
    }

    const fullName = cleanText(
      body.customer?.fullName
    )

    const email = cleanText(
      body.customer?.email
    ).toLowerCase()

    const whatsapp = cleanText(
      body.customer?.whatsapp
    )

    const country = cleanText(
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

    if (fullName.length > 150) {
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

    if (whatsapp.length > 50) {
      throw new BookingError(
        400,
        "WhatsApp number is too long."
      )
    }

    if (country.length > 100) {
      throw new BookingError(
        400,
        "Country name is too long."
      )
    }

    const rawPassengers =
      Array.isArray(body.passengers)
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
        (passenger, index) => ({
          number: index + 1,

          name: cleanText(
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

    const notes = cleanText(
      body.notes
    )

    if (notes.length > 2000) {
      throw new BookingError(
        400,
        "Notes are too long."
      )
    }

    const transaction =
      await tablesDB.createTransaction({
        ttl: 60,
      })

    transactionId = String(
      transaction.$id
    )

    if (!transactionId) {
      throw new BookingError(
        500,
        "The booking transaction could not be created."
      )
    }

    const inventory =
      await getTransactionRow(
        appwriteConfig
          .tripInventoryTableId,

        tripInventoryId,
        transactionId
      )

    const travelDate = cleanText(
      inventory.travelDate
    )

    const travelDateValidation =
      validateCustomerTravelDate(
        travelDate
      )

    if (!travelDateValidation.valid) {
      throw new BookingError(
        410,
        travelDateValidation.error ||
          "The selected travel date is no longer bookable."
      )
    }

    if (
      inventory.isActive !== true ||
      cleanText(
        inventory.salesStatus
      ).toUpperCase() !== "OPEN"
    ) {
      throw new BookingError(
        410,
        "The selected trip is no longer open for booking."
      )
    }

    const scheduleId = cleanText(
      inventory.scheduleId
    )

    const operatorId = cleanText(
      inventory.operatorId
    )

    const vesselId = cleanText(
      inventory.vesselId
    )

    const routeId = cleanText(
      inventory.routeId
    )

    if (
      !scheduleId ||
      !operatorId ||
      !vesselId ||
      !routeId
    ) {
      throw new BookingError(
        500,
        "The selected trip has incomplete operational data."
      )
    }

    const [
      schedule,
      operator,
      vessel,
      route,
    ] = await Promise.all([
      getTransactionRow(
        appwriteConfig
          .tripSchedulesTableId,

        scheduleId,
        transactionId
      ),

      getTransactionRow(
        appwriteConfig
          .operatorsTableId,

        operatorId,
        transactionId
      ),

      getTransactionRow(
        appwriteConfig
          .vesselsTableId,

        vesselId,
        transactionId
      ),

      getTransactionRow(
        appwriteConfig
          .routesTableId,

        routeId,
        transactionId
      ),
    ])

    if (
      schedule.isActive !== true ||
      operator.isActive !== true ||
      vessel.isActive !== true ||
      route.isActive !== true
    ) {
      throw new BookingError(
        410,
        "The selected trip is currently inactive."
      )
    }

    if (
      cleanText(
        schedule.operatorId
      ) !== operatorId ||
      cleanText(
        schedule.vesselId
      ) !== vesselId ||
      cleanText(
        schedule.routeId
      ) !== routeId
    ) {
      throw new BookingError(
        500,
        "The selected schedule has inconsistent operational data."
      )
    }

    if (
      cleanText(
        vessel.operatorId
      ) !== operatorId
    ) {
      throw new BookingError(
        500,
        "The selected vessel is not assigned to the trip operator."
      )
    }

    const seatCapacity = toInteger(
      inventory.seatCapacity
    )

    const bookedSeats = toInteger(
      inventory.bookedSeats
    )

    const heldSeats = toInteger(
      inventory.heldSeats
    )

    if (
      seatCapacity === null ||
      bookedSeats === null ||
      heldSeats === null ||
      seatCapacity < 0 ||
      bookedSeats < 0 ||
      heldSeats < 0
    ) {
      throw new BookingError(
        500,
        "The selected trip has invalid seat data."
      )
    }

    const availableSeats =
      seatCapacity -
      bookedSeats -
      heldSeats

    if (
      availableSeats <
      passengerCount
    ) {
      throw new BookingError(
        409,
        availableSeats <= 0
          ? "The selected trip is sold out."
          : `Only ${availableSeats} seats remain for this trip.`
      )
    }

    const adultPrice = toInteger(
      inventory.adultPrice
    )

    const childPrice = toInteger(
      inventory.childPrice
    )

    const infantPrice = toInteger(
      inventory.infantPrice
    )

    const currency = cleanText(
      inventory.currency
    ).toUpperCase()

    if (
      adultPrice === null ||
      childPrice === null ||
      infantPrice === null ||
      adultPrice < 0 ||
      childPrice < 0 ||
      infantPrice < 0 ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      throw new BookingError(
        500,
        "The selected trip has invalid pricing data."
      )
    }

    const totalPrice =
      adultPrice *
      passengerCount

    if (
      !Number.isSafeInteger(
        totalPrice
      )
    ) {
      throw new BookingError(
        500,
        "The calculated booking total is invalid."
      )
    }

    const departureTime = cleanText(
      inventory.departureTime
    )

    const arrivalTime = cleanText(
      inventory.arrivalTime
    )

    const arrivalDayOffset = toInteger(
      inventory.arrivalDayOffset
    )

    if (
      timeToMinutes(
        departureTime
      ) === null ||
      timeToMinutes(
        arrivalTime
      ) === null ||
      arrivalDayOffset === null ||
      arrivalDayOffset < 0 ||
      arrivalDayOffset > 2
    ) {
      throw new BookingError(
        500,
        "The selected trip has invalid schedule times."
      )
    }

    if (
      returnDate &&
      returnDate <
        travelDateValidation.travelDate
    ) {
      throw new BookingError(
        400,
        "Return date cannot be before the departure date."
      )
    }

    const bookingCode =
      createBookingCode()

    const bookingRowId =
      ID.unique()

    const bookingStatus =
      "Pending"

    const paymentStatus =
      "Pending"

    const operatorName = cleanText(
      operator.operatorName
    )

    const vesselName = cleanText(
      vessel.vesselName
    )

    const fromPort = cleanText(
      route.fromPort
    )

    const toPort = cleanText(
      route.toPort
    )

    const duration =
      formatDuration(
        departureTime,
        arrivalTime,
        arrivalDayOffset
      )

    const checkInLocation =
      "Check-in details will be provided after booking."

    const rowData:
      Record<string, string | number> = {
      bookingCode,
      bookingStatus,
      paymentStatus,
      tripType,

      departureDate:
        travelDateValidation.travelDate,

      passengerCount,
      totalPrice,

      customerFullName: fullName,
      customerEmail: email,
      customerWhatsapp: whatsapp,
      customerCountry: country,

      passengersJson:
        JSON.stringify(passengers),

      tripId:
        tripInventoryId,

      operatorName,
      fromPort,
      toPort,
      departureTime,
      arrivalTime,
      duration,

      pricePerPassenger:
        adultPrice,

      checkInLocation,

      tripInventoryId,

      inventoryCode:
        cleanText(
          inventory.inventoryCode
        ),

      scheduleId,
      operatorId,
      vesselId,
      routeId,
      vesselName,

      routeCode:
        cleanText(
          route.routeCode
        ),

      currency,
      arrivalDayOffset,
    }

    if (returnDate) {
      rowData.returnDate =
        returnDate
    }

    if (notes) {
      rowData.notes = notes
    }

    const bookingRow =
      await tablesDB.createRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .bookingsTableId,

        rowId:
          bookingRowId,

        data:
          rowData,

        transactionId,
      })

    try {
      await tablesDB.incrementRowColumn({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        rowId:
          tripInventoryId,

        column:
          "bookedSeats",

        value:
          passengerCount,

        max:
          seatCapacity -
          heldSeats,

        transactionId,
      })
    } catch (error) {
      console.error(
        "Inventory seat increment error:",
        error
      )

      throw new BookingError(
        409,
        "The remaining seats changed while the booking was being processed. Please search again."
      )
    }

    await tablesDB.updateTransaction({
      transactionId,
      commit: true,
    })

    transactionId = null

    const createdAt =
      new Date().toISOString()

    return noStoreJson(
      {
        success: true,

        rowId:
          String(
            bookingRow.$id
          ),

        bookingCode,

        booking: {
          bookingCode,
          createdAt,
          bookingStatus,
          paymentStatus,
          tripType,

          departureDate:
            travelDateValidation
              .travelDate,

          returnDate,
          passengerCount,
          totalPrice,

          customer: {
            fullName,
            email,
            whatsapp,
            country,
          },

          passengers,
          notes,

          trip: {
            id:
              tripInventoryId,

            operator:
              operatorName,

            from:
              fromPort,

            to:
              toPort,

            departureTime,
            arrivalTime,
            duration,

            price:
              adultPrice,

            checkInLocation,
          },
        },
      },
      201
    )
  } catch (error) {
    if (transactionId) {
      await rollbackTransaction(
        transactionId
      )
    }

    if (
      error instanceof BookingError
    ) {
      return noStoreJson(
        {
          success: false,
          error: error.message,
        },
        error.status
      )
    }

    const errorCode =
      getErrorCode(error)

    console.error(
      "Secure booking creation error:",
      error
    )

    if (errorCode === 409) {
      return noStoreJson(
        {
          success: false,
          error:
            "The trip inventory changed while the booking was processed. Please search again.",
        },
        409
      )
    }

    return noStoreJson(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The booking could not be created.",
      },
      500
    )
  }
}
