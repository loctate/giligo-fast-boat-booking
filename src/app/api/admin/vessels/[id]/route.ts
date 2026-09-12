import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  getVesselByIdD1,
  updateVesselD1,
  VesselActiveOperatorRequiredError,
  VesselNotFoundError,
  VesselOperatorNotFoundError,
  type UpdateVesselD1Input,
} from "@/lib/d1-vessels"
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

    const existingVessel =
      await getVesselByIdD1(vesselId)

    if (!existingVessel) {
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

    const body =
      (await request.json()) as UpdateVesselRequest

    const data: UpdateVesselD1Input = {
      id: vesselId,
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
      existingVessel.totalCapacity ?? 0
    )

    let effectiveActiveCapacity = Number(
      existingVessel.activeCapacity ?? 0
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

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive
    }

    try {
      const vessel =
        await updateVesselD1(data)

      return Response.json({
        success: true,
        vessel,
      })
    } catch (error) {
      if (
        error instanceof
          VesselOperatorNotFoundError ||
        error instanceof
          VesselActiveOperatorRequiredError
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
        error instanceof VesselNotFoundError
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

      throw error
    }
  } catch (error) {
    console.error(
      "Vessel update error:",
      error
    )

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
