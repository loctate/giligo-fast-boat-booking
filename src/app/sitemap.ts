import type {
  MetadataRoute,
} from "next"

const baseUrl =
  "https://nusagiliboat.com"

const localizedPaths = [
  "/about",
  "/contact",
  "/terms-and-conditions",
  "/privacy-policy",
  "/refund-and-cancellation-policy",
] as const

const lastModified = new Date(
  "2026-06-30T00:00:00+08:00",
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

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...localizedEntries,
  ]
}
