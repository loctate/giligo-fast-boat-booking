import type {
  MetadataRoute,
} from "next"

const baseUrl =
  "https://nusagiliboat.com"

const localizedPaths = [
  "/about",
  "/contact",
  "/faq",
  "/terms-and-conditions",
  "/privacy-policy",
  "/refund-and-cancellation-policy",
] as const

const lastModified = new Date(
  "2026-07-24T00:00:00+07:00",
)

const routePaths = [
  "/routes/sanur-to-nusa-penida",
  "/routes/nusa-penida-to-sanur",
] as const

const routeLastModified = new Date(
  "2026-09-01T00:00:00+07:00",
)

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedEntries: MetadataRoute.Sitemap =
    localizedPaths.flatMap((path) => {
      const englishUrl =
        `${baseUrl}${path}`

      const indonesianUrl =
        `${baseUrl}/id${path}`

      const alternates = {
        languages: {
          en: englishUrl,
          "id-ID": indonesianUrl,
          "x-default": englishUrl,
        },
      }

      return [
        {
          url: englishUrl,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates,
        },
        {
          url: indonesianUrl,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates,
        },
      ]
    })

  const routeEntries: MetadataRoute.Sitemap =
    routePaths.flatMap((path) => {
      const englishUrl =
        `${baseUrl}${path}`

      const indonesianUrl =
        `${baseUrl}/id${path}`

      const alternates = {
        languages: {
          en: englishUrl,
          "id-ID": indonesianUrl,
          "x-default": englishUrl,
        },
      }

      return [
        {
          url: englishUrl,
          lastModified: routeLastModified,
          changeFrequency: "weekly" as const,
          priority: 0.9,
          alternates,
        },
        {
          url: indonesianUrl,
          lastModified: routeLastModified,
          changeFrequency: "weekly" as const,
          priority: 0.9,
          alternates,
        },
      ]
    })

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...routeEntries,
    ...localizedEntries,
  ]
}
