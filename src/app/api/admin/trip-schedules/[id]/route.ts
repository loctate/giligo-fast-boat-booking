import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OPERATING_DAYS = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const

type UpdateTripScheduleRequest = {
  scheduleCode?: string
  operatorId?: string
  vesselId?: string
  routeId?: string
  departureTime?: string
  arrivalTime?: string
  arrivalDayOffset?: number | string
  operatingDays?: string
  bookingCutoffMinutes?: number | string
  isActive?: boolean
  notes?: string | null
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type RelatedRow = Record<string, unknown>

type PlainTripSchedule = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  scheduleCode: string
  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  operatingDays: string
  bookingCutoffMinutes: number

  isActive: boolean
  notes: string | null
  createdBy: string | null
  updatedBy: string | null

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

function normalizeTime(
  value: unknown
): string | null {
  const normalizedValue = String(
    value ?? ""
  ).trim()

  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
      normalizedValue
    )
  ) {
    return null
  }

  return normalizedValue
}

function timeToMinutes(
  time: string
): number {
  const [hours, minutes] = time
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function normalizeOperatingDays(
  value: unknown
): string | null {
  const suppliedDays = String(value ?? "")
    .split(",")
    .map((day) =>
      day.trim().toUpperCase()
    )
    .filter(Boolean)

  if (suppliedDays.length === 0) {
    return null
  }

  const allowedDays = new Set<string>(
    OPERATING_DAYS
  )

  if (
    suppliedDays.some(
      (day) => !allowedDays.has(day)
    )
  ) {
    return null
  }

  const uniqueDays = new Set(
    suppliedDays
  )

  return OPERATING_DAYS.filter((day) =>
    uniqueDays.has(day)
  ).join(",")
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

function toPlainTripSchedule(
  row: RelatedRow,
  operator?: RelatedRow,
  vessel?: RelatedRow,
  route?: RelatedRow
): PlainTripSchedule {
  return {
    $id: String(row.$id ?? ""),

    $createdAt: String(
      row.$createdAt ?? ""
    ),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    scheduleCode: String(
      row.scheduleCode ?? ""
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

    departureTime: String(
      row.departureTime ?? ""
    ),

    arrivalTime: String(
      row.arrivalTime ?? ""
    ),

    arrivalDayOffset: Number(
      row.arrivalDayOffset ?? 0
    ),

    operatingDays: String(
      row.operatingDays ?? ""
    ),

    bookingCutoffMinutes: Number(
      row.bookingCutoffMinutes ?? 0
    ),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,

    notes: optionalText(row.notes),
    createdBy: optionalText(
      row.createdBy
    ),
    updatedBy: optionalText(
      row.updatedBy
    ),

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
      ? optionalText(vessel.vesselCode)
      : null,

    vesselName: vessel
      ? optionalText(vessel.vesselName)
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
    const scheduleId = String(
      id ?? ""
    ).trim()

    if (!scheduleId) {
      return Response.json(
        {
          success: false,
          error:
            "Trip schedule ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    const existingSchedule =
      await getRowOrNull(
        appwriteConfig
          .tripSchedulesTableId,
        scheduleId
      )

    if (!existingSchedule) {
      return Response.json(
        {
          success: false,
          error:
            "Trip schedule could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    const body =
      (await request.json()) as UpdateTripScheduleRequest

    const data: Record<
      string,
      unknown
    > = {
      updatedBy: admin.email,
    }

    let effectiveScheduleCode =
      String(
        existingSchedule.scheduleCode ??
          ""
      ).trim()

    let effectiveOperatorId = String(
      existingSchedule.operatorId ?? ""
    ).trim()

    let effectiveVesselId = String(
      existingSchedule.vesselId ?? ""
    ).trim()

    let effectiveRouteId = String(
      existingSchedule.routeId ?? ""
    ).trim()

    let effectiveDepartureTime =
      String(
        existingSchedule.departureTime ??
          ""
      ).trim()

    let effectiveArrivalTime = String(
      existingSchedule.arrivalTime ?? ""
    ).trim()

    let effectiveArrivalDayOffset =
      Number(
        existingSchedule
          .arrivalDayOffset ?? 0
      )

    let effectiveOperatingDays =
      String(
        existingSchedule.operatingDays ??
          ""
      ).trim()

    let effectiveBookingCutoffMinutes =
      Number(
        existingSchedule
          .bookingCutoffMinutes ?? 0
      )

    let effectiveIsActive =
      existingSchedule.isActive === true

    if (
      body.scheduleCode !== undefined
    ) {
      const scheduleCode = String(
        body.scheduleCode
      )
        .trim()
        .toUpperCase()

      if (!scheduleCode) {
        return Response.json(
          {
            success: false,
            error:
              "Schedule code is required.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(
          scheduleCode
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Schedule code must contain 2–50 uppercase letters, numbers, underscores, or hyphens.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveScheduleCode =
        scheduleCode

      data.scheduleCode = scheduleCode
    }

    if (body.operatorId !== undefined) {
      const operatorId = String(
        body.operatorId
      ).trim()

      if (!operatorId) {
        return Response.json(
          {
            success: false,
            error:
              "Operator is required.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveOperatorId = operatorId
      data.operatorId = operatorId
    }

    if (body.vesselId !== undefined) {
      const vesselId = String(
        body.vesselId
      ).trim()

      if (!vesselId) {
        return Response.json(
          {
            success: false,
            error:
              "Vessel is required.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveVesselId = vesselId
      data.vesselId = vesselId
    }

    if (body.routeId !== undefined) {
      const routeId = String(
        body.routeId
      ).trim()

      if (!routeId) {
        return Response.json(
          {
            success: false,
            error:
              "Route is required.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveRouteId = routeId
      data.routeId = routeId
    }

    if (
      body.departureTime !== undefined
    ) {
      const departureTime =
        normalizeTime(
          body.departureTime
        )

      if (!departureTime) {
        return Response.json(
          {
            success: false,
            error:
              "Departure time must use the HH:mm 24-hour format.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveDepartureTime =
        departureTime

      data.departureTime =
        departureTime
    }

    if (
      body.arrivalTime !== undefined
    ) {
      const arrivalTime =
        normalizeTime(
          body.arrivalTime
        )

      if (!arrivalTime) {
        return Response.json(
          {
            success: false,
            error:
              "Arrival time must use the HH:mm 24-hour format.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveArrivalTime =
        arrivalTime

      data.arrivalTime = arrivalTime
    }

    if (
      body.arrivalDayOffset !==
      undefined
    ) {
      const arrivalDayOffset =
        toInteger(
          body.arrivalDayOffset
        )

      if (
        arrivalDayOffset === null ||
        arrivalDayOffset < 0 ||
        arrivalDayOffset > 2
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Arrival day offset must be an integer between 0 and 2.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveArrivalDayOffset =
        arrivalDayOffset

      data.arrivalDayOffset =
        arrivalDayOffset
    }

    const departureMinutes =
      timeToMinutes(
        effectiveDepartureTime
      )

    const absoluteArrivalMinutes =
      timeToMinutes(
        effectiveArrivalTime
      ) +
      effectiveArrivalDayOffset * 1440

    if (
      absoluteArrivalMinutes <=
      departureMinutes
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Arrival must occur after departure. Use arrival day offset when the trip crosses midnight.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      body.operatingDays !== undefined
    ) {
      const operatingDays =
        normalizeOperatingDays(
          body.operatingDays
        )

      if (!operatingDays) {
        return Response.json(
          {
            success: false,
            error:
              "Operating days must contain valid values such as MON,TUE,WED.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveOperatingDays =
        operatingDays

      data.operatingDays =
        operatingDays
    }

    if (
      body.bookingCutoffMinutes !==
      undefined
    ) {
      const bookingCutoffMinutes =
        toInteger(
          body.bookingCutoffMinutes
        )

      if (
        bookingCutoffMinutes === null ||
        bookingCutoffMinutes < 0 ||
        bookingCutoffMinutes > 10080
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Booking cutoff must be an integer between 0 and 10080 minutes.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveBookingCutoffMinutes =
        bookingCutoffMinutes

      data.bookingCutoffMinutes =
        bookingCutoffMinutes
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

      data.notes = notes
    }

    if (
      typeof body.isActive ===
      "boolean"
    ) {
      effectiveIsActive =
        body.isActive

      data.isActive = body.isActive
    }

    const [
      operator,
      vessel,
      route,
    ] = await Promise.all([
      getRowOrNull(
        appwriteConfig.operatorsTableId,
        effectiveOperatorId
      ),

      getRowOrNull(
        appwriteConfig.vesselsTableId,
        effectiveVesselId
      ),

      getRowOrNull(
        appwriteConfig.routesTableId,
        effectiveRouteId
      ),
    ])

    if (!operator) {
      return Response.json(
        {
          success: false,
          error:
            "Selected operator could not be found.",
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
            "Selected vessel could not be found.",
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
            "Selected route could not be found.",
        },
        {
          status: 404,
        }
      )
    }

    const vesselOperatorId = String(
      vessel.operatorId ?? ""
    )

    if (
      vesselOperatorId !==
      effectiveOperatorId
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Selected vessel does not belong to the selected operator.",
        },
        {
          status: 400,
        }
      )
    }

    if (effectiveIsActive) {
      if (operator.isActive !== true) {
        return Response.json(
          {
            success: false,
            error:
              "An active schedule requires an active operator.",
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
              "An active schedule requires an active vessel.",
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
              "An active schedule requires an active route.",
          },
          {
            status: 400,
          }
        )
      }
    }

    const updatedSchedule =
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripSchedulesTableId,

        rowId: scheduleId,
        data,
      })

    void effectiveScheduleCode
    void effectiveOperatingDays
    void effectiveBookingCutoffMinutes

    return Response.json({
      success: true,

      schedule: toPlainTripSchedule(
        updatedSchedule as unknown as RelatedRow,
        operator,
        vessel,
        route
      ),
    })
  } catch (error) {
    console.error(
      "Trip schedule update error:",
      error
    )

    if (getErrorCode(error) === 409) {
      return Response.json(
        {
          success: false,
          error:
            "Schedule code already exists. Please use another code.",
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
            "Trip schedule could not be found.",
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
            : "Trip schedule could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}