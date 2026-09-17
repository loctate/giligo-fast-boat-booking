import type { Metadata } from "next"

import RouteLandingPage from "@/components/RouteLandingPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "en",
  path: "/routes/sanur-to-nusa-penida",
  title: "Sanur to Nusa Penida Fast Boat | Nusa Gili Boat",
  description:
    "Compare available fast boat schedules from Sanur, Bali to Nusa Penida, check fares and seat availability, and continue to online booking.",
})

export default function SanurToNusaPenidaPage() {
  return (
    <RouteLandingPage
      locale="en"
      from="Sanur"
      to="Nusa Penida"
      reverseHref="/routes/nusa-penida-to-sanur"
    />
  )
}
