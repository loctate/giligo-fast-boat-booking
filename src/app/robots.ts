import type {
  MetadataRoute,
} from "next"

const baseUrl =
  "https://nusagiliboat.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/booking",
        "/checkout",
        "/search",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
