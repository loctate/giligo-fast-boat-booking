import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  createVesselD1,
  listVesselsD1,
  VesselOperatorInactiveError,
  VesselOperatorNotFoundError,
} from "@/lib/d1-vessels"
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

function optionalText(value: unknown): string | null {
  const normalizedValue = String(value ?? "").trim()

  return normalizedValue || null
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
      vessels,
      operators,
      total,
    } = await listVesselsD1()

    return Response.json({
      success: true,
      vessels,
      operators,
      total,
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

    try {
      const vessel = await createVesselD1({
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
      })

      return Response.json(
        {
          success: true,
          vessel,
        },
        {
          status: 201,
        }
      )
    } catch (error) {
      if (
        error instanceof
          VesselOperatorNotFoundError ||
        error instanceof
          VesselOperatorInactiveError
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

      throw error
    }
  } catch (error) {
    console.error(
      "Vessel creation error:",
      error
    )

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
