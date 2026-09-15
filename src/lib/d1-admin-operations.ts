import {
  getD1,
} from "@/lib/d1-server"

export interface D1AdminDeparture {
  id: string
  inventoryCode: string

  travelDate: string
  departureTime: string
  arrivalTime: string

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  salesStatus: string
  isActive: boolean

  operatorName: string
  vesselName: string

  routeCode: string
  fromPort: string
  toPort: string
}

type DepartureRow = {
  inventoryId?: unknown
  inventoryCode?: unknown

  travelDate?: unknown
  departureTime?: unknown
  arrivalTime?: unknown

  seatCapacity?: unknown
  bookedSeats?: unknown
  heldSeats?: unknown

  salesStatus?: unknown
  inventoryIsActive?: unknown

  operatorName?: unknown
  vesselName?: unknown

  routeCode?: unknown
  fromPort?: unknown
  toPort?: unknown
}

function text(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim()
}

function integer(
  value: unknown
): number {
  const parsed =
    Number(value)

  return Number.isInteger(
    parsed
  )
    ? parsed
    : 0
}

function normalizeDeparture(
  row: DepartureRow
): D1AdminDeparture {
  const seatCapacity =
    integer(
      row.seatCapacity
    )

  const bookedSeats =
    integer(
      row.bookedSeats
    )

  const heldSeats =
    integer(
      row.heldSeats
    )

  return {
    id:
      text(
        row.inventoryId
      ),

    inventoryCode:
      text(
        row.inventoryCode
      ),

    travelDate:
      text(
        row.travelDate
      ),

    departureTime:
      text(
        row.departureTime
      ),

    arrivalTime:
      text(
        row.arrivalTime
      ),

    seatCapacity,
    bookedSeats,
    heldSeats,

    availableSeats:
      Math.max(
        0,
        seatCapacity -
          bookedSeats -
          heldSeats
      ),

    salesStatus:
      text(
        row.salesStatus
      ) || "CLOSED",

    isActive:
      Number(
        row.inventoryIsActive
      ) === 1,

    operatorName:
      text(
        row.operatorName
      ) ||
      "Operator unavailable",

    vesselName:
      text(
        row.vesselName
      ) ||
      "Vessel unavailable",

    routeCode:
      text(
        row.routeCode
      ),

    fromPort:
      text(
        row.fromPort
      ) ||
      "Departure unavailable",

    toPort:
      text(
        row.toPort
      ) ||
      "Destination unavailable",
  }
}

const DEPARTURE_SELECT = `
  SELECT
    i.id AS inventoryId,
    i.inventoryCode AS inventoryCode,

    i.travelDate AS travelDate,
    i.departureTime AS departureTime,
    i.arrivalTime AS arrivalTime,

    i.seatCapacity AS seatCapacity,
    i.bookedSeats AS bookedSeats,
    i.heldSeats AS heldSeats,

    i.salesStatus AS salesStatus,
    i.isActive AS inventoryIsActive,

    o.operatorName AS operatorName,
    v.vesselName AS vesselName,

    r.routeCode AS routeCode,
    r.fromPort AS fromPort,
    r.toPort AS toPort

  FROM trip_inventory AS i

  LEFT JOIN operators AS o
    ON o.id = i.operatorId

  LEFT JOIN vessels AS v
    ON v.id = i.vesselId

  LEFT JOIN routes AS r
    ON r.id = i.routeId
`

export async function
listD1AdminDeparturesByDate(
  travelDate: string
): Promise<D1AdminDeparture[]> {
  const normalizedDate =
    travelDate.trim()

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedDate
    )
  ) {
    return []
  }

  const db =
    getD1()

  const result =
    await db
      .prepare(`
        ${DEPARTURE_SELECT}

        WHERE i.travelDate = ?

        ORDER BY
          i.departureTime ASC,
          i.id ASC

        LIMIT 200
      `)
      .bind(
        normalizedDate
      )
      .all<DepartureRow>()

  return result.results
    .map(
      normalizeDeparture
    )
    .filter(
      (departure) =>
        Boolean(
          departure.id
        )
    )
}

export async function
getD1AdminDepartureById(
  inventoryId: string
): Promise<D1AdminDeparture | null> {
  const normalizedId =
    inventoryId.trim()

  if (!normalizedId) {
    return null
  }

  const db =
    getD1()

  const result =
    await db
      .prepare(`
        ${DEPARTURE_SELECT}

        WHERE i.id = ?

        LIMIT 1
      `)
      .bind(
        normalizedId
      )
      .all<DepartureRow>()

  const row =
    result.results[0]

  return row
    ? normalizeDeparture(
        row
      )
    : null
}
