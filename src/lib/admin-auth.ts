import {
  cookies,
} from "next/headers"

import {
  redirect,
} from "next/navigation"

const SESSION_TTL_MS =
  24 * 60 * 60 * 1000

const PASSWORD_ITERATIONS =
  210_000

const textEncoder =
  new TextEncoder()

const textDecoder =
  new TextDecoder()

export interface AdminIdentity {
  name: string
  email: string
}

type SessionPayload = {
  email: string
  exp: number
}

function requiredEnv(
  name: string
): string {
  const value =
    process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    )
  }

  return value
}

function configuredAdminEmail(): string {
  return requiredEnv(
    "ADMIN_EMAIL"
  ).toLowerCase()
}

function encodeBase64Url(
  value: Uint8Array
): string {
  let binary = ""

  for (const byte of value) {
    binary +=
      String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

/*
 * IMPORTANT:
 * Return a real ArrayBuffer, not Uint8Array<ArrayBufferLike>.
 *
 * WebCrypto BufferSource typing in this project requires
 * ArrayBuffer / ArrayBufferView<ArrayBuffer>, and this avoids
 * SharedArrayBuffer-compatible ArrayBufferLike inference.
 */
function decodeBase64Url(
  value: string
): ArrayBuffer {
  const normalized =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/")

  const padded =
    normalized +
    "=".repeat(
      (
        4 -
        (
          normalized.length %
          4
        )
      ) %
        4
    )

  const binary =
    atob(padded)

  const buffer =
    new ArrayBuffer(
      binary.length
    )

  const bytes =
    new Uint8Array(
      buffer
    )

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index)
  }

  return buffer
}

async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(
      requiredEnv(
        "ADMIN_SESSION_SECRET"
      )
    ),
    {
      name:
        "HMAC",

      hash:
        "SHA-256",
    },
    false,
    [
      "sign",
      "verify",
    ]
  )
}

async function signPayload(
  encodedPayload: string
): Promise<string> {
  const key =
    await importHmacKey()

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      textEncoder.encode(
        encodedPayload
      )
    )

  return encodeBase64Url(
    new Uint8Array(
      signature
    )
  )
}

async function verifySignature(
  encodedPayload: string,
  encodedSignature: string
): Promise<boolean> {
  try {
    const key =
      await importHmacKey()

    return await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(
        encodedSignature
      ),
      textEncoder.encode(
        encodedPayload
      )
    )
  } catch {
    return false
  }
}

async function derivePasswordHash(
  password: string
): Promise<Uint8Array<ArrayBuffer>> {
  const salt =
    decodeBase64Url(
      requiredEnv(
        "ADMIN_PASSWORD_SALT"
      )
    )

  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(
        password
      ),
      "PBKDF2",
      false,
      [
        "deriveBits",
      ]
    )

  const bits =
    await crypto.subtle.deriveBits(
      {
        name:
          "PBKDF2",

        hash:
          "SHA-256",

        salt,

        iterations:
          PASSWORD_ITERATIONS,
      },
      passwordKey,
      256
    )

  return new Uint8Array(
    bits
  )
}

function constantTimeEqual(
  first: Uint8Array,
  second: Uint8Array
): boolean {
  if (
    first.length !==
    second.length
  ) {
    return false
  }

  let difference = 0

  for (
    let index = 0;
    index < first.length;
    index += 1
  ) {
    difference |=
      first[index] ^
      second[index]
  }

  return difference === 0
}

export function getAdminCookieName() {
  return (
    process.env
      .ADMIN_SESSION_COOKIE ||
    "giligo_admin_session"
  )
}

export function getAdminSessionExpiry() {
  return new Date(
    Date.now() +
      SESSION_TTL_MS
  )
}

export async function verifyAdminPassword(
  password: string
): Promise<boolean> {
  try {
    const expected =
      new Uint8Array(
        decodeBase64Url(
          requiredEnv(
            "ADMIN_PASSWORD_HASH"
          )
        )
      )

    if (
      expected.length !== 32
    ) {
      return false
    }

    const actual =
      await derivePasswordHash(
        password
      )

    return constantTimeEqual(
      actual,
      expected
    )
  } catch {
    return false
  }
}

export async function createAdminSessionToken(
  email: string,
  expiresAt: Date
): Promise<string> {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase()

  if (
    normalizedEmail !==
    configuredAdminEmail()
  ) {
    throw new Error(
      "Admin email mismatch."
    )
  }

  const payload:
    SessionPayload = {
      email:
        normalizedEmail,

      exp:
        expiresAt.getTime(),
    }

  const encodedPayload =
    encodeBase64Url(
      textEncoder.encode(
        JSON.stringify(
          payload
        )
      )
    )

  const signature =
    await signPayload(
      encodedPayload
    )

  return (
    `${encodedPayload}.` +
    signature
  )
}

async function verifyAdminSessionToken(
  token: string
): Promise<AdminIdentity | null> {
  const parts =
    token.split(".")

  if (
    parts.length !== 2
  ) {
    return null
  }

  const [
    encodedPayload,
    encodedSignature,
  ] = parts

  const signatureValid =
    await verifySignature(
      encodedPayload,
      encodedSignature
    )

  if (!signatureValid) {
    return null
  }

  try {
    const json =
      textDecoder.decode(
        decodeBase64Url(
          encodedPayload
        )
      )

    const payload =
      JSON.parse(
        json
      ) as Partial<
        SessionPayload
      >

    const email =
      String(
        payload.email ?? ""
      )
        .trim()
        .toLowerCase()

    const exp =
      Number(
        payload.exp
      )

    if (
      !email ||
      email !==
        configuredAdminEmail() ||
      !Number.isFinite(exp) ||
      exp <= Date.now()
    ) {
      return null
    }

    return {
      name:
        "Administrator",

      email,
    }
  } catch {
    return null
  }
}

export async function getCurrentAdmin():
  Promise<AdminIdentity | null> {
  const cookieStore =
    await cookies()

  const token =
    cookieStore.get(
      getAdminCookieName()
    )?.value

  if (!token) {
    return null
  }

  return verifyAdminSessionToken(
    token
  )
}

export async function requireAdmin():
  Promise<AdminIdentity> {
  const admin =
    await getCurrentAdmin()

  if (!admin) {
    redirect(
      "/admin/login"
    )
  }

  return admin
}
