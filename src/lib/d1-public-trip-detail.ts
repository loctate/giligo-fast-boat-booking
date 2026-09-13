import {
  validateCustomerTravelDate,
} from "@/lib/bali-date"

import {
  getD1,
} from "@/lib/d1-server"

export type PublicTripDetailD1 = {
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

export type GetPublicTripDetailD1Input = {
  tripInventoryId: string
  passengers: number
}

type PublicTripDetailD1SuccessBody = {
  success: true
  minimumDate: string
  passengers: number
  trip: PublicTripDetailD1
}

type PublicTripDetailD1ErrorBody = {
  success: false
  minimumDate?: string
  availableSeats?: number
  error: string
}

export type PublicTripDetailD1Result =
  | {
      status: 200
      body: PublicTripDetailD1SuccessBody
    }
  | {
      status: 404 | 409 | 410 | 500
      body: PublicTripDetailD1ErrorBody
    }

type TripInventoryDetailRowD1 = {
  id: string
  inventoryCode: string

  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string

  salesStatus: string
  isActive: number
}

type TripScheduleDetailRowD1 = {
  id: string
  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  isActive: number
}

type OperatorDetailRowD1 = {
  id: string
  operatorCode: string
  operatorName: string
  isActive: number
}

type VesselDetailRowD1 = {
  id: string
  vesselCode: string
  vesselName: string
  operatorId: string
  isActive: number
}

type RouteDetailRowD1 = {
  id: string
  routeCode: string

  fromPort: string
  toPort: string

  fromIsland: string | null
  toIsland: string | null

  isActive: number
}

function optionalTextD1(
  value: unknown
): string | null {
  const normalizedValue =
    String(value ?? "").trim()

  return normalizedValue || null
}

function toIntegerD1(
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

  return Number.isInteger(
    parsedValue
  )
    ? parsedValue
    : null
}

function timeToMinutesD1(
  time: string
): number | null {
  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return null
  }

  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number)

  return (
    hours * 60 +
    minutes
  )
}

async function getInventoryD1(
  db: D1Database,
  id: string
): Promise<
  TripInventoryDetailRowD1 | null
