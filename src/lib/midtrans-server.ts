import "server-only"

import midtransClient from "midtrans-client"

function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `${name} belum diatur.`
    )
  }

  return value
}

function getBooleanEnv(
  name: string
): boolean {
  const value =
    getRequiredEnv(name).toLowerCase()

  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  throw new Error(
    `${name} harus bernilai true atau false.`
  )
}

const isProduction =
  getBooleanEnv(
    "MIDTRANS_IS_PRODUCTION"
  )

const serverKey =
  getRequiredEnv(
    "MIDTRANS_SERVER_KEY"
  )

const clientKey =
  getRequiredEnv(
    "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"
  )

export const midtransEnvironment =
  isProduction
    ? "production"
    : "sandbox"

export const midtransSnap =
  new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  })

export function getMidtransServerKey():
  string {
  return serverKey
}
