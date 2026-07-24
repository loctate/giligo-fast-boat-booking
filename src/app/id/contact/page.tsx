import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "id",
  path: "/contact",
  title: "Hubungi Kami | Nusa Gili Boat",
  description: "Hubungi Nusa Gili Boat untuk bantuan booking fast boat, jadwal, data penumpang, pembayaran manual QRIS, payment link kartu melalui PayPal, konfirmasi, perubahan, dan pembatalan.",
})

const businessEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "nusagiliboat@gmail.com"

const businessWhatsapp = String(
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP ??
    "6282180126117"
).replace(/\D/g, "")

const businessWhatsappUrl =
  `https://wa.me/${businessWhatsapp}`

function formatWhatsappNumber(
  value: string
): string {
  if (
    value.startsWith("62") &&
    value.length >= 12
  ) {
    const localNumber = value.slice(2)

    return [
      "+62",
      localNumber.slice(0, 3),
      localNumber.slice(3, 7),
      localNumber.slice(7),
    ]
      .filter(Boolean)
      .join(" ")
  }

  return value ? `+${value}` : "Belum dikonfigurasi"
}

export default function ContactPage() {
  return (
    <PublicInfoPage
      locale="id"
      eyebrow="Layanan Pelanggan"
      title="Hubungi Kami"
      description="Hubungi Nusa Gili Boat untuk bantuan pencarian fast boat, booking, data penumpang, pembayaran manual, konfirmasi, perubahan jadwal, pembatalan, dan refund."
      lastUpdated="24 Juli 2026"
    >
      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
        <h2 className="text-xl font-black text-cyan-950">
          Layanan resmi Nusa Gili Boat
        </h2>

        <p className="mt-3 leading-7 text-cyan-900">
          Untuk booking yang sudah dibuat, sertakan kode
          booking, nama penumpang, rute, dan tanggal
          perjalanan agar admin dapat memeriksa permintaan
          dengan lebih cepat.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">
            Email bisnis
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Dukungan melalui email
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Gunakan email untuk pertanyaan umum, dokumen
            booking, permintaan yang terperinci, dan
            kebutuhan yang tidak memerlukan jawaban
            segera.
          </p>

          <a
            href={`mailto:${businessEmail}`}
            className="mt-5 inline-flex break-all font-bold text-cyan-700 transition hover:text-cyan-900"
          >
            {businessEmail}
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">
            WhatsApp
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Bantuan booking dan pembayaran
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Gunakan WhatsApp untuk bantuan booking,
            permintaan instruksi pembayaran QRIS,
            permintaan payment link kartu melalui PayPal,
            dan pertanyaan perjalanan yang mendesak.
          </p>

          <a
            href={businessWhatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex font-bold text-emerald-700 transition hover:text-emerald-900"
          >
            {formatWhatsappNumber(businessWhatsapp)}
          </a>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
            Lokasi operasional
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Jakarta, Indonesia
          </h2>

          <address className="mt-3 not-italic leading-7 text-slate-600">
            Tomang, Grogol Petamburan
            <br />
            Jakarta Barat, DKI Jakarta
            <br />
            Indonesia
          </address>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Nusa Gili Boat merupakan layanan pemesanan
            online. Lokasi operasional ini bukan toko
            fisik atau loket tiket yang menerima kunjungan
            pelanggan secara langsung.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet-700">
            Jam layanan pelanggan
          </p>

          <h2 className="mt-3 text-xl font-black text-slate-950">
            Setiap hari
          </h2>

          <p className="mt-3 text-lg font-bold text-slate-800">
            08.00–20.00 WIB
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Pesan yang diterima di luar jam layanan dapat
            dijawab pada periode layanan berikutnya.
            Informasi operasional mendesak tetap bergantung
            pada pembaruan yang kami terima dari operator
            fast boat.
          </p>
        </article>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Informasi yang perlu disertakan
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Informasi yang lengkap membantu admin
            menemukan dan memeriksa booking Anda.
          </p>
        </div>

        <ul className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
          {[
            "Kode booking apabila sudah tersedia.",
            "Nama pelanggan dan penumpang.",
            "Email dan nomor WhatsApp pelanggan.",
            "Lokasi keberangkatan dan tujuan.",
            "Tanggal dan jadwal perjalanan.",
            "Metode atau status pembayaran.",
            "Penjelasan bantuan yang dibutuhkan.",
            "Bukti pembayaran hanya apabila diminta admin.",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-amber-950">
          Keamanan pembayaran dan akun
        </h2>

        <p className="mt-3 leading-7 text-amber-900">
          Jangan pernah mengirim PIN, OTP, CVV, kata
          sandi perbankan, nomor kartu lengkap, atau
          kredensial finansial rahasia melalui WhatsApp,
          email, maupun formulir kontak. Informasi QRIS
          dan payment link PayPal harus diberikan melalui
          saluran resmi Nusa Gili Boat.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">
          Informasi yang dapat membantu
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Pelajari jawaban dan kebijakan berikut sebelum
          menghubungi layanan pelanggan. Halaman tersebut
          menjelaskan proses booking, pembayaran,
          pembatalan, refund, dan pengelolaan data pribadi.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/id/faq"
            className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Pertanyaan yang Sering Diajukan
          </Link>

          <Link
            href="/id/terms-and-conditions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Syarat dan Ketentuan
          </Link>

          <Link
            href="/id/refund-and-cancellation-policy"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Kebijakan Refund
          </Link>

          <Link
            href="/id/privacy-policy"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Kebijakan Privasi
          </Link>
        </div>
      </section>
    </PublicInfoPage>
  )
}
