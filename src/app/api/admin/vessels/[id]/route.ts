import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateVesselRequest = {
  vesselCode?: string
  operatorId?: string
  vesselName?: string
  vesselType?: string | null
  registrationNumber?: string | null
  totalCapacity?: number | string
  activeCapacity?: number | string
  imageUrl?: string | null
  isActive?: boolean
  notes?: string | null
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
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
  operator: PlainOperator
): PlainVessel {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(row.$createdAt ?? ""),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    vesselCode: String(row.vesselCode ?? ""),
    operatorId: String(row.operatorId ?? ""),

    operatorCode: operator.operatorCode,
    operatorName: operator.operatorName,

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
    const vesselId = String(id ?? "").trim()

    if (!vesselId) {
      return Response.json(
        {
          success: false,
          error: "Vessel ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    let existingVessel

    try {
      existingVessel = await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.vesselsTableId,

        rowId: vesselId,
      })
    } catch (error) {
      if (getErrorCode(error) === 404) {
        return Response.json(
          {
            success: false,
            error: "Vessel could not be found.",
          },
          {
            status: 404,
          }
        )
      }

      throw error
    }

    const existingRow =
      existingVessel as unknown as Record<
        string,
        unknown
      >

    const body =
      (await request.json()) as UpdateVesselRequest

    const data: Record<string, unknown> = {
      updatedBy: admin.email,
    }

    if (body.vesselCode !== undefined) {
      const vesselCode = String(
        body.vesselCode
      )
        .trim()
        .toUpperCase()

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

      data.vesselCode = vesselCode
    }

    let effectiveOperatorId = String(
      existingRow.operatorId ?? ""
    )

    if (body.operatorId !== undefined) {
      const operatorId = String(
        body.operatorId
      ).trim()

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

      effectiveOperatorId = operatorId
      data.operatorId = operatorId
    }

    if (body.vesselName !== undefined) {
      const vesselName = String(
        body.vesselName
      ).trim()

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

      data.vesselName = vesselName
    }

    if (body.vesselType !== undefined) {
      const vesselType = optionalText(
        body.vesselType
      )

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

      data.vesselType = vesselType
    }

    if (
      body.registrationNumber !== undefined
    ) {
      const registrationNumber = optionalText(
        body.registrationNumber
      )

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

      data.registrationNumber =
        registrationNumber
    }

    let effectiveTotalCapacity = Number(
      existingRow.totalCapacity ?? 0
    )

    let effectiveActiveCapacity = Number(
      existingRow.activeCapacity ?? 0
    )

    if (body.totalCapacity !== undefined) {
      const totalCapacity = toInteger(
        body.totalCapacity
      )

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

      effectiveTotalCapacity = totalCapacity
      data.totalCapacity = totalCapacity
    }

    if (body.activeCapacity !== undefined) {
      const activeCapacity = toInteger(
        body.activeCapacity
      )

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

      effectiveActiveCapacity =
        activeCapacity

      data.activeCapacity = activeCapacity
    }

    if (
      effectiveActiveCapacity >
      effectiveTotalCapacity
    ) {
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

    if (body.imageUrl !== undefined) {
      const imageUrl = optionalText(
        body.imageUrl
      )

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

      data.imageUrl = imageUrl
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

    const currentIsActive =
      existingRow.isActive === true

    const effectiveIsActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : currentIsActive

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive
    }

    let operatorRow

    try {
      operatorRow = await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.operatorsTableId,

        rowId: effectiveOperatorId,
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

    const plainOperator = toPlainOperator(
      operatorRow as unknown as Record<
        string,
        unknown
      >
    )

    if (
      !plainOperator.isActive &&
      effectiveIsActive
    ) {
      return Response.json(
        {
          success: false,
          error:
            "An active vessel must belong to an active operator. Deactivate the vessel or select an active operator.",
        },
        {
          status: 400,
        }
      )
    }

    const updatedVessel =
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.vesselsTableId,

        rowId: vesselId,
        data,
      })

    return Response.json({
      success: true,

      vessel: toPlainVessel(
        updatedVessel as unknown as Record<
          string,
          unknown
        >,
        plainOperator
      ),
    })
  } catch (error) {
    console.error(
      "Vessel update error:",
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

    if (getErrorCode(error) === 404) {
      return Response.json(
        {
          success: false,
          error: "Vessel could not be found.",
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
            : "Vessel could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}
