import Link from "next/link"

type RouteLandingPageProps = {
  locale: "en" | "id"
  from: string
  to: string
  reverseHref: string
}

export default function RouteLandingPage({
  locale,
  from,
  to,
  reverseHref,
}: RouteLandingPageProps) {
  const isIndonesian = locale === "id"

  const termsHref = isIndonesian
    ? "/id/terms-and-conditions"
    : "/terms-and-conditions"

  const faqHref = isIndonesian
    ? "/id/faq"
    : "/faq"

  const contactHref = isIndonesian
    ? "/id/contact"
    : "/contact"

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-lg font-black text-cyan-700"
          >
            Nusa Gili Boat
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-b from-cyan-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
            {isIndonesian
              ? "Rute Fast Boat"
              : "Fast Boat Route"}
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {isIndonesian
              ? `Fast Boat ${from} ke ${to}`
              : `${from} to ${to} Fast Boat`}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            {isIndonesian
              ? `Cari jadwal fast boat yang tersedia dari ${from} ke ${to}, bandingkan pilihan perjalanan, periksa harga dan ketersediaan kursi, lalu lanjutkan pemesanan secara online melalui Nusa Gili Boat.`
              : `Search available fast boat schedules from ${from} to ${to}, compare travel options, check prices and seat availability, and continue your booking online with Nusa Gili Boat.`}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#top"
              className="rounded-full bg-cyan-700 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
            >
              {isIndonesian
                ? "Cari Tiket Fast Boat"
                : "Search Fast Boat Tickets"}
            </Link>

            <Link
              href={reverseHref}
              className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100"
            >
              {isIndonesian
                ? `Lihat rute ${to} ke ${from}`
                : `View ${to} to ${from}`}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            {isIndonesian
              ? "Jadwal dan ketersediaan"
              : "Schedules and availability"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {isIndonesian
              ? "Jadwal, operator, harga, dan jumlah kursi dapat berbeda menurut tanggal perjalanan. Gunakan pencarian untuk melihat pilihan yang tersedia pada tanggal yang Anda inginkan."
              : "Schedules, operators, fares, and available seats may vary by travel date. Use the search tool to see the options available for your preferred date."}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            {isIndonesian
              ? "Check-in 60 menit lebih awal"
              : "Arrive 60 minutes early"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {isIndonesian
              ? "Penumpang yang telah membeli tiket wajib tiba di lokasi check-in atau boarding minimal 60 menit sebelum waktu keberangkatan."
              : "Passengers with confirmed tickets must arrive at the check-in or boarding location at least 60 minutes before the scheduled departure time."}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            {isIndonesian
              ? "Pesan secara online"
              : "Book online"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {isIndonesian
              ? "Pilih perjalanan yang tersedia, isi data penumpang, tinjau ketentuan perjalanan, dan lanjutkan proses pembayaran melalui website."
              : "Choose an available trip, enter passenger details, review the travel conditions, and continue through the website payment process."}
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <div className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
          <h2 className="text-2xl font-black">
            {isIndonesian
              ? `Siap mencari fast boat ${from} ke ${to}?`
              : `Ready to search ${from} to ${to} fast boats?`}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {isIndonesian
              ? "Gunakan pencarian Nusa Gili Boat untuk melihat jadwal, harga, dan kursi yang tersedia."
              : "Use Nusa Gili Boat search to view current schedules, fares, and available seats."}
          </p>

          <Link
            href="/#top"
            className="mt-6 inline-flex rounded-full bg-cyan-500 px-7 py-3 text-sm font-black text-slate-950"
          >
            {isIndonesian
              ? "Cari Perjalanan"
              : "Search Trips"}
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-600">
          <Link href={termsHref}>
            {isIndonesian
              ? "Syarat & Ketentuan"
              : "Terms & Conditions"}
          </Link>

          <Link href={faqHref}>
            FAQ
          </Link>

          <Link href={contactHref}>
            {isIndonesian
              ? "Hubungi Kami"
              : "Contact"}
          </Link>
        </div>
      </section>
    </main>
  )
}
