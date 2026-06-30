import type {
  Metadata,
} from "next"

type PublicPageLocale = "en" | "id"

type PublicPageMetadataInput = {
  locale: PublicPageLocale
  path: `/${string}`
  title: string
  description: string
}

export function createPublicPageMetadata({
  locale,
  path,
  title,
  description,
}: PublicPageMetadataInput): Metadata {
  const englishPath = path
  const indonesianPath = `/id${path}`

  const canonical =
    locale === "id"
      ? indonesianPath
      : englishPath

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: englishPath,
        "id-ID": indonesianPath,
        "x-default": englishPath,
      },
    },
  }
}
