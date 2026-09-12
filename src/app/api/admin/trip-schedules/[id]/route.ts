import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  getTripScheduleByIdD1,
  TripScheduleActiveOperatorRequiredError,
  TripScheduleActiveRouteRequiredError,
  TripScheduleActiveVesselRequiredError,
  TripScheduleNotFoundError,
  TripScheduleOperatorNotFoundError,
  TripScheduleRouteNotFoundError,
  TripScheduleVesselNotFoundError,
  TripScheduleVesselOperatorMismatchError,
  type UpdateTripScheduleD1Input,
  updateTripScheduleD1,
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
    .map(
      (day) =>
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

  return OPERATING_DAYS.filter(
    (day) => uniqueDays.has(day)
  ).join(",")
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
      await getTripScheduleByIdD1(
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

    const data: Omit<
      UpdateTripScheduleD1Input,
      "id" | "updatedBy"
    > = {}

    let effectiveDepartureTime =
      existingSchedule.departureTime

    let effectiveArrivalTime =
      existingSchedule.arrivalTime

    let effectiveArrivalDayOffset =
      existingSchedule.arrivalDayOffset

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

      data.scheduleCode =
        scheduleCode
    }

    if (
      body.operatorId !== undefined
    ) {
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

      data.operatorId = operatorId
    }

    if (
      body.vesselId !== undefined
    ) {
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

      data.vesselId = vesselId
    }

    if (
      body.routeId !== undefined
    ) {
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

      data.arrivalTime =
        arrivalTime
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

      data.bookingCutoffMinutes =
        bookingCutoffMinutes
    }

    if (body.notes !== undefined) {
      const notes =
        optionalText(body.notes)

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
      data.isActive =
        body.isActive
    }

    const updatedSchedule =
      await updateTripScheduleD1({
        id: scheduleId,
        ...data,
        updatedBy: admin.email,
      })

    return Response.json({
      success: true,
      schedule: updatedSchedule,
    })
  } catch (error) {
    console.error(
      "Trip schedule update error:",
      error
    )

    if (
      error instanceof
        TripScheduleNotFoundError ||
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
            : "Trip schedule could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}
