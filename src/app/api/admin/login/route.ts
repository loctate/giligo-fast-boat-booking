import {
  cookies,
} from "next/headers"

import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminSessionExpiry,
  getConfiguredAdminEmail,
  verifyAdminPassword,
} from "@/lib/admin-auth"

export const runtime =
  "nodejs"

type LoginRequest = {
  email?: string
  password?: string
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (
        await request.json()
      ) as LoginRequest

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase()

    const password =
      String(
        body.password || ""
      )

    if (
      !email ||
      !password
    ) {
      return Response.json(
        {
          success:
            false,

          error:
            "Email and password are required.",
        },
        {
          status:
            400,
        }
      )
    }

    const adminEmail =
      getConfiguredAdminEmail()

    if (
      !adminEmail ||
      email !==
        adminEmail
    ) {
      return Response.json(
        {
          success:
            false,

          error:
            "Invalid email or password.",
        },
        {
          status:
            401,
        }
      )
    }

    const passwordValid =
      await verifyAdminPassword(
        password
      )

    if (!passwordValid) {
      return Response.json(
        {
          success:
            false,

          error:
            "Invalid email or password.",
        },
        {
          status:
            401,
        }
      )
    }

    const expiresAt =
      getAdminSessionExpiry()

    const token =
      await createAdminSessionToken(
        adminEmail,
        expiresAt
      )

    const cookieStore =
      await cookies()

    cookieStore.set(
      getAdminCookieName(),
      token,
      {
        httpOnly:
          true,

        secure: true,

        sameSite:
          "strict",

        path:
          "/",

        expires:
          expiresAt,
      }
    )

    return Response.json({
      success:
        true,

      user: {
        name:
          "Administrator",

        email:
          adminEmail,
      },
    })
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    )

    return Response.json(
      {
        success:
          false,

        error:
          "Invalid email or password.",
      },
      {
        status:
          401,
      }
    )
  }
}
