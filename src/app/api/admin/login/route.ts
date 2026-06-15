import { cookies } from "next/headers"

import {
  createAdminAuthAccount,
  createSessionAccount,
  getAdminCookieName,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

type LoginRequest = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest

    const email = String(body.email || "")
      .trim()
      .toLowerCase()

    const password = String(body.password || "")

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        {
          status: 400,
        }
      )
    }

    const adminEmail = String(
      process.env.ADMIN_EMAIL || ""
    )
      .trim()
      .toLowerCase()

    if (!adminEmail || email !== adminEmail) {
      return Response.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      )
    }

    const adminAccount = createAdminAuthAccount()

    const session =
      await adminAccount.createEmailPasswordSession({
        email,
        password,
      })

    const sessionAccount = createSessionAccount(
      session.secret
    )

    const user = await sessionAccount.get()

    if (
      user.email.trim().toLowerCase() !== adminEmail
    ) {
      await sessionAccount.deleteSession({
        sessionId: "current",
      })

      return Response.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      )
    }

    const cookieStore = await cookies()

    cookieStore.set(
      getAdminCookieName(),
      session.secret,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(session.expire),
      }
    )

    return Response.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)

    return Response.json(
      {
        success: false,
        error: "Invalid email or password.",
      },
      {
        status: 401,
      }
    )
  }
}