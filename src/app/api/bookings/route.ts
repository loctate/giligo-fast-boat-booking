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

  passengers?: {
    number?: unknown
    name?: unknown
  }[]

  notes?: unknown
}

type AppwriteRow = Record<string, unknown> & {
  $id?: string
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

  salesStatus: string
  checkInLocation: string
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

function normalizeRouteValue(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
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
  const baliDate =
    getCurrentBaliDate()

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
  transactionId: string,
  notFoundMessage: string
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
        notFoundMessage
      )
    }

    throw error
  }
}

async function loadTripForBooking({
  inventoryId,
  passengerCount,
  transactionId,
  journeyLabel,
}: {
  inventoryId: string
  passengerCount: number
  transactionId: string
  journeyLabel: "outbound" | "return"
}): Promise<LoadedTrip> {
  const inventory =
    await getTransactionRow(
      appwriteConfig.tripInventoryTableId,
      inventoryId,
      transactionId,
      `The selected ${journeyLabel} trip could not be found.`
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
        `The selected ${journeyLabel} travel date is no longer bookable.`
    )
  }

  const salesStatus = cleanText(
    inventory.salesStatus
  ).toUpperCase()

  if (
    inventory.isActive !== true ||
    salesStatus !== "OPEN"
  ) {
    throw new BookingError(
      410,
      `The selected ${journeyLabel} trip is no longer open for booking.`
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
      `The selected ${journeyLabel} trip has incomplete operational data.`
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
      transactionId,
      `The ${journeyLabel} schedule could not be found.`
    ),

    getTransactionRow(
      appwriteConfig.operatorsTableId,
      operatorId,
      transactionId,
      `The ${journeyLabel} operator could not be found.`
    ),

    getTransactionRow(
      appwriteConfig.vesselsTableId,
      vesselId,
      transactionId,
      `The ${journeyLabel} vessel could not be found.`
    ),

    getTransactionRow(
      appwriteConfig.routesTableId,
      routeId,
      transactionId,
      `The ${journeyLabel} route could not be found.`
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
      `The selected ${journeyLabel} trip is currently inactive.`
    )
  }

  if (
    cleanText(schedule.operatorId) !==
      operatorId ||
    cleanText(schedule.vesselId) !==
      vesselId ||
    cleanText(schedule.routeId) !==
      routeId
  ) {
    throw new BookingError(
      500,
      `The selected ${journeyLabel} schedule has inconsistent operational data.`
    )
  }

  if (
    cleanText(vessel.operatorId) !==
    operatorId
  ) {
    throw new BookingError(
      500,
      `The selected ${journeyLabel} vessel is not assigned to its operator.`
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
      `The selected ${journeyLabel} trip has invalid seat data.`
    )
  }

  const availableSeats =
    seatCapacity -
    bookedSeats -
    heldSeats

  if (availableSeats < passengerCount) {
    throw new BookingError(
      409,

      availableSeats <= 0
        ? `The selected ${journeyLabel} trip is sold out.`
        : `Only ${availableSeats} seats remain for the selected ${journeyLabel} trip.`
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
      `The selected ${journeyLabel} trip has invalid pricing data.`
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
    timeToMinutes(departureTime) ===
      null ||
    timeToMinutes(arrivalTime) ===
      null ||
    arrivalDayOffset === null ||
    arrivalDayOffset < 0 ||
    arrivalDayOffset > 2
  ) {
    throw new BookingError(
      500,
      `The selected ${journeyLabel} trip has invalid schedule times.`
    )
  }

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

  if (
    !operatorName ||
    !vesselName ||
    !fromPort ||
    !toPort
  ) {
    throw new BookingError(
      500,
      `The selected ${journeyLabel} trip has incomplete display information.`
    )
  }

  return {
    inventoryId,
    inventoryCode: cleanText(
      inventory.inventoryCode
    ),

    scheduleId,
    scheduleCode: cleanText(
      schedule.scheduleCode
    ),

    operatorId,
    operatorCode: cleanText(
      operator.operatorCode
    ),
    operatorName,

    vesselId,
    vesselCode: cleanText(
      vessel.vesselCode
    ),
    vesselName,

    routeId,
    routeCode: cleanText(
      route.routeCode
    ),

    fromPort,
    toPort,

    travelDate:
      travelDateValidation.travelDate,

    departureTime,
    arrivalTime,
    arrivalDayOffset,

    duration: formatDuration(
      departureTime,
      arrivalTime,
      arrivalDayOffset
    ),

    seatCapacity,
    bookedSeats,
    heldSeats,
    availableSeats,

    adultPrice,
    childPrice,
    infantPrice,
    currency,

    salesStatus,

    checkInLocation:
      "Check-in details will be provided after booking.",
  }
}

