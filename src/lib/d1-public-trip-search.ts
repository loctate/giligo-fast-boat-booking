import { getD1 } from "@/lib/d1-server"

export type PublicTripD1 = {
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

  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string
}

export type SearchPublicTripsD1Input = {
  fromPort: string
  toPort: string
  travelDate: string
  passengers: number
}

type D1PublicSearchRouteRow = {
  id: string
  routeCode: string
  fromPort: string
  toPort: string
  fromIsland: string | null
  toIsland: string | null
  isActive: number
}

type D1PublicSearchJoinedRow = {
  inventoryId: string
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

  scheduleRowId: string | null
  scheduleCode: string | null

  scheduleOperatorId: string | null
  scheduleVesselId: string | null
  scheduleRouteId: string | null

  scheduleIsActive: number | null

  operatorRowId: string | null
  operatorCode: string | null
  operatorName: string | null
  operatorIsActive: number | null

  vesselRowId: string | null
  vesselCode: string | null
  vesselName: string | null
  vesselIsActive: number | null

  routeRowId: string | null
  routeCode: string | null
  fromPort: string | null
  toPort: string | null
  fromIsland: string | null
  toIsland: string | null
  routeIsActive: number | null
}

function optionalTextD1(
  value: unknown
): string | null {
  const normalizedValue =
    String(value ?? "").trim()

  return normalizedValue || null
}

