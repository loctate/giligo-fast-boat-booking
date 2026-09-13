import {
  createTripInventoryD1,
  listTripInventoryD1,
  TripInventoryInvalidVesselActiveCapacityError,
  TripInventoryOpenActiveOperatorRequiredError,
  TripInventoryOpenActiveRouteRequiredError,
  TripInventoryOpenActiveScheduleRequiredError,
  TripInventoryOpenActiveVesselRequiredError,
  TripInventoryOpenSeatRequiredError,
  TripInventoryScheduleDateConflictError,
  TripInventoryScheduleNotFoundError,
  TripInventoryScheduleOperatingDayError,
  TripInventoryScheduleOperatorNotFoundError,
  TripInventoryScheduleRouteNotFoundError,
  TripInventoryScheduleVesselNotFoundError,
  TripInventoryScheduleVesselOperatorMismatchError,
  TripInventorySeatCapacityExceedsVesselAllocationError,
} from "@/lib/d1-trip-inventory"
import { getCurrentAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SALES_STATUSES = [
  "OPEN",
  "CLOSED",
  "CANCELLED",
  "SOLD_OUT",
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
      inventories,
      total,
    } = await listTripInventoryD1()

    return Response.json({
      success: true,
      inventory: inventories,
      total,
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

    const createdInventory =
      await createTripInventoryD1({
        scheduleId,
        travelDate,

        seatCapacity,

        adultPrice,
        childPrice,
        infantPrice,

        currency,
        salesStatus,

        isActive,

        notes,

        createdBy: admin.email,
        updatedBy: admin.email,
      })

    return Response.json(
      {
        success: true,
        inventory: createdInventory,
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

    if (
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
        TripInventoryOpenSeatRequiredError
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
            : "Trip inventory could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}
