export const CONSENT_VERSION = 1

export const CONSENT_STORAGE_KEY =
  "nusagiliboat_consent_v1"

export const CONSENT_CHANGE_EVENT =
  "nusagiliboat:consent-change"

export type ConsentPreferences = {
  version: typeof CONSENT_VERSION
  analytics: boolean
  advertising: boolean
  updatedAt: string
}

export function readConsentPreferences():
  | ConsentPreferences
  | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const rawValue =
      window.localStorage.getItem(
        CONSENT_STORAGE_KEY
      )

    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(
      rawValue
    ) as Partial<ConsentPreferences>

    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.advertising !== "boolean" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null
    }

    return parsed as ConsentPreferences
  } catch {
    return null
  }
}

export function writeConsentPreferences(
  preferences: Omit<
    ConsentPreferences,
    "version" | "updatedAt"
  >
): ConsentPreferences {
  const nextPreferences: ConsentPreferences = {
    version: CONSENT_VERSION,
    analytics: preferences.analytics,
    advertising: preferences.advertising,
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(nextPreferences)
      )
    } catch {
      // Consent still applies for the current page session
      // even if browser storage is unavailable.
    }

    window.dispatchEvent(
      new CustomEvent(
        CONSENT_CHANGE_EVENT,
        {
          detail: nextPreferences,
        }
      )
    )
  }

  return nextPreferences
}
