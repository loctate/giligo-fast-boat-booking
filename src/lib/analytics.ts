import {
  readConsentPreferences,
} from "@/lib/consent"

const ANALYTICS_ONCE_PREFIX =
  "nusagiliboat_analytics_once_v1"

type AnalyticsEventParameters =
  Record<string, unknown>

function analyticsIsAllowed() {
  if (typeof window === "undefined") {
    return false
  }

  return (
    readConsentPreferences()
      ?.analytics === true
  )
}

function getDataLayer() {
  const analyticsWindow =
    window as Window & {
      dataLayer?: Array<
        Record<string, unknown>
      >
    }

  analyticsWindow.dataLayer =
    analyticsWindow.dataLayer || []

  return analyticsWindow.dataLayer
}

export function pushAnalyticsEvent(
  eventName: string,
  parameters: AnalyticsEventParameters = {}
) {
  if (
    !analyticsIsAllowed() ||
    !eventName.trim()
  ) {
    return false
  }

  getDataLayer().push({
    ...parameters,
    event: eventName.trim(),
  })

  return true
}

export function pushAnalyticsEventOnce(
  eventName: string,
  uniqueId: string,
  parameters: AnalyticsEventParameters = {}
) {
  if (
    typeof window === "undefined" ||
    !eventName.trim() ||
    !uniqueId.trim()
  ) {
    return false
  }

  const storageKey =
    `${ANALYTICS_ONCE_PREFIX}:${eventName.trim()}:${uniqueId.trim()}`

  try {
    if (
      window.localStorage.getItem(
        storageKey
      )
    ) {
      return false
    }
  } catch {
    // Continue without local deduplication.
  }

  const pushed =
    pushAnalyticsEvent(
      eventName,
      parameters
    )

  if (!pushed) {
    return false
  }

  try {
    window.localStorage.setItem(
      storageKey,
      new Date().toISOString()
    )
  } catch {
    // GA4 transaction_id will remain the
    // secondary protection against duplicates.
  }

  return true
}
