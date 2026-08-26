import type {
  Metadata,
} from "next"

import {
  Geist,
  Geist_Mono,
} from "next/font/google"

import ConsentBanner from "@/components/ConsentBanner"
import GoogleTagManagerLoader from "@/components/GoogleTagManagerLoader"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://nusagiliboat.com",
  ),
  title:
    "Nusa Gili Boat | Fast Boat Booking",
  description:
    "Search and book fast boat tickets between Bali, Nusa Penida, the Gili Islands, and Lombok.",
  applicationName:
    "Nusa Gili Boat",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <GoogleTagManagerLoader />
        <ConsentBanner />
      </body>
    </html>
  )
}
