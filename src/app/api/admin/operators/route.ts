import { ID, Query } from "node-appwrite"

import { getCurrentAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateOperatorRequest = {
  operatorCode?: string
  operatorName?: string
  contactPerson?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  logoUrl?: string
  isActive?: boolean
  notes?: string
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
      tableId: appwriteConfig.operatorsTableId,
      queries: [Query.limit(200)],
    })

    const operators = [...response.rows].sort(
      (firstOperator, secondOperator) => {
        const firstName = String(
          firstOperator.operatorName ?? ""
        )

        const secondName = String(
          secondOperator.operatorName ?? ""
        )

        return firstName.localeCompare(
          secondName,
          "en",
          {
            sensitivity: "base",
          }
        )
      }
    )

    return Response.json({
      success: true,
      operators,
      total: response.total,
    })
  } catch (error) {
    console.error("Operator list error:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Operator data could not be loaded.",
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
      (await request.json()) as CreateOperatorRequest

    const operatorCode = String(
      body.operatorCode ?? ""
    )
      .trim()
      .toUpperCase()

    const operatorName = String(
      body.operatorName ?? ""
    ).trim()

    const contactPerson = optionalText(
      body.contactPerson
    )

    const phone = optionalText(body.phone)
    const whatsapp = optionalText(body.whatsapp)
    const email = optionalText(body.email)
    const address = optionalText(body.address)
    const logoUrl = optionalText(body.logoUrl)
    const notes = optionalText(body.notes)

    if (!operatorCode) {
      return Response.json(
        {
          success: false,
          error: "Operator code is required.",
        },
        {
          status: 400,
        }
      )
    }

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

    const operator = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.operatorsTableId,
      rowId: ID.unique(),

      data: {
        operatorCode,
        operatorName,
        contactPerson,
        phone,
        whatsapp,
        email: email?.toLowerCase() ?? null,
        address,
        logoUrl,
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
        operator,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      "Operator creation error:",
      error
    )

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

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Operator could not be created.",
      },
      {
        status: 500,
      }
    )
  }
}
