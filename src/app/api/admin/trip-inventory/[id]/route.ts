import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  TripInventoryExistingSeatDataInvalidError,
  TripInventoryInvalidVesselActiveCapacityError,
  TripInventoryNotFoundError,
  TripInventoryOpenActiveOperatorRequiredError,
  TripInventoryOpenActiveRouteRequiredError,
  TripInventoryOpenActiveScheduleRequiredError,
  TripInventoryOpenActiveVesselRequiredError,
  TripInventoryScheduleDateConflictError,
  TripInventoryScheduleNotFoundError,
  TripInventoryScheduleOperatingDayError,
  TripInventoryScheduleOperatorNotFoundError,
  TripInventoryScheduleRouteNotFoundError,
  TripInventoryScheduleVesselNotFoundError,
  TripInventoryScheduleVesselOperatorMismatchError,
  TripInventorySeatCapacityBelowConsumedError,
  TripInventorySeatCapacityExceedsVesselAllocationError,
  TripInventoryUpdateOpenSeatRequiredError,
  updateTripInventoryD1,
} from "@/lib/d1-trip-inventory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SALES_STATUSES = [
  "OPEN",
  "CLOSED",
  "CANCELLED",
  "SOLD_OUT",
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
    Date.UTC(
      year,
      month - 1,
      day
    )
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin =
      await getCurrentAdmin()

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

    const { id: rawId } =
      await context.params

    const id =
      String(
        rawId ?? ""
      ).trim()

    if (!id) {
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

    const body =
      (await request.json()) as
        UpdateTripInventoryRequest

    const scheduleId =
      body.scheduleId === undefined
        ? undefined
        : String(
            body.scheduleId ?? ""
          ).trim()

    const travelDate =
      body.travelDate === undefined
        ? undefined
        : normalizeDate(
            body.travelDate
          )

    const seatCapacity =
      body.seatCapacity === undefined
        ? undefined
        : toInteger(
            body.seatCapacity
          )

    const adultPrice =
      body.adultPrice === undefined
        ? undefined
        : toInteger(
            body.adultPrice
          )

    const childPrice =
      body.childPrice === undefined
        ? undefined
        : toInteger(
            body.childPrice
          )

    const infantPrice =
      body.infantPrice === undefined
        ? undefined
        : toInteger(
            body.infantPrice
          )

    const currency =
      body.currency === undefined
        ? undefined
        : normalizeCurrency(
            body.currency
          )

    const salesStatus =
      body.salesStatus === undefined
        ? undefined
        : normalizeSalesStatus(
            body.salesStatus
          )

    const isActive =
      typeof body.isActive ===
      "boolean"
        ? body.isActive
        : undefined

    const notes =
      body.notes === undefined
        ? undefined
        : optionalText(
            body.notes
          )

    if (
      body.scheduleId !==
        undefined &&
      !scheduleId
    ) {
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

    if (
      body.travelDate !==
        undefined &&
      !travelDate
    ) {
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
      body.seatCapacity !==
        undefined &&
      (
        seatCapacity === undefined ||
        seatCapacity === null ||
        seatCapacity < 0 ||
        seatCapacity > 1000
      )
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
      body.adultPrice !==
        undefined &&
      (
        adultPrice === undefined ||
        adultPrice === null ||
        adultPrice < 0 ||
        adultPrice > 1000000000
      )
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
      body.childPrice !==
        undefined &&
      (
        childPrice === undefined ||
        childPrice === null ||
        childPrice < 0 ||
        childPrice > 1000000000
      )
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
      body.infantPrice !==
        undefined &&
      (
        infantPrice === undefined ||
        infantPrice === null ||
        infantPrice < 0 ||
        infantPrice > 1000000000
      )
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

    if (
      body.currency !==
        undefined &&
      !currency
    ) {
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

    if (
      body.salesStatus !==
        undefined &&
      !salesStatus
    ) {
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

    if (
      salesStatus ===
      "SOLD_OUT"
    ) {
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

    const inventory =
      await updateTripInventoryD1(
        id,
        {
          scheduleId:
            scheduleId ?? undefined,

          travelDate:
            travelDate ?? undefined,

          seatCapacity:
            seatCapacity ?? undefined,

          adultPrice:
            adultPrice ?? undefined,

          childPrice:
            childPrice ?? undefined,

          infantPrice:
            infantPrice ?? undefined,

          currency:
            currency ?? undefined,

          salesStatus:
            salesStatus ?? undefined,

          isActive,

          notes,

          updatedBy:
            admin.email,
        }
      )

    return Response.json({
      success: true,
      inventory,
    })
  } catch (error) {
    console.error(
      "Trip inventory update error:",
      error
    )

    if (
      error instanceof
        TripInventoryNotFoundError ||
      error instanceof
        TripInventoryScheduleNotFoundError ||
      error instanceof
        TripInventoryScheduleOperatorNotFoundError ||
      error instanceof
        TripInventoryScheduleVesselNotFoundError ||
      error instanceof
        TripInventoryScheduleRouteNotFoundError
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
        TripInventoryExistingSeatDataInvalidError ||
      error instanceof
        TripInventorySeatCapacityBelowConsumedError ||
      error instanceof
        TripInventoryScheduleVesselOperatorMismatchError ||
      error instanceof
        TripInventoryInvalidVesselActiveCapacityError ||
      error instanceof
        TripInventorySeatCapacityExceedsVesselAllocationError ||
      error instanceof
        TripInventoryScheduleOperatingDayError ||
      error instanceof
        TripInventoryOpenActiveScheduleRequiredError ||
      error instanceof
        TripInventoryOpenActiveOperatorRequiredError ||
      error instanceof
        TripInventoryOpenActiveVesselRequiredError ||
      error instanceof
        TripInventoryOpenActiveRouteRequiredError ||
      error instanceof
        TripInventoryUpdateOpenSeatRequiredError
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

    if (
      error instanceof
        TripInventoryScheduleDateConflictError
    ) {
      return Response.json(
        {
          success: false,
          error: error.message,
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
            : "Trip inventory could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}
