import { Account, Client } from "node-appwrite"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(name + " belum diatur di .env.local")
  }

  return value
}

function createBaseClient() {
  return new Client()
    .setEndpoint(getRequiredEnv("APPWRITE_ENDPOINT"))
    .setProject(getRequiredEnv("APPWRITE_PROJECT_ID"))
}

export function createAdminAuthAccount() {
  const client = createBaseClient().setKey(
    getRequiredEnv("APPWRITE_API_KEY")
  )

  return new Account(client)
}

export function createSessionAccount(
  sessionSecret: string
) {
  const client = createBaseClient().setSession(
    sessionSecret
  )

  return new Account(client)
}

export function getAdminCookieName() {
  return (
    process.env.ADMIN_SESSION_COOKIE ||
    "giligo_admin_session"
  )
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies()

  const sessionSecret = cookieStore.get(
    getAdminCookieName()
  )?.value

  if (!sessionSecret) {
    return null
  }

  try {
    const account = createSessionAccount(sessionSecret)
    const user = await account.get()

    const allowedEmail = getRequiredEnv(
      "ADMIN_EMAIL"
    )
      .trim()
      .toLowerCase()

    const userEmail = user.email
      .trim()
      .toLowerCase()

    if (userEmail !== allowedEmail) {
      return null
    }

    return user
  } catch {
    return null
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect("/admin/login")
  }

  return admin
}