> {
  return db
    .prepare(
      `SELECT
        id,
        inventoryCode,
        scheduleId,
        operatorId,
        vesselId,
        routeId,
        travelDate,
        departureTime,
        arrivalTime,
        arrivalDayOffset,
        seatCapacity,
        bookedSeats,
        heldSeats,
        adultPrice,
        childPrice,
        infantPrice,
        currency,
        salesStatus,
        isActive
      FROM trip_inventory
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<TripInventoryDetailRowD1>()
}

async function getScheduleD1(
  db: D1Database,
  id: string
): Promise<
  TripScheduleDetailRowD1 | null
> {
  return db
    .prepare(
      `SELECT
        id,
        scheduleCode,
        operatorId,
        vesselId,
        routeId,
        isActive
      FROM trip_schedules
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<TripScheduleDetailRowD1>()
}

async function getOperatorD1(
  db: D1Database,
  id: string
): Promise<
  OperatorDetailRowD1 | null
> {
  return db
    .prepare(
      `SELECT
        id,
        operatorCode,
        operatorName,
        isActive
      FROM operators
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<OperatorDetailRowD1>()
}

async function getVesselD1(
  db: D1Database,
  id: string
): Promise<
  VesselDetailRowD1 | null
> {
  return db
    .prepare(
      `SELECT
        id,
        vesselCode,
        vesselName,
        operatorId,
        isActive
      FROM vessels
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<VesselDetailRowD1>()
}

async function getRouteD1(
  db: D1Database,
  id: string
): Promise<
  RouteDetailRowD1 | null
> {
  return db
    .prepare(
      `SELECT
        id,
        routeCode,
        fromPort,
        toPort,
        fromIsland,
        toIsland,
        isActive
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<RouteDetailRowD1>()
}

export async function getPublicTripDetailD1(
  input: GetPublicTripDetailD1Input
): Promise<PublicTripDetailD1Result> {
  const db =
    getD1()

  const tripInventoryId =
    String(
      input.tripInventoryId ?? ""
    ).trim()

  const passengers =
    input.passengers

  const inventory =
    await getInventoryD1(
      db,
      tripInventoryId
    )

  if (!inventory) {
    return {
      status: 404,

      body: {
        success: false,
        error:
          "The selected trip could not be found.",
      },
    }
  }

  const travelDate =
    String(
      inventory.travelDate ?? ""
    ).trim()

  const travelDateValidation =
    validateCustomerTravelDate(
      travelDate
    )

  if (
    !travelDateValidation.valid
  ) {
    return {
      status: 410,

      body: {
        success: false,

        minimumDate:
          travelDateValidation.minimumDate,

        error:
          travelDateValidation.error,
      },
    }
  }

  if (
    inventory.isActive !== 1 ||
    String(
      inventory.salesStatus ?? ""
    )
      .trim()
      .toUpperCase() !== "OPEN"
  ) {
    return {
      status: 410,

      body: {
        success: false,
        error:
          "The selected trip is no longer available for booking.",
      },
    }
  }

  const scheduleId =
    String(
      inventory.scheduleId ?? ""
    ).trim()

  const operatorId =
    String(
      inventory.operatorId ?? ""
    ).trim()

  const vesselId =
    String(
      inventory.vesselId ?? ""
    ).trim()

  const routeId =
    String(
      inventory.routeId ?? ""
    ).trim()

  if (
    !scheduleId ||
    !operatorId ||
    !vesselId ||
    !routeId
  ) {
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has incomplete operational data.",
      },
    }
  }

  const [
    schedule,
    operator,
    vessel,
    route,
  ] = await Promise.all([
    getScheduleD1(
      db,
      scheduleId
    ),

    getOperatorD1(
      db,
      operatorId
    ),

    getVesselD1(
      db,
      vesselId
    ),

    getRouteD1(
      db,
      routeId
    ),
  ])

  if (
    !schedule ||
    !operator ||
    !vessel ||
    !route
  ) {
    return {
      status: 410,

      body: {
        success: false,
        error:
          "The selected trip has missing operational records.",
      },
    }
  }

  if (
    schedule.isActive !== 1 ||
    operator.isActive !== 1 ||
    vessel.isActive !== 1 ||
    route.isActive !== 1
  ) {
    return {
      status: 410,

      body: {
        success: false,
        error:
          "The selected trip is currently inactive.",
      },
    }
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
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has inconsistent schedule data.",
      },
    }
  }

  if (
    String(
      vessel.operatorId ?? ""
    ) !== operatorId
  ) {
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected vessel is not assigned to the trip operator.",
      },
    }
  }

  const seatCapacity =
    toIntegerD1(
      inventory.seatCapacity
    )

  const bookedSeats =
    toIntegerD1(
      inventory.bookedSeats
    )

  const heldSeats =
    toIntegerD1(
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
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has invalid seat data.",
      },
    }
  }

  const availableSeats =
    seatCapacity -
    bookedSeats -
    heldSeats

  if (
    availableSeats <
    passengers
  ) {
    return {
      status: 409,

      body: {
        success: false,

        availableSeats:
          Math.max(
            0,
            availableSeats
          ),

        error:
          availableSeats <= 0
            ? "The selected trip is sold out."
            : `Only ${availableSeats} seats remain for this trip.`,
      },
    }
  }

  const adultPrice =
    toIntegerD1(
      inventory.adultPrice
    )

  const childPrice =
    toIntegerD1(
      inventory.childPrice
    )

  const infantPrice =
    toIntegerD1(
      inventory.infantPrice
    )

  const currency =
    String(
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
    !/^[A-Z]{3}$/.test(
      currency
    )
  ) {
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has invalid pricing data.",
      },
    }
  }

  const departureTime =
    String(
      inventory.departureTime ?? ""
    ).trim()

  const arrivalTime =
    String(
      inventory.arrivalTime ?? ""
    ).trim()

  const arrivalDayOffset =
    toIntegerD1(
      inventory.arrivalDayOffset
    )

  const departureMinutes =
    timeToMinutesD1(
      departureTime
    )

  const arrivalMinutes =
    timeToMinutesD1(
      arrivalTime
    )

  if (
    departureMinutes === null ||
    arrivalMinutes === null ||
    arrivalDayOffset === null ||
    arrivalDayOffset < 0 ||
    arrivalDayOffset > 2
  ) {
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has invalid departure or arrival data.",
      },
    }
  }

  const absoluteArrivalMinutes =
    arrivalMinutes +
    arrivalDayOffset * 1440

  const durationMinutes =
    absoluteArrivalMinutes -
    departureMinutes

  if (
    durationMinutes <= 0
  ) {
    return {
      status: 500,

      body: {
        success: false,
        error:
          "The selected trip has an invalid journey duration.",
      },
    }
  }

  const trip:
    PublicTripDetailD1 = {
      tripInventoryId,

      inventoryCode:
        String(
          inventory.inventoryCode ?? ""
        ),

      scheduleId,

      scheduleCode:
        String(
          schedule.scheduleCode ?? ""
        ),

      operatorId,

      operatorCode:
        String(
          operator.operatorCode ?? ""
        ),

      operatorName:
        String(
          operator.operatorName ?? ""
        ),

      vesselId,

      vesselCode:
        String(
          vessel.vesselCode ?? ""
        ),

      vesselName:
        String(
          vessel.vesselName ?? ""
        ),

      routeId,

      routeCode:
        String(
          route.routeCode ?? ""
        ),

      fromPort:
        String(
          route.fromPort ?? ""
        ),

      toPort:
        String(
          route.toPort ?? ""
        ),

      fromIsland:
        optionalTextD1(
          route.fromIsland
        ),

      toIsland:
        optionalTextD1(
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

  return {
    status: 200,

    body: {
      success: true,

      minimumDate:
        travelDateValidation.minimumDate,

      passengers,
      trip,
    },
  }
}
