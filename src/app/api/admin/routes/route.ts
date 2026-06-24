import { ID, Query } from "node-appwrite"

import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateRouteRequest = {
  routeCode?: string
  fromPort?: string
  toPort?: string
  fromIsland?: string
  toIsland?: string
  estimatedDurationMinutes?: number | string
  isActive?: boolean
  notes?: string
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

function sortRoutes(routes: PlainRoute[]) {
  return [...routes].sort((firstRoute, secondRoute) => {
    const fromComparison =
      firstRoute.fromPort.localeCompare(
        secondRoute.fromPort,
        "en",
        {
          sensitivity: "base",
        }
      )

    if (fromComparison !== 0) {
      return fromComparison
    }

    return firstRoute.toPort.localeCompare(
      secondRoute.toPort,
      "en",
      {
        sensitivity: "base",
      }
    )
  })
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

    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.routesTableId,
      queries: [Query.limit(200)],
    })

    const routes = sortRoutes(
      response.rows.map((row) =>
        toPlainRoute(
          row as unknown as Record<
            string,
            unknown
          >
        )
      )
    )

    return Response.json({
      success: true,
      routes,
      total: response.total,
    })
  } catch (error) {
    console.error("Route list error:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Route data could not be loaded.",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: Request) {
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
      (await request.json()) as CreateRouteRequest

    const routeCode = String(
      body.routeCode ?? ""
    )
      .trim()
      .toUpperCase()

    const fromPort = String(
      body.fromPort ?? ""
    ).trim()

    const toPort = String(
      body.toPort ?? ""
    ).trim()

    const fromIsland = optionalText(
      body.fromIsland
    )

    const toIsland = optionalText(
      body.toIsland
    )

    const notes = optionalText(body.notes)

    const estimatedDurationMinutes =
      toInteger(
        body.estimatedDurationMinutes
      )

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

    if (
      fromPort.localeCompare(toPort, "en", {
        sensitivity: "base",
      }) === 0
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

    const route = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.routesTableId,
      rowId: ID.unique(),

      data: {
        routeCode,
        fromPort,
        toPort,
        fromIsland,
        toIsland,
        estimatedDurationMinutes,

        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : true,

        notes,
        createdBy: admin.email,
        updatedBy: admin.email,
      },
    })

    return Response.json(
      {
        success: true,

        route: toPlainRoute(
          route as unknown as Record<
            string,
            unknown
          >
        ),
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error("Route creation error:", error)

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

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Route could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}
