import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"

type UpdateOperatorRequest = {
  operatorCode?: string
  operatorName?: string
  contactPerson?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
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

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Operator ID is required.",
        },
        {
          status: 400,
        }
      )
    }

    const body =
      (await request.json()) as UpdateOperatorRequest

    const data: Record<string, unknown> = {
      updatedBy: admin.email,
    }

    if (body.operatorCode !== undefined) {
      const operatorCode = String(body.operatorCode)
        .trim()
        .toUpperCase()

      if (
        !/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(
          operatorCode
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Operator code must contain 2–30 uppercase letters, numbers, underscores, or hyphens.",
          },
          {
            status: 400,
          }
        )
      }

      data.operatorCode = operatorCode
    }

    if (body.operatorName !== undefined) {
      const operatorName = String(
        body.operatorName
      ).trim()

      if (!operatorName) {
        return Response.json(
          {
            success: false,
            error: "Operator name is required.",
          },
          {
            status: 400,
          }
        )
      }

      if (operatorName.length > 120) {
        return Response.json(
          {
            success: false,
            error:
              "Operator name cannot exceed 120 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.operatorName = operatorName
    }

    if (body.contactPerson !== undefined) {
      const contactPerson = optionalText(
        body.contactPerson
      )

      if (
        contactPerson &&
        contactPerson.length > 100
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Contact person cannot exceed 100 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.contactPerson = contactPerson
    }

    if (body.phone !== undefined) {
      const phone = optionalText(body.phone)

      if (phone && phone.length > 30) {
        return Response.json(
          {
            success: false,
            error:
              "Phone number cannot exceed 30 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.phone = phone
    }

    if (body.whatsapp !== undefined) {
      const whatsapp = optionalText(
        body.whatsapp
      )

      if (whatsapp && whatsapp.length > 30) {
        return Response.json(
          {
            success: false,
            error:
              "WhatsApp number cannot exceed 30 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.whatsapp = whatsapp
    }

    if (body.email !== undefined) {
      const email = optionalText(body.email)

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return Response.json(
          {
            success: false,
            error: "Operator email is not valid.",
          },
          {
            status: 400,
          }
        )
      }

      if (email && email.length > 120) {
        return Response.json(
          {
            success: false,
            error:
              "Operator email cannot exceed 120 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.email = email?.toLowerCase() ?? null
    }

    if (body.address !== undefined) {
      const address = optionalText(body.address)

      if (address && address.length > 500) {
        return Response.json(
          {
            success: false,
            error:
              "Address cannot exceed 500 characters.",
          },
          {
            status: 400,
          }
        )
      }

      data.address = address
    }

    if (body.logoUrl !== undefined) {
      const logoUrl = optionalText(body.logoUrl)

      if (logoUrl) {
        if (logoUrl.length > 500) {
          return Response.json(
            {
              success: false,
              error:
                "Logo URL cannot exceed 500 characters.",
            },
            {
              status: 400,
            }
          )
        }

        try {
          const parsedLogoUrl = new URL(logoUrl)

          if (
            parsedLogoUrl.protocol !== "http:" &&
            parsedLogoUrl.protocol !== "https:"
          ) {
            throw new Error("Unsupported protocol")
          }
        } catch {
          return Response.json(
            {
              success: false,
              error:
                "Logo URL must be a valid HTTP or HTTPS URL.",
            },
            {
              status: 400,
            }
          )
        }
      }

      data.logoUrl = logoUrl
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

    const operator = await tablesDB.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.operatorsTableId,
      rowId: id,
      data,
    })

    return Response.json({
      success: true,
      operator,
    })
  } catch (error) {
    console.error("Operator update error:", error)

    if (getErrorCode(error) === 409) {
      return Response.json(
        {
          success: false,
          error:
            "Operator code already exists. Please use another code.",
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
          error: "Operator could not be found.",
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
            : "Operator could not be updated.",
      },
      {
        status: 500,
      }
    )
  }
}