function createTripConfirmation(
  trip: LoadedTrip
) {
  return {
    id: trip.inventoryId,
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

async function reserveTripSeats({
  trip,
  passengerCount,
  transactionId,
  journeyLabel,
}: {
  trip: LoadedTrip
  passengerCount: number
  transactionId: string
  journeyLabel: "outbound" | "return"
}) {
  try {
    await tablesDB.incrementRowColumn({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      rowId:
        trip.inventoryId,

      column: "bookedSeats",
      value: passengerCount,

      max:
        trip.seatCapacity -
        trip.heldSeats,

      transactionId,
    })
  } catch (error) {
    console.error(
      `${journeyLabel} inventory seat increment error:`,
      error
    )

    throw new BookingError(
      409,
      `The remaining seats for the ${journeyLabel} trip changed while the booking was being processed. Please search again.`
    )
  }

  const remainingSeats =
    trip.availableSeats -
    passengerCount

  if (
    remainingSeats <= 0 &&
    trip.salesStatus === "OPEN"
  ) {
    await tablesDB.updateRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      rowId:
        trip.inventoryId,

      data: {
        salesStatus: "SOLD_OUT",
      },

      transactionId,
    })
  }
}

export async function POST(
  request: Request
) {
  let transactionId:
    | string
    | null = null

  try {
    let body: BookingRequest

    try {
      body =
        (await request.json()) as BookingRequest
    } catch {
      throw new BookingError(
        400,
        "The request body is not valid JSON."
      )
    }

    const tripType = cleanText(
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

    /*
     * tripInventoryId dipertahankan
     * untuk payload one-way lama.
     */
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

    transactionId = cleanText(
      transaction.$id
    )

    if (!transactionId) {
      throw new BookingError(
        500,
        "The booking transaction could not be created."
      )
    }

    const outboundTrip =
      await loadTripForBooking({
        inventoryId:
          outboundTripInventoryId,

        passengerCount,
        transactionId,

        journeyLabel:
          "outbound",
      })

    const returnTrip =
      tripType === "round-trip"
        ? await loadTripForBooking({
            inventoryId:
              returnTripInventoryId,

            passengerCount,
            transactionId,

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
      ID.unique()

    const bookingStatus =
      "Pending"

    const paymentStatus =
      "Pending"

    const rowData: Record<
      string,
      unknown
    > = {
      bookingCode,
      bookingStatus,
      paymentStatus,

      tripType,

      departureDate:
        outboundTrip.travelDate,

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

      /*
       * Kolom lama dipertahankan
       * sebagai snapshot outbound.
       */
      tripId:
        outboundTrip.inventoryId,

      tripInventoryId:
        outboundTrip.inventoryId,

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
    }

    if (notes) {
      rowData.notes = notes
    }

    if (returnTrip) {
      const returnTripSnapshot =
        JSON.stringify(
          createTripConfirmation(
            returnTrip
          )
        )

      if (
        returnTripSnapshot.length >
        5000
      ) {
        throw new BookingError(
          500,
          "The return trip snapshot is too large to store."
        )
      }

      rowData.returnDate =
        returnTrip.travelDate

      rowData.returnTripInventoryId =
        returnTrip.inventoryId

      rowData.returnTripJson =
        returnTripSnapshot
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

    await reserveTripSeats({
      trip:
        outboundTrip,

      passengerCount,
      transactionId,

      journeyLabel:
        "outbound",
    })

    if (returnTrip) {
      await reserveTripSeats({
        trip:
          returnTrip,

        passengerCount,
        transactionId,

        journeyLabel:
          "return",
      })
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

        rowId: cleanText(
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
            outboundTrip.travelDate,

          returnDate:
            returnTrip?.travelDate ??
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