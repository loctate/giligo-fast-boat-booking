import { ID, Query } from "node-appwrite"

import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SALES_STATUSES = [
  "OPEN",
  "CLOSED",
  "CANCELLED",
  "SOLD_OUT",
] as const

const WEEKDAY_CODES = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const

type CreateTripInventoryRequest = {
  scheduleId?: string
  travelDate?: string
  seatCapacity?: number | string
  adultPrice?: number | string
  childPrice?: number | string
  infantPrice?: number | string
  currency?: string
  salesStatus?: string
  isActive?: boolean
  notes?: string
}

type RelatedRow = Record<string, unknown>

type PlainTripInventory = {
  $id: string
  $createdAt: string
  $updatedAt?: string

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
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string

  salesStatus: string
  isActive: boolean
  notes: string | null
  createdBy: string | null
  updatedBy: string | null

  scheduleCode: string | null
  operatorCode: string | null
  operatorName: string | null
  vesselCode: string | null
  vesselName: string | null
  routeCode: string | null
  fromPort: string | null
  toPort: string | null
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

function normalizeDate(
  value: unknown
): string | null {
  const normalizedValue = String(
    value ?? ""
  ).trim()

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalizedValue
    )

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day)
  )

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !==
      month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null
  }

  return normalizedValue
}

function getWeekdayCode(
  travelDate: string
): string {
  const [year, month, day] =
    travelDate.split("-").map(Number)

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day)
  )

  return WEEKDAY_CODES[
    parsedDate.getUTCDay()
  ]
}

function normalizeCurrency(
  value: unknown
): string | null {
  const currency = String(
    value ?? "IDR"
  )
    .trim()
    .toUpperCase()

  return /^[A-Z]{3}$/.test(currency)
    ? currency
    : null
}

function normalizeSalesStatus(
  value: unknown
): string | null {
  const salesStatus = String(
    value ?? "OPEN"
  )
    .trim()
    .toUpperCase()

  return SALES_STATUSES.includes(
    salesStatus as
      (typeof SALES_STATUSES)[number]
  )
    ? salesStatus
    : null
}

async function getRowOrNull(
  tableId: string,
  rowId: string
): Promise<RelatedRow | null> {
  try {
    const row = await tablesDB.getRow({
      databaseId:
        appwriteConfig.databaseId,
      tableId,
      rowId,
    })

    return row as unknown as RelatedRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      return null
    }

    throw error
  }
}

function toPlainTripInventory(
  row: RelatedRow,
  schedule?: RelatedRow,
  operator?: RelatedRow,
  vessel?: RelatedRow,
  route?: RelatedRow
): PlainTripInventory {
  const seatCapacity = Number(
    row.seatCapacity ?? 0
  )

  const bookedSeats = Number(
    row.bookedSeats ?? 0
  )

  const heldSeats = Number(
    row.heldSeats ?? 0
  )

  return {
    $id: String(row.$id ?? ""),

    $createdAt: String(
      row.$createdAt ?? ""
    ),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    inventoryCode: String(
      row.inventoryCode ?? ""
    ),

    scheduleId: String(
      row.scheduleId ?? ""
    ),

    operatorId: String(
      row.operatorId ?? ""
    ),

    vesselId: String(
      row.vesselId ?? ""
    ),

    routeId: String(
      row.routeId ?? ""
    ),

    travelDate: String(
      row.travelDate ?? ""
    ),

    departureTime: String(
      row.departureTime ?? ""
    ),

    arrivalTime: String(
      row.arrivalTime ?? ""
    ),

    arrivalDayOffset: Number(
      row.arrivalDayOffset ?? 0
    ),

    seatCapacity,
    bookedSeats,
    heldSeats,

    availableSeats: Math.max(
      0,
      seatCapacity -
        bookedSeats -
        heldSeats
    ),

    adultPrice: Number(
      row.adultPrice ?? 0
    ),

    childPrice: Number(
      row.childPrice ?? 0
    ),

    infantPrice: Number(
      row.infantPrice ?? 0
    ),

    currency: String(
      row.currency ?? "IDR"
    ),

    salesStatus: String(
      row.salesStatus ?? "CLOSED"
    ),

    isActive:
      row.isActive === true,

    notes: optionalText(row.notes),

    createdBy: optionalText(
      row.createdBy
    ),

    updatedBy: optionalText(
      row.updatedBy
    ),

    scheduleCode: schedule
      ? optionalText(
          schedule.scheduleCode
        )
      : null,

    operatorCode: operator
      ? optionalText(
          operator.operatorCode
        )
      : null,

    operatorName: operator
      ? optionalText(
          operator.operatorName
        )
      : null,

    vesselCode: vessel
      ? optionalText(
          vessel.vesselCode
        )
      : null,

    vesselName: vessel
      ? optionalText(
          vessel.vesselName
        )
      : null,

    routeCode: route
      ? optionalText(route.routeCode)
      : null,

    fromPort: route
      ? optionalText(route.fromPort)
      : null,

    toPort: route
      ? optionalText(route.toPort)
      : null,
  }
}

