import type { Metadata } from "next"

import RouteLandingPage from "@/components/RouteLandingPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "en",
  path: "/routes/nusa-penida-to-sanur",
  title: "Nusa Penida to Sanur Fast Boat | Nusa Gili Boat",
  description:
    "Compare available fast boat schedules from Nusa Penida to Sanur, Bali, check fares and seat availability, and continue to online booking.",
})

export default function NusaPenidaToSanurPage() {
  return (
    <RouteLandingPage
      locale="en"
      from="Nusa Penida"
      to="Sanur"
      reverseHref="/routes/sanur-to-nusa-penida"
    />
  )
}
