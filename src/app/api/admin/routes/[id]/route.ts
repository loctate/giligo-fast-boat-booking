import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateRouteRequest = {
  routeCode?: string
  fromPort?: string
  toPort?: string
  fromIsland?: string | null
  toIsland?: string | null
  estimatedDurationMinutes?: number | string
  isActive?: boolean
  notes?: string | null
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type PlainRoute = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  routeCode: string
  fromPort: string
  toPort: string
  fromIsland: string | null
  toIsland: string | null
  estimatedDurationMinutes: number
  isActive: boolean
  notes: string | null
  createdBy: string | null
  updatedBy: string | null
}

function optionalText(value: unknown): string | null {
  const normalizedValue = String(value ?? "").trim()

  return normalizedValue || null
}

function getErrorCode(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = Number(
      (error as { code?: unknown }).code
    )

    return Number.isFinite(code) ? code : null
  }

  return null
}

function toInteger(value: unknown): number | null {
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

function toPlainRoute(
  row: Record<string, unknown>
): PlainRoute {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(row.$createdAt ?? ""),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    routeCode: String(row.routeCode ?? ""),
    fromPort: String(row.fromPort ?? ""),
    toPort: String(row.toPort ?? ""),

    fromIsland: optionalText(row.fromIsland),
    toIsland: optionalText(row.toIsland),

    estimatedDurationMinutes: Number(
      row.estimatedDurationMinutes ?? 0
    ),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,

    notes: optionalText(row.notes),
    createdBy: optionalText(row.createdBy),
    updatedBy: optionalText(row.updatedBy),
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
    const routeId = String(id ?? "").trim()

    if (!routeId) {
      return Response.json(
        {
          success: false,
          error: "Route ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    let existingRoute

    try {
      existingRoute = await tablesDB.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.routesTableId,
        rowId: routeId,
      })
    } catch (error) {
      if (getErrorCode(error) === 404) {
        return Response.json(
          {
            success: false,
            error: "Route could not be found.",
          },
          {
            status: 404,
          }
        )
      }

      throw error
    }

    const existingRow =
      existingRoute as unknown as Record<
        string,
        unknown
      >

    const body =
      (await request.json()) as UpdateRouteRequest

    const data: Record<string, unknown> = {
      updatedBy: admin.email,
    }

    if (body.routeCode !== undefined) {
      const routeCode = String(body.routeCode)
        .trim()
        .toUpperCase()

      if (!routeCode) {
        return Response.json(
          {
            success: false,
            error: "Route code is required.",
          },
          {
            status: 400,
          }
        )
      }

      if (
        !/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(
          routeCode
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Route code must contain 2–50 uppercase letters, numbers, underscores, or hyphens.",
          },
          {
            status: 400,
          }
        )
      }

      data.routeCode = routeCode
    }

    let effectiveFromPort = String(
      existingRow.fromPort ?? ""
    ).trim()

    let effectiveToPort = String(
      existingRow.toPort ?? ""
    ).trim()

    if (body.fromPort !== undefined) {
      const fromPort = String(body.fromPort).trim()

      if (!fromPort) {
        return Response.json(
          {
            success: false,
            error: "Departure port is required.",
          },
          {
            status: 400,
          }
        )
      }

      if (fromPort.length > 120) {
        return Response.json(
          {
            success: false,
            error:
              "Departure port cannot exceed 120 characters.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveFromPort = fromPort
      data.fromPort = fromPort
    }

    if (body.toPort !== undefined) {
      const toPort = String(body.toPort).trim()

      if (!toPort) {
        return Response.json(
          {
            success: false,
            error: "Destination port is required.",
          },
          {
            status: 400,
          }
        )
      }

      if (toPort.length > 120) {
        return Response.json(
          {
            success: false,
            error:
              "Destination port cannot exceed 120 characters.",
          },
          {
            status: 400,
          }
        )
      }

      effectiveToPort = toPort
      data.toPort = toPort
    }

    if (
      effectiveFromPort.localeCompare(
        effectiveToPort,
        "en",
        {
          sensitivity: "base",
        }
      ) === 0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Departure port and destination port cannot be the same.",
        },
        {
          status: 400,
        }
      )
    }

    if (body.fromIsland !== undefined) {
      const fromIsland = optionalText(
        body.fromIsland
      )

      if (
        fromIsland &&
        fromIsland.length > 80
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Departure island cannot exceed 80 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.fromIsland = fromIsland
    }

    if (body.fromIsland !== undefined) {
      const fromIsland = optionalText(
        body.fromIsland
      )

      if (
        fromIsland &&
        fromIsland.length > 80
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Departure island cannot exceed 80 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.fromIsland = fromIsland
    }

    if (body.toIsland !== undefined) {
      const toIsland = optionalText(
        body.toIsland
      )

      if (
        toIsland &&
        toIsland.length > 80
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Destination island cannot exceed 80 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.toIsland = toIsland
    }

    if (
      body.estimatedDurationMinutes !==
      undefined
    ) {
      const estimatedDurationMinutes =
        toInteger(
          body.estimatedDurationMinutes
        )

      if (
        estimatedDurationMinutes === null ||
        estimatedDurationMinutes < 1 ||
        estimatedDurationMinutes > 1440
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Estimated duration must be an integer between 1 and 1440 minutes.",
          },
          {
            status: 400,
          }
        )
      }

      data.estimatedDurationMinutes =
        estimatedDurationMinutes
    }

    if (body.notes !== undefined) {
      const notes = optionalText(body.notes)

      if (notes && notes.length > 1000) {
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

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive
    }

    const updatedRoute =
      await tablesDB.updateRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.routesTableId,
        rowId: routeId,
        data,
      })

    return Response.json({
      success: true,

      route: toPlainRoute(
        updatedRoute as unknown as Record<
          string,
          unknown
        >
      ),
    })
  } catch (error) {
    console.error("Route update error:", error)

    if (getErrorCode(error) === 409) {
      return Response.json(
        {
          success: false,
          error:
            "Route code already exists. Please use another code.",
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
          error: "Route could not be found.",
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
            : "Route could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}
