import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  validateCustomerTravelDate,
} from "@/lib/bali-date"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type AppwriteRow = Record<string, unknown>

type PublicTripDetail = {
  tripInventoryId: string
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

  fromIsland: string | null
  toIsland: string | null

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  durationMinutes: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string
}

function optionalText(
  value: unknown
): string | null {
  const normalizedValue = String(
    value ?? ""
  ).trim()

  return normalizedValue || null
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

async function getRowOrNull(
  tableId: string,
  rowId: string
): Promise<AppwriteRow | null> {
  try {
    const row = await tablesDB.getRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId,
      rowId,
    })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      return null
    }

    throw error
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const tripInventoryId = String(
      id ?? ""
    ).trim()

    if (!tripInventoryId) {
      return noStoreJson(
        {
          success: false,
          error:
            "Trip inventory ID is required.",
        },
        400
      )
    }

    const requestUrl = new URL(
      request.url
    )

    const passengersValue =
      requestUrl.searchParams.get(
        "passengers"
      )

    const passengers =
      passengersValue === null
        ? 1
        : toInteger(passengersValue)

    if (
      passengers === null ||
      passengers < 1 ||
      passengers > 20
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "Passengers must be an integer between 1 and 20.",
        },
        400
      )
    }

    const inventory = await getRowOrNull(
      appwriteConfig
        .tripInventoryTableId,
      tripInventoryId
    )

    if (!inventory) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip could not be found.",
        },
        404
      )
    }

    const travelDate = String(
      inventory.travelDate ?? ""
    ).trim()

    const travelDateValidation =
      validateCustomerTravelDate(
        travelDate
      )

    if (!travelDateValidation.valid) {
      return noStoreJson(
        {
          success: false,

          minimumDate:
            travelDateValidation.minimumDate,

          error:
            travelDateValidation.error,
        },
        410
      )
    }

    if (
      inventory.isActive !== true ||
      String(
        inventory.salesStatus ?? ""
      )
        .trim()
        .toUpperCase() !== "OPEN"
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip is no longer available for booking.",
        },
        410
      )
    }

    const scheduleId = String(
      inventory.scheduleId ?? ""
    ).trim()

    const operatorId = String(
      inventory.operatorId ?? ""
    ).trim()

    const vesselId = String(
      inventory.vesselId ?? ""
    ).trim()

    const routeId = String(
      inventory.routeId ?? ""
    ).trim()

    if (
      !scheduleId ||
      !operatorId ||
      !vesselId ||
      !routeId
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has incomplete operational data.",
        },
        500
      )
    }

    const [
      schedule,
      operator,
      vessel,
      route,
    ] = await Promise.all([
      getRowOrNull(
        appwriteConfig
          .tripSchedulesTableId,
        scheduleId
      ),

      getRowOrNull(
        appwriteConfig.operatorsTableId,
        operatorId
      ),

      getRowOrNull(
        appwriteConfig.vesselsTableId,
        vesselId
      ),

      getRowOrNull(
        appwriteConfig.routesTableId,
        routeId
      ),
    ])

    if (
      !schedule ||
      !operator ||
      !vessel ||
      !route
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has missing operational records.",
        },
        410
      )
    }

    if (
      schedule.isActive !== true ||
      operator.isActive !== true ||
      vessel.isActive !== true ||
      route.isActive !== true
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip is currently inactive.",
        },
        410
      )
    }

    if (
      String(
        schedule.operatorId ?? ""
      ) !== operatorId ||
      String(
        schedule.vesselId ?? ""
      ) !== vesselId ||
      String(
        schedule.routeId ?? ""
      ) !== routeId
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has inconsistent schedule data.",
        },
        500
      )
    }

    if (
      String(
        vessel.operatorId ?? ""
      ) !== operatorId
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected vessel is not assigned to the trip operator.",
        },
        500
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
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has invalid seat data.",
        },
        500
      )
    }

    const availableSeats =
      seatCapacity -
      bookedSeats -
      heldSeats

    if (availableSeats < passengers) {
      return noStoreJson(
        {
          success: false,
          availableSeats: Math.max(
            0,
            availableSeats
          ),

          error:
            availableSeats <= 0
              ? "The selected trip is sold out."
              : `Only ${availableSeats} seats remain for this trip.`,
        },
        409
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

    const currency = String(
      inventory.currency ?? ""
    )
      .trim()
      .toUpperCase()

    if (
      adultPrice === null ||
      childPrice === null ||
      infantPrice === null ||
      adultPrice < 0 ||
      childPrice < 0 ||
      infantPrice < 0 ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has invalid pricing data.",
        },
        500
      )
    }

    const departureTime = String(
      inventory.departureTime ?? ""
    ).trim()

    const arrivalTime = String(
      inventory.arrivalTime ?? ""
    ).trim()

    const arrivalDayOffset = toInteger(
      inventory.arrivalDayOffset
    )

    const departureMinutes =
      timeToMinutes(departureTime)

    const arrivalMinutes =
      timeToMinutes(arrivalTime)

    if (
      departureMinutes === null ||
      arrivalMinutes === null ||
      arrivalDayOffset === null ||
      arrivalDayOffset < 0 ||
      arrivalDayOffset > 2
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has invalid departure or arrival data.",
        },
        500
      )
    }

    const absoluteArrivalMinutes =
      arrivalMinutes +
      arrivalDayOffset * 1440

    const durationMinutes =
      absoluteArrivalMinutes -
      departureMinutes

    if (durationMinutes <= 0) {
      return noStoreJson(
        {
          success: false,
          error:
            "The selected trip has an invalid journey duration.",
        },
        500
      )
    }

    const trip: PublicTripDetail = {
      tripInventoryId,

      inventoryCode: String(
        inventory.inventoryCode ?? ""
      ),

      scheduleId,

      scheduleCode: String(
        schedule.scheduleCode ?? ""
      ),

      operatorId,

      operatorCode: String(
        operator.operatorCode ?? ""
      ),

      operatorName: String(
        operator.operatorName ?? ""
      ),

      vesselId,

      vesselCode: String(
        vessel.vesselCode ?? ""
      ),

      vesselName: String(
        vessel.vesselName ?? ""
      ),

      routeId,

      routeCode: String(
        route.routeCode ?? ""
      ),

      fromPort: String(
        route.fromPort ?? ""
      ),

      toPort: String(
        route.toPort ?? ""
      ),

      fromIsland: optionalText(
        route.fromIsland
      ),

      toIsland: optionalText(
        route.toIsland
      ),

      travelDate:
        travelDateValidation.travelDate,

      departureTime,
      arrivalTime,
      arrivalDayOffset,
      durationMinutes,

      seatCapacity,
      bookedSeats,
      heldSeats,
      availableSeats,

      adultPrice,
      childPrice,
      infantPrice,
      currency,
    }

    return noStoreJson({
      success: true,

      minimumDate:
        travelDateValidation.minimumDate,

      passengers,
      trip,
    })
  } catch (error) {
    console.error(
      "Public trip detail error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The selected trip could not be loaded.",
      },
      500
    )
  }
}