function sortTripInventory(
  inventory: PlainTripInventory[]
): PlainTripInventory[] {
  return [...inventory].sort(
    (firstItem, secondItem) => {
      const dateComparison =
        firstItem.travelDate.localeCompare(
          secondItem.travelDate
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return firstItem.departureTime.localeCompare(
        secondItem.departureTime
      )
    }
  )
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return Response.json(
        {
          success: false,
          error:
            "Unauthorized. Please sign in as admin.",
        },
        {
          status: 401,
        }
      )
    }

    const [
      inventoryResponse,
      schedulesResponse,
      operatorsResponse,
      vesselsResponse,
      routesResponse,
    ] = await Promise.all([
      tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        queries: [Query.limit(200)],
      }),

      tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripSchedulesTableId,

        queries: [Query.limit(200)],
      }),

      tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.operatorsTableId,

        queries: [Query.limit(200)],
      }),

      tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.vesselsTableId,

        queries: [Query.limit(200)],
      }),

      tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.routesTableId,

        queries: [Query.limit(200)],
      }),
    ])

    const schedulesById = new Map<
      string,
      RelatedRow
    >()

    for (
      const schedule of
      schedulesResponse.rows
    ) {
      const plainSchedule =
        schedule as unknown as RelatedRow

      schedulesById.set(
        String(plainSchedule.$id ?? ""),
        plainSchedule
      )
    }

    const operatorsById = new Map<
      string,
      RelatedRow
    >()

    for (
      const operator of
      operatorsResponse.rows
    ) {
      const plainOperator =
        operator as unknown as RelatedRow

      operatorsById.set(
        String(plainOperator.$id ?? ""),
        plainOperator
      )
    }

    const vesselsById = new Map<
      string,
      RelatedRow
    >()

    for (
      const vessel of vesselsResponse.rows
    ) {
      const plainVessel =
        vessel as unknown as RelatedRow

      vesselsById.set(
        String(plainVessel.$id ?? ""),
        plainVessel
      )
    }

    const routesById = new Map<
      string,
      RelatedRow
    >()

    for (
      const route of routesResponse.rows
    ) {
      const plainRoute =
        route as unknown as RelatedRow

      routesById.set(
        String(plainRoute.$id ?? ""),
        plainRoute
      )
    }

    const inventory =
      sortTripInventory(
        inventoryResponse.rows.map(
          (item) => {
            const plainItem =
              item as unknown as RelatedRow

            const scheduleId = String(
              plainItem.scheduleId ?? ""
            )

            const operatorId = String(
              plainItem.operatorId ?? ""
            )

            const vesselId = String(
              plainItem.vesselId ?? ""
            )

            const routeId = String(
              plainItem.routeId ?? ""
            )

            return toPlainTripInventory(
              plainItem,
              schedulesById.get(scheduleId),
              operatorsById.get(operatorId),
              vesselsById.get(vesselId),
              routesById.get(routeId)
            )
          }
        )
      )

    return Response.json({
      success: true,
      inventory,
      total: inventoryResponse.total,
    })
  } catch (error) {
    console.error(
      "Trip inventory list error:",
      error
    )

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip inventory could not be loaded.",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(
  request: Request
) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return Response.json(
        {
          success: false,
          error:
            "Unauthorized. Please sign in as admin.",
        },
        {
          status: 401,
        }
      )
    }

    const body =
      (await request.json()) as CreateTripInventoryRequest

    const scheduleId = String(
      body.scheduleId ?? ""
    ).trim()

    const travelDate = normalizeDate(
      body.travelDate
    )

    const seatCapacity = toInteger(
      body.seatCapacity
    )

    const adultPrice = toInteger(
      body.adultPrice
    )

    const childPrice =
      body.childPrice === undefined ||
      body.childPrice === ""
        ? 0
        : toInteger(body.childPrice)

    const infantPrice =
      body.infantPrice === undefined ||
      body.infantPrice === ""
        ? 0
        : toInteger(body.infantPrice)

    const currency = normalizeCurrency(
      body.currency
    )

    const salesStatus =
      normalizeSalesStatus(
        body.salesStatus
      )

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true

    const notes = optionalText(body.notes)

    if (!scheduleId) {
      return Response.json(
        {
          success: false,
          error:
            "Trip schedule is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!travelDate) {
      return Response.json(
        {
          success: false,
          error:
            "Travel date must use the valid YYYY-MM-DD format.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      seatCapacity === null ||
      seatCapacity < 0 ||
      seatCapacity > 1000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Seat capacity must be an integer between 0 and 1000.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      adultPrice === null ||
      adultPrice < 0 ||
      adultPrice > 1000000000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Adult price must be an integer between 0 and 1000000000.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      childPrice === null ||
      childPrice < 0 ||
      childPrice > 1000000000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Child price must be an integer between 0 and 1000000000.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      infantPrice === null ||
      infantPrice < 0 ||
      infantPrice > 1000000000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Infant price must be an integer between 0 and 1000000000.",
        },
        {
          status: 400,
        }
      )
    }

    if (!currency) {
      return Response.json(
        {
          success: false,
          error:
            "Currency must contain exactly three letters, such as IDR.",
        },
        {
          status: 400,
        }
      )
    }

    if (!salesStatus) {
      return Response.json(
        {
          success: false,
          error:
            "Sales status must be OPEN, CLOSED, CANCELLED, or SOLD_OUT.",
        },
        {
          status: 400,
        }
      )
    }

    if (salesStatus === "SOLD_OUT") {
      return Response.json(
        {
          success: false,
          error:
            "SOLD_OUT is managed automatically and cannot be selected when creating inventory.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      notes &&
      notes.length > 1000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Notes cannot exceed 1000 characters.",
        },
        {
          status: 400,
        }
      )
    }

    const schedule = await getRowOrNull(
      appwriteConfig
        .tripSchedulesTableId,
      scheduleId
    )

    if (!schedule) {
      return Response.json(
        {
          success: false,
          error:
            "Selected trip schedule could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    const operatorId = String(
      schedule.operatorId ?? ""
    ).trim()

    const vesselId = String(
      schedule.vesselId ?? ""
    ).trim()

    const routeId = String(
      schedule.routeId ?? ""
    ).trim()

    const [
      operator,
      vessel,
      route,
    ] = await Promise.all([
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

    if (!operator) {
      return Response.json(
        {
          success: false,
          error:
            "The schedule operator could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    if (!vessel) {
      return Response.json(
        {
          success: false,
          error:
            "The schedule vessel could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    if (!route) {
      return Response.json(
        {
          success: false,
          error:
            "The schedule route could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    if (
      String(vessel.operatorId ?? "") !==
      operatorId
    ) {
      return Response.json(
        {
          success: false,
          error:
            "The schedule vessel does not belong to its operator.",
        },
        {
          status: 400,
        }
      )
    }

    const activeCapacity = Number(
      vessel.activeCapacity ?? 0
    )

    if (
      !Number.isInteger(activeCapacity) ||
      activeCapacity < 0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "The selected vessel has an invalid active capacity.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      seatCapacity > activeCapacity
    ) {
      return Response.json(
        {
          success: false,
          error:
            `Seat capacity cannot exceed the vessel allocation of ${activeCapacity} seats.`,
        },
        {
          status: 400,
        }
      )
    }

    const operatingDays = String(
      schedule.operatingDays ?? ""
    )
      .split(",")
      .map((day) =>
        day.trim().toUpperCase()
      )
      .filter(Boolean)

    const travelDay =
      getWeekdayCode(travelDate)

    if (
      !operatingDays.includes(travelDay)
    ) {
      return Response.json(
        {
          success: false,
          error:
            `The selected schedule does not operate on ${travelDay}.`,
        },
        {
          status: 400,
        }
      )
    }

    if (
      isActive &&
      salesStatus === "OPEN"
    ) {
      if (schedule.isActive !== true) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory requires an active trip schedule.",
          },
          {
            status: 400,
          }
        )
      }

      if (operator.isActive !== true) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory requires an active operator.",
          },
          {
            status: 400,
          }
        )
      }

      if (vessel.isActive !== true) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory requires an active vessel.",
          },
          {
            status: 400,
          }
        )
      }

      if (route.isActive !== true) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory requires an active route.",
          },
          {
            status: 400,
          }
        )
      }

      if (seatCapacity < 1) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory must have at least one available seat.",
          },
          {
            status: 400,
          }
        )
      }
    }

    const scheduleCode = String(
      schedule.scheduleCode ?? "SCHEDULE"
    )
      .trim()
      .toUpperCase()

    const inventoryCode =
      `${scheduleCode}-${travelDate.replaceAll("-", "")}`

    const createdInventory =
      await tablesDB.createRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        rowId: ID.unique(),

        data: {
          inventoryCode,
          scheduleId,
          operatorId,
          vesselId,
          routeId,
          travelDate,

          departureTime: String(
            schedule.departureTime ?? ""
          ),

          arrivalTime: String(
            schedule.arrivalTime ?? ""
          ),

          arrivalDayOffset: Number(
            schedule.arrivalDayOffset ?? 0
          ),

          seatCapacity,
          bookedSeats: 0,
          heldSeats: 0,

          adultPrice,
          childPrice,
          infantPrice,
          currency,

          salesStatus,
          isActive,
          notes,

          createdBy: admin.email,
          updatedBy: admin.email,
        },
      })

    return Response.json(
      {
        success: true,

        inventory: toPlainTripInventory(
          createdInventory as unknown as RelatedRow,
          schedule,
          operator,
          vessel,
          route
        ),
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      "Trip inventory creation error:",
      error
    )

    if (getErrorCode(error) === 409) {
      return Response.json(
        {
          success: false,
          error:
            "Inventory for this schedule and travel date already exists.",
        },
        {
          status: 409,
        }
      )
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip inventory could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}