import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  createTripScheduleD1,
  listTripSchedulesD1,
  TripScheduleActiveOperatorRequiredError,
  TripScheduleActiveRouteRequiredError,
  TripScheduleActiveVesselRequiredError,
  TripScheduleOperatorNotFoundError,
  TripScheduleRouteNotFoundError,
  TripScheduleVesselNotFoundError,
  TripScheduleVesselOperatorMismatchError,
} from "@/lib/d1-trip-schedules"

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

function optionalText(
  value: unknown
): string | null {
  const normalizedValue = String(
    value ?? ""
  ).trim()

  return normalizedValue || null
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

    const {
      schedules,
      total,
    } = await listTripSchedulesD1()

    return Response.json({
      success: true,
      schedules,
      total,
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

    const createdSchedule =
      await createTripScheduleD1({
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
      })

    return Response.json(
      {
        success: true,
        schedule: createdSchedule,
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

    if (
      error instanceof
        TripScheduleOperatorNotFoundError ||
      error instanceof
        TripScheduleVesselNotFoundError ||
      error instanceof
        TripScheduleRouteNotFoundError
    ) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 404,
        }
      )
    }

    if (
      error instanceof
        TripScheduleVesselOperatorMismatchError ||
      error instanceof
        TripScheduleActiveOperatorRequiredError ||
      error instanceof
        TripScheduleActiveVesselRequiredError ||
      error instanceof
        TripScheduleActiveRouteRequiredError
    ) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 400,
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
