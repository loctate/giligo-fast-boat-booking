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

type UpdateTripInventoryRequest = {
  scheduleId?: string
  travelDate?: string

  seatCapacity?: number | string

  adultPrice?: number | string
  childPrice?: number | string
  infantPrice?: number | string

  currency?: string
  salesStatus?: string
  isActive?: boolean
  notes?: string | null
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
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
    value ?? ""
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
    value ?? ""
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
          error:
            "Unauthorized. Please sign in as admin.",
        },
        {
          status: 401,
        }
      )
    }

    const { id } = await context.params

    const inventoryId = String(
      id ?? ""
    ).trim()

    if (!inventoryId) {
      return Response.json(
        {
          success: false,
          error:
            "Trip inventory ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    const existingInventory =
      await getRowOrNull(
        appwriteConfig
          .tripInventoryTableId,
        inventoryId
      )

    if (!existingInventory) {
      return Response.json(
        {
          success: false,
          error:
            "Trip inventory could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    const body =
      (await request.json()) as UpdateTripInventoryRequest

    let effectiveScheduleId = String(
      existingInventory.scheduleId ?? ""
    ).trim()

    let effectiveTravelDate = String(
      existingInventory.travelDate ?? ""
    ).trim()

    let effectiveSeatCapacity = Number(
      existingInventory.seatCapacity ?? 0
    )

    let effectiveAdultPrice = Number(
      existingInventory.adultPrice ?? 0
    )

    let effectiveChildPrice = Number(
      existingInventory.childPrice ?? 0
    )

    let effectiveInfantPrice = Number(
      existingInventory.infantPrice ?? 0
    )

    let effectiveCurrency = String(
      existingInventory.currency ?? "IDR"
    )
      .trim()
      .toUpperCase()

    let effectiveSalesStatus = String(
      existingInventory.salesStatus ??
        "CLOSED"
    )
      .trim()
      .toUpperCase()

    let effectiveIsActive =
      existingInventory.isActive === true

    let effectiveNotes = optionalText(
      existingInventory.notes
    )

    const bookedSeats = Number(
      existingInventory.bookedSeats ?? 0
    )

    const heldSeats = Number(
      existingInventory.heldSeats ?? 0
    )

    if (
      !Number.isInteger(bookedSeats) ||
      bookedSeats < 0 ||
      !Number.isInteger(heldSeats) ||
      heldSeats < 0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Existing booked or held seat data is invalid.",
        },
        {
          status: 400,
        }
      )
    }

    if (body.scheduleId !== undefined) {
      const scheduleId = String(
        body.scheduleId
      ).trim()

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

      effectiveScheduleId = scheduleId
    }

    if (body.travelDate !== undefined) {
      const travelDate = normalizeDate(
        body.travelDate
      )

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

      effectiveTravelDate = travelDate
    }

    if (
      body.seatCapacity !== undefined
    ) {
      const seatCapacity = toInteger(
        body.seatCapacity
      )

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

      effectiveSeatCapacity =
        seatCapacity
    }

    if (body.adultPrice !== undefined) {
      const adultPrice = toInteger(
        body.adultPrice
      )

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

      effectiveAdultPrice = adultPrice
    }

    if (body.childPrice !== undefined) {
      const childPrice = toInteger(
        body.childPrice
      )

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

      effectiveChildPrice = childPrice
    }

    if (body.infantPrice !== undefined) {
      const infantPrice = toInteger(
        body.infantPrice
      )

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

      effectiveInfantPrice = infantPrice
    }

    if (body.currency !== undefined) {
      const currency = normalizeCurrency(
        body.currency
      )

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

      effectiveCurrency = currency
    }

    if (
      body.salesStatus !== undefined
    ) {
      const salesStatus =
        normalizeSalesStatus(
          body.salesStatus
        )

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
              "SOLD_OUT is managed automatically. Use OPEN, CLOSED, or CANCELLED.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveSalesStatus = salesStatus
    }

    if (
      typeof body.isActive === "boolean"
    ) {
      effectiveIsActive = body.isActive
    }

    if (body.notes !== undefined) {
      const notes = optionalText(
        body.notes
      )

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

      effectiveNotes = notes
    }

    if (
      bookedSeats + heldSeats >
      effectiveSeatCapacity
    ) {
      return Response.json(
        {
          success: false,
          error:
            `Seat capacity cannot be lower than the ${bookedSeats + heldSeats} seats currently booked or held.`,
        },
        {
          status: 400,
        }
      )
    }

    const schedule = await getRowOrNull(
      appwriteConfig
        .tripSchedulesTableId,
      effectiveScheduleId
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

    const vesselActiveCapacity = Number(
      vessel.activeCapacity ?? 0
    )

    if (
      !Number.isInteger(
        vesselActiveCapacity
      ) ||
      vesselActiveCapacity < 0
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
      effectiveSeatCapacity >
      vesselActiveCapacity
    ) {
      return Response.json(
        {
          success: false,
          error:
            `Seat capacity cannot exceed the vessel allocation of ${vesselActiveCapacity} seats.`,
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
      getWeekdayCode(
        effectiveTravelDate
      )

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

    const availableSeats =
      effectiveSeatCapacity -
      bookedSeats -
      heldSeats

    if (
      effectiveSalesStatus ===
        "SOLD_OUT" &&
      availableSeats > 0
    ) {
      effectiveSalesStatus = "OPEN"
    }

    if (
      effectiveSalesStatus === "OPEN" &&
      availableSeats <= 0
    ) {
      effectiveSalesStatus =
        "SOLD_OUT"
    }

    if (
      effectiveIsActive &&
      effectiveSalesStatus === "OPEN"
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

      if (effectiveSeatCapacity < 1) {
        return Response.json(
          {
            success: false,
            error:
              "Open inventory must have at least one seat.",
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
      `${scheduleCode}-${effectiveTravelDate.replaceAll("-", "")}`

    const updatedInventory =
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        rowId: inventoryId,

        data: {
          inventoryCode,

          scheduleId:
            effectiveScheduleId,

          operatorId,
          vesselId,
          routeId,

          travelDate:
            effectiveTravelDate,

          departureTime: String(
            schedule.departureTime ?? ""
          ),

          arrivalTime: String(
            schedule.arrivalTime ?? ""
          ),

          arrivalDayOffset: Number(
            schedule.arrivalDayOffset ?? 0
          ),

          seatCapacity:
            effectiveSeatCapacity,

          adultPrice:
            effectiveAdultPrice,

          childPrice:
            effectiveChildPrice,

          infantPrice:
            effectiveInfantPrice,

          currency:
            effectiveCurrency,

          salesStatus:
            effectiveSalesStatus,

          isActive:
            effectiveIsActive,

          notes:
            effectiveNotes,

          updatedBy:
            admin.email,
        },
      })

    return Response.json({
      success: true,

      inventory: toPlainTripInventory(
        updatedInventory as unknown as RelatedRow,
        schedule,
        operator,
        vessel,
        route
      ),
    })
  } catch (error) {
    console.error(
      "Trip inventory update error:",
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

    if (getErrorCode(error) === 404) {
      return Response.json(
        {
          success: false,
          error:
            "Trip inventory could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip inventory could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}