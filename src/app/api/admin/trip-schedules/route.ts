import { ID, Query } from "node-appwrite"

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

type CreateTripScheduleRequest = {
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
  notes?: string
}

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

type RelatedRow = Record<string, unknown>

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
    .map((day) => day.trim().toUpperCase())
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

  const uniqueDays = new Set(suppliedDays)

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
      databaseId: appwriteConfig.databaseId,
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

    routeId: String(row.routeId ?? ""),

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
    createdBy: optionalText(row.createdBy),
    updatedBy: optionalText(row.updatedBy),

    operatorCode: operator
      ? optionalText(operator.operatorCode)
      : null,

    operatorName: operator
      ? optionalText(operator.operatorName)
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

function sortTripSchedules(
  schedules: PlainTripSchedule[]
): PlainTripSchedule[] {
  return [...schedules].sort(
    (firstSchedule, secondSchedule) => {
      const routeComparison = String(
        firstSchedule.routeCode ?? ""
      ).localeCompare(
        String(
          secondSchedule.routeCode ?? ""
        ),
        "en",
        {
          sensitivity: "base",
        }
      )

      if (routeComparison !== 0) {
        return routeComparison
      }

      return firstSchedule.departureTime.localeCompare(
        secondSchedule.departureTime
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

    for (const route of routesResponse.rows) {
      const plainRoute =
        route as unknown as RelatedRow

      routesById.set(
        String(plainRoute.$id ?? ""),
        plainRoute
      )
    }

    const schedules = sortTripSchedules(
      schedulesResponse.rows.map(
        (schedule) => {
          const plainSchedule =
            schedule as unknown as RelatedRow

          const operatorId = String(
            plainSchedule.operatorId ?? ""
          )

          const vesselId = String(
            plainSchedule.vesselId ?? ""
          )

          const routeId = String(
            plainSchedule.routeId ?? ""
          )

          return toPlainTripSchedule(
            plainSchedule,
            operatorsById.get(operatorId),
            vesselsById.get(vesselId),
            routesById.get(routeId)
          )
        }
      )
    )

    return Response.json({
      success: true,
      schedules,
      total: schedulesResponse.total,
    })
  } catch (error) {
    console.error(
      "Trip schedule list error:",
      error
    )

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip schedules could not be loaded.",
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
      (await request.json()) as CreateTripScheduleRequest

    const scheduleCode = String(
      body.scheduleCode ?? ""
    )
      .trim()
      .toUpperCase()

    const operatorId = String(
      body.operatorId ?? ""
    ).trim()

    const vesselId = String(
      body.vesselId ?? ""
    ).trim()

    const routeId = String(
      body.routeId ?? ""
    ).trim()

    const departureTime = normalizeTime(
      body.departureTime
    )

    const arrivalTime = normalizeTime(
      body.arrivalTime
    )

    const arrivalDayOffset = toInteger(
      body.arrivalDayOffset
    )

    const operatingDays =
      normalizeOperatingDays(
        body.operatingDays
      )

    const bookingCutoffMinutes =
      toInteger(
        body.bookingCutoffMinutes
      )

    const notes = optionalText(body.notes)

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true

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

    if (!operatorId) {
      return Response.json(
        {
          success: false,
          error: "Operator is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!vesselId) {
      return Response.json(
        {
          success: false,
          error: "Vessel is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!routeId) {
      return Response.json(
        {
          success: false,
          error: "Route is required.",
        },
        {
          status: 400,
        }
      )
    }

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

    const departureMinutes =
      timeToMinutes(departureTime)

    const absoluteArrivalMinutes =
      timeToMinutes(arrivalTime) +
      arrivalDayOffset * 1440

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
      vesselOperatorId !== operatorId
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

    if (isActive) {
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

    const createdSchedule =
      await tablesDB.createRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripSchedulesTableId,

        rowId: ID.unique(),

        data: {
          scheduleCode,
          operatorId,
          vesselId,
          routeId,
          departureTime,
          arrivalTime,
          arrivalDayOffset,
          operatingDays,
          bookingCutoffMinutes,
          isActive,
          notes,
          createdBy: admin.email,
          updatedBy: admin.email,
        },
      })

    return Response.json(
      {
        success: true,

        schedule: toPlainTripSchedule(
          createdSchedule as unknown as RelatedRow,
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
      "Trip schedule creation error:",
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

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip schedule could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}
