import type { Metadata } from "next"

import RouteLandingPage from "@/components/RouteLandingPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "id",
  path: "/routes/sanur-to-nusa-penida",
  title: "Fast Boat Sanur ke Nusa Penida | Nusa Gili Boat",
  description:
    "Cari jadwal fast boat dari Sanur, Bali ke Nusa Penida, periksa harga dan ketersediaan kursi, lalu lanjutkan pemesanan tiket secara online.",
})

export default function SanurToNusaPenidaIdPage() {
  return (
    <RouteLandingPage
      locale="id"
      from="Sanur"
      to="Nusa Penida"
      reverseHref="/id/routes/nusa-penida-to-sanur"
    />
  )
}
