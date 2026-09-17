import type { Metadata } from "next"

import RouteLandingPage from "@/components/RouteLandingPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "id",
  path: "/routes/nusa-penida-to-sanur",
  title: "Fast Boat Nusa Penida ke Sanur | Nusa Gili Boat",
  description:
    "Cari jadwal fast boat dari Nusa Penida ke Sanur, Bali, periksa harga dan ketersediaan kursi, lalu lanjutkan pemesanan tiket secara online.",
})

export default function NusaPenidaToSanurIdPage() {
  return (
    <RouteLandingPage
      locale="id"
      from="Nusa Penida"
      to="Sanur"
      reverseHref="/id/routes/sanur-to-nusa-penida"
    />
  )
}
