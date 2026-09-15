import {
  cookies,
} from "next/headers"

import {
  getAdminCookieName,
} from "@/lib/admin-auth"

export const runtime =
  "nodejs"

export async function POST() {
  const cookieStore =
    await cookies()

  cookieStore.delete(
    getAdminCookieName()
  )

  return Response.json({
    success:
      true,
  })
}
