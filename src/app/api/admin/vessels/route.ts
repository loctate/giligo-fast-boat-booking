import { ID, Query } from "node-appwrite"

import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateVesselRequest = {
  vesselCode?: string
  operatorId?: string
  vesselName?: string
  vesselType?: string
  registrationNumber?: string
  totalCapacity?: number
  activeCapacity?: number
  imageUrl?: string
  isActive?: boolean
  notes?: string
}

type PlainOperator = {
  $id: string
  operatorCode: string
  operatorName: string
  isActive: boolean
}

type PlainVessel = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  vesselCode: string
  operatorId: string
  operatorCode: string
  operatorName: string
  vesselName: string
  vesselType: string | null
  registrationNumber: string | null
  totalCapacity: number
  activeCapacity: number
  imageUrl: string | null
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

  if (!Number.isInteger(parsedValue)) {
    return null
  }

  return parsedValue
}

function validateHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value)

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    )
  } catch {
    return false
  }
}

function toPlainOperator(
  row: Record<string, unknown>
): PlainOperator {
  return {
    $id: String(row.$id ?? ""),
    operatorCode: String(
      row.operatorCode ?? ""
    ),
    operatorName: String(
      row.operatorName ?? ""
    ),
    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,
  }
}

function toPlainVessel(
  row: Record<string, unknown>,
  operator?: PlainOperator
): PlainVessel {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(row.$createdAt ?? ""),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    vesselCode: String(row.vesselCode ?? ""),
    operatorId: String(row.operatorId ?? ""),

    operatorCode:
      operator?.operatorCode ?? "",

    operatorName:
      operator?.operatorName ??
      "Unknown operator",

    vesselName: String(row.vesselName ?? ""),

    vesselType: optionalText(row.vesselType),

    registrationNumber: optionalText(
      row.registrationNumber
    ),

    totalCapacity: Number(
      row.totalCapacity ?? 0
    ),

    activeCapacity: Number(
      row.activeCapacity ?? 0
    ),

    imageUrl: optionalText(row.imageUrl),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,

    notes: optionalText(row.notes),
    createdBy: optionalText(row.createdBy),
    updatedBy: optionalText(row.updatedBy),
  }
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
      vesselsResponse,
      operatorsResponse,
    ] = await Promise.all([
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
          appwriteConfig.operatorsTableId,

        queries: [Query.limit(200)],
      }),
    ])

    const operators =
      operatorsResponse.rows.map((row) =>
        toPlainOperator(
          row as unknown as Record<
            string,
            unknown
          >
        )
      )

    const operatorMap = new Map(
      operators.map((operator) => [
        operator.$id,
        operator,
      ])
    )

    const vessels = vesselsResponse.rows
      .map((row) => {
        const plainRow =
          row as unknown as Record<
            string,
            unknown
          >

        const operatorId = String(
          plainRow.operatorId ?? ""
        )

        return toPlainVessel(
          plainRow,
          operatorMap.get(operatorId)
        )
      })
      .sort((firstVessel, secondVessel) =>
        firstVessel.vesselName.localeCompare(
          secondVessel.vesselName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

    return Response.json({
      success: true,
      vessels,
      operators: operators
        .filter((operator) => operator.isActive)
        .sort((firstOperator, secondOperator) =>
          firstOperator.operatorName.localeCompare(
            secondOperator.operatorName,
            "en",
            {
              sensitivity: "base",
            }
          )
        ),
      total: vesselsResponse.total,
    })
  } catch (error) {
    console.error("Vessel list error:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Vessel data could not be loaded.",
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
      (await request.json()) as CreateVesselRequest

    const vesselCode = String(
      body.vesselCode ?? ""
    )
      .trim()
      .toUpperCase()

    const operatorId = String(
      body.operatorId ?? ""
    ).trim()

    const vesselName = String(
      body.vesselName ?? ""
    ).trim()

    const vesselType = optionalText(
      body.vesselType
    )

    const registrationNumber = optionalText(
      body.registrationNumber
    )

    const imageUrl = optionalText(body.imageUrl)
    const notes = optionalText(body.notes)

    const totalCapacity = toInteger(
      body.totalCapacity
    )

    const activeCapacity = toInteger(
      body.activeCapacity
    )

    if (!vesselCode) {
      return Response.json(
        {
          success: false,
          error: "Vessel code is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(
        vesselCode
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Vessel code must contain 2–30 uppercase letters, numbers, underscores, or hyphens.",
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

    if (!vesselName) {
      return Response.json(
        {
          success: false,
          error: "Vessel name is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (vesselName.length > 120) {
      return Response.json(
        {
          success: false,
          error:
            "Vessel name cannot exceed 120 characters.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      vesselType &&
      vesselType.length > 50
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Vessel type cannot exceed 50 characters.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      registrationNumber &&
      registrationNumber.length > 80
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Registration number cannot exceed 80 characters.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      totalCapacity === null ||
      totalCapacity < 1 ||
      totalCapacity > 1000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Total capacity must be an integer between 1 and 1000.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      activeCapacity === null ||
      activeCapacity < 0 ||
      activeCapacity > 1000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Active capacity must be an integer between 0 and 1000.",
        },
        {
          status: 400,
        }
      )
    }

    if (activeCapacity > totalCapacity) {
      return Response.json(
        {
          success: false,
          error:
            "Active capacity cannot exceed total capacity.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      imageUrl &&
      imageUrl.length > 500
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Image URL cannot exceed 500 characters.",
        },
        {
          status: 400,
        }
      )
    }

    if (
      imageUrl &&
      !validateHttpUrl(imageUrl)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Image URL must be a valid HTTP or HTTPS URL.",
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

    let operatorRow

    try {
      operatorRow = await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.operatorsTableId,

        rowId: operatorId,
      })
    } catch (error) {
      if (getErrorCode(error) === 404) {
        return Response.json(
          {
            success: false,
            error:
              "Selected operator could not be found.",
          },
          {
            status: 400,
          }
        )
      }

      throw error
    }

    if (operatorRow.isActive !== true) {
      return Response.json(
        {
          success: false,
          error:
            "Selected operator is currently inactive.",
        },
        {
          status: 400,
        }
      )
    }

    const vessel = await tablesDB.createRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.vesselsTableId,

      rowId: ID.unique(),

      data: {
        vesselCode,
        operatorId,
        vesselName,
        vesselType,
        registrationNumber,
        totalCapacity,
        activeCapacity,
        imageUrl,
        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : true,
        notes,
        createdBy: admin.email,
        updatedBy: admin.email,
      },
    })

    const plainOperator = toPlainOperator(
      operatorRow as unknown as Record<
        string,
        unknown
      >
    )

    return Response.json(
      {
        success: true,

        vessel: toPlainVessel(
          vessel as unknown as Record<
            string,
            unknown
          >,
          plainOperator
        ),
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      "Vessel creation error:",
      error
    )

    if (getErrorCode(error) === 409) {
      return Response.json(
        {
          success: false,
          error:
            "Vessel code already exists. Please use another code.",
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
            : "Vessel could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}