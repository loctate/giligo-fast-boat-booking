import { cookies } from "next/headers"

import {
  createSessionAccount,
  getAdminCookieName,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST() {
  const cookieStore = await cookies()
  const cookieName = getAdminCookieName()

  const sessionSecret =
    cookieStore.get(cookieName)?.value

  if (sessionSecret) {
    try {
      const account =
        createSessionAccount(sessionSecret)

      await account.deleteSession({
        sessionId: "current",
      })
    } catch (error) {
      console.error(
        "Appwrite logout error:",
        error
      )
    }
  }

  cookieStore.delete(cookieName)

  return Response.json({
    success: true,
  })
}