export function normalizePublicSearchTextD1(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function isTrueD1(
  value: number | null
): boolean {
  return value === 1
}

export function sortPublicTripsD1(
  trips: PublicTripD1[]
): PublicTripD1[] {
  return [...trips].sort(
    (
      firstTrip,
      secondTrip
    ) => {
      const departureComparison =
        firstTrip.departureTime.localeCompare(
          secondTrip.departureTime
        )

      if (
        departureComparison !== 0
      ) {
        return departureComparison
      }

      return firstTrip.operatorName.localeCompare(
        secondTrip.operatorName,
        "en",
        {
          sensitivity: "base",
        }
      )
    }
  )
}

async function listMatchedRoutesD1(
  db: D1Database,
  fromPort: string,
  toPort: string
): Promise<D1PublicSearchRouteRow[]> {
  const result =
    await db
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
        LIMIT 200`
      )
      .all<D1PublicSearchRouteRow>()

  const normalizedFrom =
    normalizePublicSearchTextD1(
      fromPort
    )

  const normalizedTo =
    normalizePublicSearchTextD1(
      toPort
    )

  return result.results.filter(
    (route) =>
      route.isActive === 1 &&
      normalizePublicSearchTextD1(
        route.fromPort
      ) === normalizedFrom &&
      normalizePublicSearchTextD1(
        route.toPort
      ) === normalizedTo
  )
}

async function listRouteInventoryD1(
  db: D1Database,
  routeId: string,
  travelDate: string
): Promise<D1PublicSearchJoinedRow[]> {
  const result =
    await db
      .prepare(
        `SELECT
          i.id AS inventoryId,
          i.inventoryCode AS inventoryCode,

          i.scheduleId AS scheduleId,
          i.operatorId AS operatorId,
          i.vesselId AS vesselId,
          i.routeId AS routeId,

          i.travelDate AS travelDate,
          i.departureTime AS departureTime,
          i.arrivalTime AS arrivalTime,
          i.arrivalDayOffset AS arrivalDayOffset,

          i.seatCapacity AS seatCapacity,
          i.bookedSeats AS bookedSeats,
          i.heldSeats AS heldSeats,

          i.adultPrice AS adultPrice,
          i.childPrice AS childPrice,
          i.infantPrice AS infantPrice,
          i.currency AS currency,

          s.id AS scheduleRowId,
          s.scheduleCode AS scheduleCode,

          s.operatorId AS scheduleOperatorId,
          s.vesselId AS scheduleVesselId,
          s.routeId AS scheduleRouteId,

          s.isActive AS scheduleIsActive,

          o.id AS operatorRowId,
          o.operatorCode AS operatorCode,
          o.operatorName AS operatorName,
          o.isActive AS operatorIsActive,

          v.id AS vesselRowId,
          v.vesselCode AS vesselCode,
          v.vesselName AS vesselName,
          v.isActive AS vesselIsActive,

          r.id AS routeRowId,
          r.routeCode AS routeCode,
          r.fromPort AS fromPort,
          r.toPort AS toPort,
          r.fromIsland AS fromIsland,
          r.toIsland AS toIsland,
          r.isActive AS routeIsActive

        FROM trip_inventory AS i

        LEFT JOIN trip_schedules AS s
          ON s.id = i.scheduleId

        LEFT JOIN operators AS o
          ON o.id = i.operatorId

        LEFT JOIN vessels AS v
          ON v.id = i.vesselId

        LEFT JOIN routes AS r
          ON r.id = i.routeId

        WHERE
          i.routeId = ?
          AND i.travelDate = ?
          AND i.salesStatus = 'OPEN'
          AND i.isActive = 1

        LIMIT 100`
      )
      .bind(
        routeId,
        travelDate
      )
      .all<D1PublicSearchJoinedRow>()

  return result.results
}

function toPublicTripD1(
  row: D1PublicSearchJoinedRow,
  passengers: number
): PublicTripD1 | null {
  if (
    !row.scheduleRowId ||
    !row.operatorRowId ||
    !row.vesselRowId ||
    !row.routeRowId
  ) {
    return null
  }

  if (
    String(
      row.scheduleOperatorId ?? ""
    ) !==
      String(
        row.operatorId ?? ""
      ) ||
    String(
      row.scheduleVesselId ?? ""
    ) !==
      String(
        row.vesselId ?? ""
      ) ||
    String(
      row.scheduleRouteId ?? ""
    ) !==
      String(
        row.routeId ?? ""
      )
  ) {
    return null
  }

  if (
    !isTrueD1(
      row.scheduleIsActive
    ) ||
    !isTrueD1(
      row.operatorIsActive
    ) ||
    !isTrueD1(
      row.vesselIsActive
    ) ||
    !isTrueD1(
      row.routeIsActive
    )
  ) {
    return null
  }

  const seatCapacity =
    Number(row.seatCapacity)

  const bookedSeats =
    Number(row.bookedSeats)

  const heldSeats =
    Number(row.heldSeats)

  if (
    !Number.isInteger(
      seatCapacity
    ) ||
    !Number.isInteger(
      bookedSeats
    ) ||
    !Number.isInteger(
      heldSeats
    )
  ) {
    return null
  }

  const availableSeats =
    seatCapacity -
    bookedSeats -
    heldSeats

  if (
    availableSeats <
    passengers
  ) {
    return null
  }

  return {
    tripInventoryId:
      String(
        row.inventoryId ?? ""
      ),

    inventoryCode:
      String(
        row.inventoryCode ?? ""
      ),

    scheduleId:
      String(
        row.scheduleId ?? ""
      ),

    scheduleCode:
      String(
        row.scheduleCode ?? ""
      ),

    operatorId:
      String(
        row.operatorId ?? ""
      ),

    operatorCode:
      String(
        row.operatorCode ?? ""
      ),

    operatorName:
      String(
        row.operatorName ?? ""
      ),

    vesselId:
      String(
        row.vesselId ?? ""
      ),

    vesselCode:
      String(
        row.vesselCode ?? ""
      ),

    vesselName:
      String(
        row.vesselName ?? ""
      ),

    routeId:
      String(
        row.routeId ?? ""
      ),

    routeCode:
      String(
        row.routeCode ?? ""
      ),

    fromPort:
      String(
        row.fromPort ?? ""
      ),

    toPort:
      String(
        row.toPort ?? ""
      ),

    fromIsland:
      optionalTextD1(
        row.fromIsland
      ),

    toIsland:
      optionalTextD1(
        row.toIsland
      ),

    travelDate:
      String(
        row.travelDate ?? ""
      ),

    departureTime:
      String(
        row.departureTime ?? ""
      ),

    arrivalTime:
      String(
        row.arrivalTime ?? ""
      ),

    arrivalDayOffset:
      Number(
        row.arrivalDayOffset ?? 0
      ),

    availableSeats,

    adultPrice:
      Number(
        row.adultPrice ?? 0
      ),

    childPrice:
      Number(
        row.childPrice ?? 0
      ),

    infantPrice:
      Number(
        row.infantPrice ?? 0
      ),

    currency:
      String(
        row.currency ?? "IDR"
      ),
  }
}

export async function searchPublicTripsD1({
  fromPort,
  toPort,
  travelDate,
  passengers,
}: SearchPublicTripsD1Input): Promise<
  PublicTripD1[]
> {
  const db = getD1()

  const matchedRoutes =
    await listMatchedRoutesD1(
      db,
      fromPort,
      toPort
    )

  if (
    matchedRoutes.length === 0
  ) {
    return []
  }

  const joinedRows:
    D1PublicSearchJoinedRow[] = []

  /*
   * Preserve the legacy Appwrite
   * Query.limit(100) behavior PER
   * matched route.
   */
  for (
    const route of matchedRoutes
  ) {
    const routeInventory =
      await listRouteInventoryD1(
        db,
        route.id,
        travelDate
      )

    joinedRows.push(
      ...routeInventory
    )
  }

  const trips =
    joinedRows.flatMap(
      (row): PublicTripD1[] => {
        const trip =
          toPublicTripD1(
            row,
            passengers
          )

        return trip
          ? [trip]
          : []
      }
    )

  return sortPublicTripsD1(
    trips
  )
}
